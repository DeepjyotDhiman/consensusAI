import type { ConsensusInput, ConsensusOutput } from "@consensus/shared";
export interface ConsensusEngine {
    generateConsensus(input: ConsensusInput): Promise<ConsensusOutput>;
}
export type { ConsensusInput, ConsensusOutput };
//# sourceMappingURL=ConsensusEngine.d.ts.map