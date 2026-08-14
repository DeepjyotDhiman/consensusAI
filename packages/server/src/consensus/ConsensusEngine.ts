import type { ConsensusInput, ConsensusOutput } from "@consensus/shared";

// LLM SWAP SEAM
// To replace with an LLM engine:
//   1. Create OllamaConsensusEngine.ts implementing this interface
//   2. Change the import in socket/handlers.ts
//   3. No other files change.
//
// Contract:
//   Input:  members[] with embedded preferences
//   Output: recommendation, candidateId, roleAllocation, memberScores,
//           groupScore, conflicts, explanation, runnerUp

export interface ConsensusEngine {
  generateConsensus(input: ConsensusInput): Promise<ConsensusOutput>;
}

// Re-export I/O types so consumers can import from a single location
export type { ConsensusInput, ConsensusOutput };
