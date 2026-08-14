import type { ConsensusInput, ConsensusOutput } from "@consensus/shared";
import type { ConsensusEngine } from "./ConsensusEngine.js";
export declare class MockConsensusEngine implements ConsensusEngine {
    generateConsensus(input: ConsensusInput): Promise<ConsensusOutput>;
}
//# sourceMappingURL=MockConsensusEngine.d.ts.map