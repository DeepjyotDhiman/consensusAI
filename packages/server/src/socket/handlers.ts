import { Server, Socket } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  GroupJoinPayload,
  PreferenceUpdatePayload,
  ConsensusOutput,
} from "@consensus/shared";
import * as PreferenceService from "../services/PreferenceService.js";
import { OllamaConsensusEngine } from "../consensus/OllamaConsensusEngine.js";
import { MockConsensusEngine } from "../consensus/MockConsensusEngine.js";
import db from "../db/db.js";

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type Sock = Socket<ClientToServerEvents, ServerToClientEvents>;

const useOllama = process.env["CONSENSUS_ENGINE"] === "ollama";
const engine = useOllama ? new OllamaConsensusEngine() : new MockConsensusEngine();

export function registerHandlers(io: IO): void {
  io.on("connection", (socket: Sock) => {
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
function handleGroupJoin(io: IO, socket: Sock) {
  return async ({ groupId }: GroupJoinPayload) => {
    try {
      await socket.join(groupId);

      const membersWithPrefs = PreferenceService.getAllForGroup(groupId);

      // Build preferencesMap keyed by groupMemberId
      const preferencesMap: Record<string, import("@consensus/shared").Preference | null> = {};
      for (const { member, preference } of membersWithPrefs) {
        preferencesMap[member.id] = preference ?? null;
      }

      // Latest consensus result — compute on-the-fly if DB has none yet but we have ≥2 members with prefs
      let latestRow = db
        .prepare<[string], Record<string, unknown>>(
          "SELECT * FROM consensus_results WHERE group_id = ? ORDER BY generated_at DESC LIMIT 1"
        )
        .get(groupId);

      if (!latestRow) {
        const qualified = membersWithPrefs
          .filter(({ preference }) =>
            preference !== null &&
            (preference.skills.length > 0 || preference.availabilityHours > 0)
          )
          .map(({ member, user, preference }) => ({
            userId: member.userId,
            displayName: user.displayName,
            preferences: preference!,
          }));

        if (qualified.length >= 2) {
          try {
            const result = await engine.generateConsensus({ members: qualified });
            const resultId = crypto.randomUUID();
            db.prepare(
              `INSERT INTO consensus_results
                 (id, group_id, candidate_id, recommendation, runner_up,
                  member_scores, group_score, role_allocation, conflicts, explanation, generated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).run(
              resultId,
              groupId,
              result.candidateId,
              result.recommendation,
              result.runnerUp,
              JSON.stringify(result.memberScores),
              result.groupScore,
              JSON.stringify(result.roleAllocation),
              JSON.stringify(result.conflicts),
              JSON.stringify(result.explanation),
              Date.now()
            );
            latestRow = db
              .prepare<[string], Record<string, unknown>>(
                "SELECT * FROM consensus_results WHERE id = ?"
              )
              .get(resultId);
          } catch (e) {
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
        })) as unknown as import("@consensus/shared").GroupMember[],
        preferencesMap,
        latestConsensus,
      });
    } catch (err) {
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
function handlePreferenceUpdate(io: IO, socket: Sock) {
  return async ({ groupMemberId, preferences }: PreferenceUpdatePayload) => {
    try {
      // 1. Save preference to DB
      const saved = PreferenceService.upsert(groupMemberId, preferences);

      // 2. Determine the groupId for this member
      const memberRow = db
        .prepare<[string], { group_id: string }>(
          "SELECT group_id FROM group_members WHERE id = ?"
        )
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
        .filter(
          ({ preference }) =>
            preference !== null &&
            ((Array.isArray(preference.skills) && preference.skills.length > 0) ||
              (typeof preference.skills === "string" && (preference.skills as string).trim().length > 0) ||
              preference.availabilityHours > 0)
        )
        .map(({ member, user, preference }) => ({
          userId: member.userId,
          displayName: user.displayName,
          preferences: preference!,
        }));

      console.log(`[Server Socket] Received preference:update for member: ${groupMemberId}, room: ${groupId}`);
      console.log(`[Server Socket] Qualified members count: ${membersWithPrefs.length}`);

      // 5. Only run consensus if >= 2 members have preferences
      if (membersWithPrefs.length < 2) {
        console.log("[Server Socket] Waiting for at least 2 members with preferences before generating consensus");
        return;
      }

      // 6. Run consensus engine
      console.log(`[Server Socket] Generating consensus for room: ${groupId}...`);
      const result = await engine.generateConsensus({ members: membersWithPrefs });
      console.log("[Server Socket] Generated & Emitting consensus:updated:", result.recommendation, `(Group Score: ${result.groupScore}%)`);

      // 7. Persist consensus result
      const resultId = crypto.randomUUID();
      db.prepare(
        `INSERT INTO consensus_results
           (id, group_id, candidate_id, recommendation, runner_up,
            member_scores, group_score, role_allocation, conflicts, explanation, generated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        resultId,
        groupId,
        result.candidateId,
        result.recommendation,
        result.runnerUp,
        JSON.stringify(result.memberScores),
        result.groupScore,
        JSON.stringify(result.roleAllocation),
        JSON.stringify(result.conflicts),
        JSON.stringify(result.explanation),
        Date.now()
      );

      // 8. Broadcast consensus update to entire room
      io.to(groupId).emit("consensus:updated", { result });
    } catch (err) {
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
function parseConsensusRow(row: Record<string, unknown>): ConsensusOutput {
  return {
    recommendation: (row["recommendation"] as string) ?? (row["candidate_id"] as string) ?? "",
    candidateId: row["candidate_id"] as string,
    memberScores: JSON.parse((row["member_scores"] as string) ?? "{}") as Record<string, number>,
    groupScore: row["group_score"] as number,
    roleAllocation: JSON.parse((row["role_allocation"] as string) ?? "{}") as Record<string, string>,
    conflicts: JSON.parse((row["conflicts"] as string) ?? "[]"),
    explanation: JSON.parse((row["explanation"] as string) ?? "[]"),
    runnerUp: (row["runner_up"] as string) ?? "",
  };
}
