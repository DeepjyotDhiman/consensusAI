import * as PreferenceService from "../services/PreferenceService.js";
import { OllamaConsensusEngine } from "../consensus/OllamaConsensusEngine.js";
import { MockConsensusEngine } from "../consensus/MockConsensusEngine.js";
import db from "../db/db.js";
const useOllama = process.env["CONSENSUS_ENGINE"] === "ollama" || !process.env["CONSENSUS_ENGINE"];
const engine = useOllama ? new OllamaConsensusEngine() : new MockConsensusEngine();
export function registerHandlers(io) {
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        socket.on("group:join", handleGroupJoin(io, socket));
        socket.on("preference:update", handlePreferenceUpdate(io, socket));
        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
}
// ---------------------------------------------------------------------------
// group:join — send full snapshot to the joining socket
// ---------------------------------------------------------------------------
function handleGroupJoin(io, socket) {
    return async ({ groupId }) => {
        try {
            await socket.join(groupId);
            const membersWithPrefs = PreferenceService.getAllForGroup(groupId);
            // Build preferencesMap keyed by groupMemberId
            const preferencesMap = {};
            for (const { member, preference } of membersWithPrefs) {
                preferencesMap[member.id] = preference ?? null;
            }
            // Latest consensus result — compute on-the-fly if DB has none yet but we have ≥2 members with prefs
            let latestRow = db
                .prepare("SELECT * FROM consensus_results WHERE group_id = ? ORDER BY generated_at DESC LIMIT 1")
                .get(groupId);
            if (!latestRow) {
                const qualified = membersWithPrefs
                    .filter(({ preference }) => preference !== null &&
                    (preference.skills.length > 0 || preference.availabilityHours > 0))
                    .map(({ member, user, preference }) => ({
                    userId: member.userId,
                    displayName: user.displayName,
                    preferences: preference,
                }));
                if (qualified.length >= 2) {
                    try {
                        const result = await engine.generateConsensus({ members: qualified });
                        const resultId = crypto.randomUUID();
                        db.prepare(`INSERT INTO consensus_results
                 (id, group_id, candidate_id, recommendation, runner_up,
                  member_scores, group_score, role_allocation, conflicts, explanation, generated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(resultId, groupId, result.candidateId, result.recommendation, result.runnerUp, JSON.stringify(result.memberScores), result.groupScore, JSON.stringify(result.roleAllocation), JSON.stringify(result.conflicts), JSON.stringify(result.explanation), Date.now());
                        latestRow = db
                            .prepare("SELECT * FROM consensus_results WHERE id = ?")
                            .get(resultId);
                    }
                    catch (e) {
                        console.warn("Initial consensus computation failed:", e);
                    }
                }
            }
            const latestConsensus = latestRow ? parseConsensusRow(latestRow) : null;
            // Emit snapshot to this socket only — flatten member+user into MemberWithDisplay shape
            socket.emit("group:state", {
                members: membersWithPrefs.map(({ member, user }) => ({
                    id: member.id,
                    groupId: member.groupId,
                    userId: member.userId,
                    joinedAt: member.joinedAt,
                    displayName: user.displayName,
                    avatarColor: user.avatarColor,
                })),
                preferencesMap,
                latestConsensus,
            });
        }
        catch (err) {
            console.error("group:join error", err);
            socket.emit("error", {
                message: err instanceof Error ? err.message : "Failed to join group",
            });
        }
    };
}
// ---------------------------------------------------------------------------
// preference:update — save, recalculate, broadcast
// ---------------------------------------------------------------------------
function handlePreferenceUpdate(io, socket) {
    return async ({ groupMemberId, preferences }) => {
        try {
            // 1. Save preference to DB
            const saved = PreferenceService.upsert(groupMemberId, preferences);
            // 2. Determine the groupId for this member
            const memberRow = db
                .prepare("SELECT group_id FROM group_members WHERE id = ?")
                .get(groupMemberId);
            if (!memberRow) {
                socket.emit("error", { message: "Member not found" });
                return;
            }
            const groupId = memberRow.group_id;
            // 3. Broadcast preference update to entire room (including sender)
            io.to(groupId).emit("preference:updated", {
                groupMemberId,
                preferences: saved,
            });
            // 4. Gather all members with meaningful preferences
            const allMembersData = PreferenceService.getAllForGroup(groupId);
            const membersWithPrefs = allMembersData
                .filter(({ preference }) => preference !== null &&
                (preference.skills.length > 0 || preference.availabilityHours > 0))
                .map(({ member, user, preference }) => ({
                userId: member.userId,
                displayName: user.displayName,
                preferences: preference,
            }));
            // 5. Only run consensus if >= 2 members have preferences
            if (membersWithPrefs.length < 2) {
                return;
            }
            // 6. Run consensus engine
            const result = await engine.generateConsensus({ members: membersWithPrefs });
            // 7. Persist consensus result
            const resultId = crypto.randomUUID();
            db.prepare(`INSERT INTO consensus_results
           (id, group_id, candidate_id, recommendation, runner_up,
            member_scores, group_score, role_allocation, conflicts, explanation, generated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(resultId, groupId, result.candidateId, result.recommendation, result.runnerUp, JSON.stringify(result.memberScores), result.groupScore, JSON.stringify(result.roleAllocation), JSON.stringify(result.conflicts), JSON.stringify(result.explanation), Date.now());
            // 8. Broadcast consensus update to entire room
            io.to(groupId).emit("consensus:updated", { result });
        }
        catch (err) {
            console.error("preference:update error", err);
            socket.emit("error", {
                message: err instanceof Error ? err.message : "Consensus failed",
            });
        }
    };
}
// ---------------------------------------------------------------------------
// parseConsensusRow — deserialise a DB row into ConsensusOutput
// ---------------------------------------------------------------------------
function parseConsensusRow(row) {
    return {
        recommendation: row["recommendation"] ?? row["candidate_id"] ?? "",
        candidateId: row["candidate_id"],
        memberScores: JSON.parse(row["member_scores"] ?? "{}"),
        groupScore: row["group_score"],
        roleAllocation: JSON.parse(row["role_allocation"] ?? "{}"),
        conflicts: JSON.parse(row["conflicts"] ?? "[]"),
        explanation: JSON.parse(row["explanation"] ?? "[]"),
        runnerUp: row["runner_up"] ?? "",
    };
}
//# sourceMappingURL=handlers.js.map