import { Link } from 'react-router-dom';
import type { ConsensusOutput } from '@consensus/shared';
import type { MemberWithDisplay } from '../store/groupStore.ts';
import ScoreBar from './ScoreBar.tsx';
import ExplanationPanel from './ExplanationPanel.tsx';
import { triggerConfetti } from '../utils/confetti.ts';

interface Props {
  consensusResult: ConsensusOutput | null;
  members: MemberWithDisplay[];
  groupId: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-rose-600';
}

export default function ConsensusSummaryPanel({ consensusResult, members, groupId }: Props) {
  const handleDownloadPDF = () => {
    triggerConfetti();
    setTimeout(() => {
      window.print();
    }, 400);
  };

  if (!consensusResult) {
    const hasEnoughMembers = members.length >= 2;
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3 bg-slate-50 border border-slate-200 rounded-2xl">
        {hasEnoughMembers ? (
          <>
            <div className="relative flex items-center justify-center my-1">
              <span className="h-10 w-10 rounded-full bg-teal-600/20 animate-ping absolute" />
              <div className="h-10 w-10 rounded-full bg-teal-600 flex items-center justify-center text-white text-lg font-bold shadow-md z-10">
                🤖
              </div>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Calculating AI Consensus...
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 max-w-xs mx-auto">
                Analyzing member preferences, scoring candidate projects, and optimizing role allocations in real time.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-lg mb-1">
              👥
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700">Waiting for Team Members</h3>
              <p className="text-xs text-slate-500 font-normal mt-1 max-w-xs mx-auto">
                At least 2 team members must join and add preferences to compute group consensus.
              </p>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      {/* Group score + project title */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-teal-50/60 p-4 rounded-xl border border-teal-200">
        <div>
          <p className="text-[10px] text-teal-800 uppercase font-extrabold tracking-wider mb-0.5">Group Score</p>
          <span className={`text-4xl font-black tabular-nums ${scoreColor(consensusResult.groupScore)}`}>
            {consensusResult.groupScore}%
          </span>
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="text-[10px] text-teal-800 uppercase font-extrabold tracking-wider mb-0.5">Recommended Project</p>
          <p className="text-base font-extrabold text-slate-900 truncate">
            {consensusResult.recommendation}
          </p>
          <span className="inline-block mt-1 text-[10px] bg-teal-600 text-white font-extrabold px-2 py-0.5 rounded-full shadow-xs">
            {consensusResult.candidateId}
          </span>
        </div>
      </div>

      {/* Member score bars */}
      {members.length > 0 && (
        <div className="space-y-2">
          {members.map((member) => {
            const score = consensusResult.memberScores[member.userId] ?? 0;
            return (
              <ScoreBar
                key={member.id}
                label={member.displayName}
                score={score}
              />
            );
          })}
        </div>
      )}

      {/* First 2 explanation points */}
      {consensusResult.explanation.length > 0 && (
        <div className="pt-1">
          <ExplanationPanel explanation={consensusResult.explanation} maxItems={2} />
        </div>
      )}

      {/* Link to full result */}
      <div className="pt-2 flex items-center justify-between gap-3">
        <Link
          to={`/group/${groupId}/result`}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-teal-600 hover:text-teal-700 transition-colors"
        >
          <span>View Full Group Report & Role Allocations</span>
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
          </svg>
        </Link>
        <button
          onClick={handleDownloadPDF}
          className="enterprise-btn-dark text-xs py-2 px-4 cursor-pointer flex items-center gap-1.5"
        >
          📄 Download Report (PDF)
        </button>
      </div>
    </div>
  );
}
