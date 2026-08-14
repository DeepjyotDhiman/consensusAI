import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { groupApi } from '../api/groupApi.ts';
import { useGroupStore } from '../store/groupStore.ts';
import { useGroupSession } from '../hooks/useGroupSession.ts';
import type { ConsensusOutput } from '@consensus/shared';
import type { MemberWithDisplay } from '../store/groupStore.ts';
import ScoreBar from '../components/ScoreBar.tsx';
import RoleAllocationTable from '../components/RoleAllocationTable.tsx';
import ConflictPanel from '../components/ConflictPanel.tsx';
import ExplanationPanel from '../components/ExplanationPanel.tsx';

const LS_KEYS = {
  userId: 'consensus_userId',
  groupMemberId: 'consensus_groupMemberId',
  groupId: 'consensus_groupId',
} as const;

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-rose-400';
}

export default function ConsensusResult() {
  const { id: groupId = '' } = useParams<{ id: string }>();
  const store = useGroupStore();

  const [staticResult, setStaticResult] = useState<ConsensusOutput | null>(null);
  const [members, setMembers] = useState<MemberWithDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  // Read identity from localStorage
  useEffect(() => {
    const userId = localStorage.getItem(LS_KEYS.userId);
    const groupMemberId = localStorage.getItem(LS_KEYS.groupMemberId);
    if (userId && groupMemberId) {
      store.setCurrentUser(userId, groupMemberId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Socket session for live updates
  const session = useGroupSession(groupId, store.currentUserId ?? '');

  // REST load fallback
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    Promise.all([
      groupApi.getGroup(groupId),
      groupApi.getLatestConsensus(groupId),
    ])
      .then(([groupData, result]) => {
        store.setGroup(groupData.group);
        const membersWithDisplay: MemberWithDisplay[] = groupData.members.map((m) => ({
          id: m.id,
          groupId: groupData.group.id,
          userId: m.userId,
          displayName: m.displayName,
          avatarColor: m.avatarColor,
          joinedAt: m.joinedAt,
        }));
        setMembers(membersWithDisplay);
        if (result) setStaticResult(result);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  const result = session.consensusResult ?? staticResult;
  const displayMembers = session.members.length > 0 ? session.members : members;

  function generateMarkdownReport(): string {
    if (!result) return '';
    return `# ConsensusAI Report — ${result.recommendation}

## Recommendation Overview
- **Winning Candidate**: ${result.recommendation} (${result.candidateId})
- **Overall Group Score**: ${result.groupScore}%
- **Runner Up**: ${result.runnerUp}

## Team Member Fit Scores
${displayMembers
  .map((m) => `- **${m.displayName}**: ${result.memberScores[m.userId] ?? 0}%`)
  .join('\n')}

## Recommended Role Allocations
${Object.entries(result.roleAllocation)
  .map(([userId, role]) => {
    const member = displayMembers.find((m) => m.userId === userId);
    return `- **${member?.displayName ?? userId}**: ${role}`;
  })
  .join('\n')}

## Detected Conflicts (${result.conflicts.length})
${result.conflicts.map((c) => `- [${c.severity.toUpperCase()}] ${c.type}: ${c.description}`).join('\n')}

## Trade-off Analysis & Rationale
${result.explanation.map((e) => `- ${e}`).join('\n')}
`;
  }

  async function handleCopyMarkdown() {
    const md = generateMarkdownReport();
    try {
      await navigator.clipboard.writeText(md);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function handleCopyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 animate-pulse text-sm">Loading Consensus Report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="glass-panel p-6 rounded-2xl text-center max-w-sm">
          <p className="text-rose-400 mb-4 text-sm">{error}</p>
          <Link to={`/group/${groupId}`} className="text-indigo-400 hover:text-indigo-300 text-xs">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="glass-panel p-8 rounded-2xl text-center max-w-md space-y-4">
          <p className="text-slate-200 text-lg font-bold">No Consensus Generated</p>
          <p className="text-slate-400 text-xs leading-relaxed">
            At least 2 team members must fill out their preferences to calculate a consensus recommendation.
          </p>
          <Link
            to={`/group/${groupId}`}
            className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between glass-panel sticky top-0 z-30">
        <Link
          to={`/group/${groupId}`}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
        >
          ← Back to Dashboard
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyShareLink}
            className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700/80 hover:bg-slate-800/80 transition-colors"
          >
            {copiedLink ? '✓ Link Copied' : 'Share Link'}
          </button>
          <button
            onClick={() => setExportOpen(true)}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-1.5 rounded-lg transition-all shadow-md shadow-indigo-600/20"
          >
            Export Report
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 flex-1 w-full">
        {/* Winner Hero Card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between gap-4 flex-wrap mb-4 relative z-10">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                Recommended Candidate
              </span>
              <h1 className="text-3xl font-extrabold text-slate-100 mt-2">{result.recommendation}</h1>
              <span className="inline-block mt-2 text-xs font-mono bg-slate-800/90 text-indigo-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                {result.candidateId}
              </span>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Group Score</p>
              <span className={`text-5xl font-black tabular-nums ${scoreColor(result.groupScore)}`}>
                {result.groupScore}%
              </span>
            </div>
          </div>

          {result.runnerUp && (
            <p className="text-xs text-slate-400 pt-3 border-t border-slate-800/80">
              Runner-up Project Alternative:{' '}
              <span className="text-slate-200 font-semibold">{result.runnerUp}</span>
            </p>
          )}
        </div>

        {/* Member Scores Breakdown */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Individual Team Member Scores
          </h2>
          <div className="space-y-3">
            {displayMembers.map((member) => {
              const score = result.memberScores[member.userId] ?? 0;
              return (
                <ScoreBar
                  key={member.id}
                  label={member.displayName}
                  score={score}
                />
              );
            })}
          </div>
        </div>

        {/* Role Allocation Table */}
        {Object.keys(result.roleAllocation).length > 0 && (
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Assigned Team Roles
            </h2>
            <RoleAllocationTable
              roleAllocation={result.roleAllocation}
              members={displayMembers}
            />
          </div>
        )}

        {/* Conflict Analysis */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Conflict Analysis
          </h2>
          <ConflictPanel conflicts={result.conflicts} />
        </div>

        {/* Trade-off Rationale & Explanation */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Trade-off Rationale & Detailed Explanation
          </h2>
          <ExplanationPanel explanation={result.explanation} />
        </div>
      </div>

      {/* Export Modal */}
      {exportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel rounded-2xl p-6 max-w-2xl w-full border border-indigo-500/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Export Consensus Report</h3>
              <button
                onClick={() => setExportOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Copy this Markdown breakdown to present to hackathon judges or paste into your team pitch deck:
            </p>

            <textarea
              readOnly
              rows={12}
              value={generateMarkdownReport()}
              className="w-full rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-300 p-3 focus:outline-none"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setExportOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
              <button
                onClick={handleCopyMarkdown}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30"
              >
                {copiedMd ? '✓ Copied Markdown!' : 'Copy Markdown'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
