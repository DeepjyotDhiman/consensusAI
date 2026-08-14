import type { ConsensusInput, ConsensusOutput } from "@consensus/shared";
import type { ConsensusEngine } from "./ConsensusEngine.js";
import { MockConsensusEngine } from "./MockConsensusEngine.js";
import { CANDIDATES } from "../data/candidates.js";

export class OllamaConsensusEngine implements ConsensusEngine {
  private fallbackEngine: MockConsensusEngine;
  private ollamaUrl: string;
  private model: string;

  constructor(
    ollamaUrl = process.env["OLLAMA_URL"] || "http://localhost:11434",
    model = process.env["OLLAMA_MODEL"] || "llama3"
  ) {
    this.fallbackEngine = new MockConsensusEngine();
    this.ollamaUrl = ollamaUrl;
    this.model = model;
  }

  async generateConsensus(input: ConsensusInput): Promise<ConsensusOutput> {
    try {
      const prompt = this.buildPrompt(input);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          format: "json",
        }),
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama returned status ${response.status}`);
      }

      const data = (await response.json()) as { response?: string };
      if (!data.response) {
        throw new Error("Empty response from Ollama");
      }

      const parsed = JSON.parse(data.response) as Partial<ConsensusOutput>;
      if (!parsed.recommendation || !parsed.candidateId || typeof parsed.groupScore !== "number") {
        throw new Error("Invalid schema returned by Ollama");
      }

      return {
        recommendation: parsed.recommendation,
        candidateId: parsed.candidateId,
        roleAllocation: parsed.roleAllocation ?? {},
        memberScores: parsed.memberScores ?? {},
        groupScore: parsed.groupScore,
        conflicts: parsed.conflicts ?? [],
        explanation: parsed.explanation ?? [],
        runnerUp: parsed.runnerUp ?? "None",
      };
    } catch (err) {
      console.warn(
        `[OllamaConsensusEngine] Falling back to MockConsensusEngine (${
          err instanceof Error ? err.message : String(err)
        })`
      );
      return this.fallbackEngine.generateConsensus(input);
    }
  }

  private buildPrompt(input: ConsensusInput): string {
    return `
You are ConsensusAI, an intelligent project matching engine for hackathon teams.
Analyze the following team member preferences and candidate project options, then output a JSON object.

Candidates List:
${JSON.stringify(CANDIDATES, null, 2)}

Team Member Preferences:
${JSON.stringify(input.members, null, 2)}

Return ONLY a JSON object with this exact structure:
{
  "recommendation": "<winning project title>",
  "candidateId": "<winning candidate id e.g. PROJ-01>",
  "runnerUp": "<runner up project title>",
  "groupScore": <number 0 to 100>,
  "memberScores": { "<userId>": <score 0-100> },
  "roleAllocation": { "<userId>": "<assigned role/skill>" },
  "conflicts": [
    { "type": "skill|budget|schedule|interest", "severity": "high|medium|low", "description": "<text>" }
  ],
  "explanation": [
    "<bullet point 1 explaining trade-off>",
    "<bullet point 2>"
  ]
}
`;
  }
}
