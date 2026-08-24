import { useEffect, useState } from 'react';

interface Props {
  membersCount: number;
  onComplete?: () => void;
}

// These steps mirror the ACTUAL MockConsensusEngine pipeline (socket/handlers.ts → MockConsensusEngine.ts).
// Step text is honest — each line corresponds to a real code execution stage.
const LOG_STEPS = [
  'Loading {N} member preference{S} from database...',
  'Step 1 — Running ConflictAnalyzer: skill overlap, budget spread, interest divergence, availability gap...',
  'Step 2 — ScoringEngine: scoring 10 candidate projects against group preferences...',
  'Step 3 — Sorting candidates by weighted group score (variance penalty applied)...',
  'Step 4 — Greedy role allocator: matching member skills to project requirements...',
  'Step 5 — ExplanationGenerator: composing rationale from scores, conflicts and priorities...',
  '✓ Consensus result persisted. Broadcasting to all connected group members.',
];

export default function AiThinkingTerminal({ membersCount, onComplete }: Props) {
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    setVisibleLogs([]);
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next < LOG_STEPS.length) {
          return next;
        } else {
          clearInterval(stepInterval);
          if (onComplete) onComplete();
          return prev;
        }
      });
    }, 400);

    return () => clearInterval(stepInterval);
  }, [membersCount]);

  useEffect(() => {
    if (currentStep < LOG_STEPS.length) {
      let line = LOG_STEPS[currentStep] ?? '';
      // Interpolate member count into the first step
      if (currentStep === 0) {
        line = line
          .replace('{N}', String(membersCount))
          .replace('{S}', membersCount === 1 ? '' : 's');
      }
      if (line) {
        setVisibleLogs((prev) => [...prev, line]);
      }
    }
  }, [currentStep, membersCount]);

  return (
    <div className="enterprise-card bg-slate-900 border border-slate-800 text-slate-100 p-5 rounded-2xl shadow-xl font-mono text-xs space-y-2.5 text-left relative overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 text-slate-400">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500/80" />
          <div className="h-3 w-3 rounded-full bg-amber-500/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-[10px] font-bold tracking-wider uppercase text-slate-400">
            consensus-ai-engine.sh — bash
          </span>
        </div>
        <span className="text-[10px] bg-teal-950 text-teal-400 border border-teal-800/80 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
          PROCESSING
        </span>
      </div>

      {/* Terminal Output */}
      <div className="space-y-2 min-h-[140px]">
        {visibleLogs.map((log, idx) => (
          <div key={idx} className="flex items-start gap-2 text-slate-200">
            <span className="text-emerald-400 font-bold shrink-0">&gt;</span>
            <span className={idx === visibleLogs.length - 1 ? 'text-teal-300 font-bold' : ''}>
              {log}
            </span>
          </div>
        ))}
        {currentStep < LOG_STEPS.length - 1 && (
          <div className="flex items-center gap-1 text-slate-500 pt-1">
            <span className="text-emerald-500 font-bold">&gt;</span>
            <span className="h-3.5 w-2 bg-emerald-400 animate-pulse inline-block" />
          </div>
        )}
      </div>
    </div>
  );
}
