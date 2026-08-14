import type { ConsensusInput, ConsensusOutput } from "@consensus/shared";
import type { ConsensusEngine } from "./ConsensusEngine.js";
export declare class OllamaConsensusEngine implements ConsensusEngine {
    private fallbackEngine;
    private ollamaUrl;
    private model;
    constructor(ollamaUrl?: string, model?: string);
    generateConsensus(input: ConsensusInput): Promise<ConsensusOutput>;
    private buildPrompt;
}
//# sourceMappingURL=OllamaConsensusEngine.d.ts.map