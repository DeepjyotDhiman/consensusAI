import { z } from "zod";
import db from "../db/db.js";
import * as PreferenceService from "../services/PreferenceService.js";
import { MockConsensusEngine } from "../consensus/MockConsensusEngine.js";
import { v4 as uuidv4 } from "uuid";
import { verifyToken } from "../services/authService.js";
// ── The engine instance — MockConsensusEngine is the sole source of truth ────
// OllamaConsensusEngine is only loaded if explicitly configured
async function getEngine() {
    if (process.env["CONSENSUS_ENGINE"] === "ollama") {
        const { OllamaConsensusEngine } = await import("../consensus/OllamaConsensusEngine.js");
        return new OllamaConsensusEngine();
    }
    return new MockConsensusEngine();
}
// ── Validation schemas ────────────────────────────────────────────────────────
const preferencePayloadSchema = z.object({
    groupMemberId: z.string().min(1),
    preferences: z.object({
        skills: z.union([z.string(), z.array(z.string())]),
        interests: z.union([z.string(), z.array(z.string())]),
        availabilityHours: z.number().min(0).max(168),
        budget: z.union([z.number().min(0), z.null()]).optional(),
        learningGoals: z.union([z.string(), z.array(z.string())]).optional(),
        priorities: z.union([z.string(), z.array(z.string())]).optional(),
        notes: z.string().optional(),
    }),
});
const preferenceSubmitSchema = preferencePayloadSchema; // same shape; submittedAt is set server-side
const consensusGenerateSchema = z.object({
    groupId: z.string().min(1, "groupId is required"),
    userId: z.string().optional(),
});
const groupJoinSchema = z.object({
    groupId: z.string().min(1, "groupId is required"),
    userId: z.string().optional(),
});
// ── Helper: get full group state snapshot ────────────────────────────────────
function getGroupStateSnapshot(groupId) {
    const memberRows = db
        .prepare("SELECT * FROM group_members WHERE group_id = ?")
        .all(groupId);
    const members = memberRows.map((m) => {
        const user = db
            .prepare("SELECT * FROM users WHERE id = ?")
            .get(m.user_id);
        return {
            id: m.id,
            groupId: groupId,
            userId: m.user_id,
            role: m.role,
            joinedAt: m.joined_at,
            displayName: user?.display_name ?? "Unknown",
            avatarColor: user?.avatar_color ?? "#ccc",
        };
    });
    const preferencesMap = {};
    for (const m of memberRows) {
        const pref = PreferenceService.get(m.id);
        preferencesMap[m.id] = pref;
    }
    const latestRow = db
        .prepare("SELECT * FROM consensus_results WHERE group_id = ? ORDER BY generated_at DESC LIMIT 1")
        .get(groupId);
    const latestConsensus = latestRow ? consensusRowToOutput(latestRow) : null;
    return { members, preferencesMap, latestConsensus };
}
function consensusRowToOutput(row) {
    return {
        recommendation: row.recommendation,
        candidateId: row.candidate_id,
        runnerUp: row.runner_up,
        memberScores: JSON.parse(row.member_scores || "{}"),
        groupScore: row.group_score,
        roleAllocation: JSON.parse(row.role_allocation || "{}"),
        conflicts: JSON.parse(row.conflicts || "[]"),
        explanation: JSON.parse(row.explanation || "[]"),
        memberBreakdowns: JSON.parse(row.member_breakdowns || "{}"),
    };
}
// ── Helper: check if all non-leader members have submitted ───────────────────
function areAllMembersSubmitted(groupId) {
    const memberRows = db
        .prepare("SELECT * FROM group_members WHERE group_id = ?")
        .all(groupId);
    if (memberRows.length < 2)
        return false;
    for (const m of memberRows) {
        const pref = PreferenceService.get(m.id);
        if (!pref || pref.submittedAt == null) {
            return false;
        }
    }
    return true;
}
async function runAndBroadcastConsensus(io, groupId) {
    const allData = PreferenceService.getAllForGroup(groupId);
    const members = allData
        .filter(({ preference }) => preference !== null)
        .map(({ member, user, preference }) => ({
        userId: member.userId,
        displayName: user.displayName,
        avatarColor: user.avatarColor,
        preferences: preference,
    }));
    if (members.length < 2) {
        console.log(`[Consensus] Cannot generate consensus for group ${groupId}: less than 2 members with preferences`);
        return;
    }
    const input = { members };
    const engine = await getEngine();
    const result = await engine.generateConsensus(input);
    // Persist result
    const resultId = uuidv4();
    db.prepare(`INSERT INTO consensus_results
       (id, group_id, candidate_id, recommendation, runner_up,
        member_scores, group_score, role_allocation, conflicts, explanation,
        member_breakdowns, generated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(resultId, groupId, result.candidateId, result.recommendation, result.runnerUp ?? "", JSON.stringify(result.memberScores), result.groupScore, JSON.stringify(result.roleAllocation), JSON.stringify(result.conflicts), JSON.stringify(result.explanation), JSON.stringify(result.memberBreakdowns ?? {}), Date.now());
    io.to(groupId).emit("consensus:updated", { result });
    console.log(`[Consensus] Generated for group ${groupId}: "${result.recommendation}" (${result.groupScore}%)`);
}
// ── Main handler registration ────────────────────────────────────────────────
export function registerHandlers(io) {
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (typeof token !== "string" || !token) {
                return next(new Error("Authentication required"));
            }
            const user = verifyToken(token);
            if (!user) {
                return next(new Error("Invalid or expired authentication token"));
            }
            socket.data.user = user;
            next();
        }
        catch {
            next(new Error("Socket authentication failed"));
        }
    });
    io.on("connection", (socket) => {
        // ── group:join ────────────────────────────────────────────────────────────
        socket.on("group:join", async (payload) => {
            const parsed = groupJoinSchema.safeParse(payload);
            if (!parsed.success) {
                socket.emit("error", { message: "Invalid join payload" });
                return;
            }
            const { groupId } = parsed.data;
            const userId = socket.data.user.userId;
            const group = db
                .prepare("SELECT * FROM groups WHERE id = ?")
                .get(groupId);
            if (!group) {
                socket.emit("error", { message: "Group not found" });
                return;
            }
            const member = db
                .prepare("SELECT * FROM group_members WHERE group_id = ? AND user_id = ?")
                .get(groupId, userId);
            if (!member) {
                socket.emit("error", {
                    message: "You are not a member of this group.",
                });
                return;
            }
            socket.join(groupId);
            console.log(`[Socket] User ${userId} joined room ${groupId}`);
            // Send full state snapshot to all members in the group room
            const snapshot = getGroupStateSnapshot(groupId);
            io.to(groupId).emit("group:state", snapshot);
        });
        // ── preference:update (auto-save — does NOT trigger consensus) ────────────
        socket.on("preference:update", async (payload) => {
            const parsed = preferencePayloadSchema.safeParse(payload);
            if (!parsed.success) {
                socket.emit("error", { message: `Invalid preference payload: ${parsed.error.message}` });
                return;
            }
            const { groupMemberId, preferences } = parsed.data;
            // Determine which group this member belongs to
            const memberRow = db
                .prepare("SELECT * FROM group_members WHERE id = ?")
                .get(groupMemberId);
            if (!memberRow) {
                socket.emit("error", { message: "Group member not found" });
                return;
            }
            const authenticatedUserId = socket.data.user.userId;
            if (memberRow.user_id !== authenticatedUserId) {
                socket.emit("error", {
                    message: "You can only update your own preferences.",
                });
                return;
            }
            try {
                // Save preferences WITHOUT touching submitted_at
                const saved = PreferenceService.upsert(groupMemberId, preferences);
                // Broadcast the updated preference to the group room
                io.to(memberRow.group_id).emit("preference:updated", {
                    groupMemberId,
                    preferences: saved,
                });
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                socket.emit("error", { message: `Failed to save preference: ${msg}` });
            }
        });
        // ── preference:submit (formal submission — marks submitted_at and may trigger consensus) ──
        socket.on("preference:submit", async (payload) => {
            const parsed = preferenceSubmitSchema.safeParse(payload);
            if (!parsed.success) {
                socket.emit("error", { message: `Invalid submit payload: ${parsed.error.message}` });
                return;
            }
            const { groupMemberId, preferences } = parsed.data;
            const memberRow = db
                .prepare("SELECT * FROM group_members WHERE id = ?")
                .get(groupMemberId);
            if (!memberRow) {
                socket.emit("error", { message: "Group member not found" });
                return;
            }
            const authenticatedUserId = socket.data.user.userId;
            if (memberRow.user_id !== authenticatedUserId) {
                socket.emit("error", {
                    message: "You can only submit your own preferences.",
                });
                return;
            }
            try {
                // Save preferences AND set submitted_at to now
                const saved = PreferenceService.upsert(groupMemberId, {
                    ...preferences,
                    submittedAt: Date.now(),
                });
                // Broadcast updated preference to the group room
                io.to(memberRow.group_id).emit("preference:updated", {
                    groupMemberId,
                    preferences: saved,
                });
                // Auto-trigger consensus if ALL members have now submitted
                if (areAllMembersSubmitted(memberRow.group_id)) {
                    console.log(`[Consensus] All members submitted in group ${memberRow.group_id} — auto-generating`);
                    await runAndBroadcastConsensus(io, memberRow.group_id);
                }
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                socket.emit("error", { message: `Failed to submit preferences: ${msg}` });
            }
        });
        // ── consensus:generate (leader-only explicit trigger) ─────────────────────
        socket.on("consensus:generate", async (payload) => {
            const parsed = consensusGenerateSchema.safeParse(payload);
            if (!parsed.success) {
                socket.emit("error", { message: "Invalid generate payload" });
                return;
            }
            const { groupId } = parsed.data;
            const userId = socket.data.user.userId;
            // Verify the requester is the group leader
            const leaderRow = db
                .prepare("SELECT * FROM group_members WHERE group_id = ? AND user_id = ? AND role = 'leader'")
                .get(groupId, userId);
            if (!leaderRow) {
                socket.emit("error", { message: "Only the group leader can generate the consensus." });
                return;
            }
            // Need at least 2 members with preferences to generate
            const allData = PreferenceService.getAllForGroup(groupId);
            const membersWithPrefs = allData.filter(({ preference }) => preference != null);
            if (membersWithPrefs.length < 2) {
                socket.emit("error", { message: "At least 2 members must submit preferences to generate consensus." });
                return;
            }
            try {
                await runAndBroadcastConsensus(io, groupId);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                socket.emit("error", { message: `Consensus generation failed: ${msg}` });
            }
        });
        socket.on("disconnect", () => {
            console.log("[Socket] Client disconnected:", socket.id);
        });
    });
}
//# sourceMappingURL=handlers.js.map