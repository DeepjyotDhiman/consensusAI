import { Link } from 'react-router-dom';
import type { ConsensusOutput } from '@consensus/shared';
import type { MemberWithDisplay } from '../store/groupStore.ts';
import ScoreBar from './ScoreBar.tsx';
import ExplanationPanel from './ExplanationPanel.tsx';

interface Props {
  consensusResult: ConsensusOutput | null;
  members: MemberWithDisplay[];
  groupId: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

export default function ConsensusSummaryPanel({ consensusResult, members, groupId }: Props) {
  if (!consensusResult) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500 gap-2">
        <svg className="h-8 w-8 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">
          Waiting for at least 2 members to add preferences...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Group score + project title */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Group Score</p>
          <span className={`text-4xl font-bold tabular-nums ${scoreColor(consensusResult.groupScore)}`}>
            {consensusResult.groupScore}%
          </span>
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Recommended Project</p>
          <p className="text-lg font-semibold text-gray-100 truncate">
            {consensusResult.recommendation}
          </p>
          <span className="inline-block mt-1 text-xs bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-700">
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
      <div className="pt-1">
        <Link
          to={`/group/${groupId}/result`}
          className="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View Full Result
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
