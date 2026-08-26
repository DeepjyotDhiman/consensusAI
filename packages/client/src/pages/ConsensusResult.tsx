import { useEffect, useState, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import { groupApi } from '../api/groupApi.ts';
import { useGroupStore } from '../store/groupStore.ts';
import { useAuth } from '../context/AuthContext.tsx';
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
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-rose-600';
}

export default function ConsensusResult() {
  const { id: groupId = '' } = useParams<{ id: string }>();
  const store = useGroupStore();
  const auth = useAuth();

  const [staticResult, setStaticResult] = useState<ConsensusOutput | null>(null);
  const [members, setMembers] = useState<MemberWithDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  const effectiveUserId = auth.user?.id || store.currentUserId;

  // Read identity from localStorage / auth
  useEffect(() => {
    const userId = auth.user?.id || localStorage.getItem(LS_KEYS.userId);
    const groupMemberId = localStorage.getItem(LS_KEYS.groupMemberId);
    if (userId && groupMemberId) {
      store.setCurrentUser(userId, groupMemberId);
    }
  }, [auth.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Socket session for live updates
  const session = useGroupSession(groupId, effectiveUserId);

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
          role: m.role || 'member',
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
  const groupName = store.group?.name || 'Group Team';
  const projectName = result?.recommendation || store.projectName || '';

  function generateMarkdownReport(): string {
    if (!result) return '';
    return `# Team: ${groupName} | Project: ${projectName} — Consensus AI Report

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

  const handleDownloadReport = () => {
    const md = generateMarkdownReport();
    if (!md) return;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consensus-report-${groupName.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 animate-pulse text-sm font-medium">Loading Consensus Report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="enterprise-card p-6 rounded-2xl text-center max-w-sm">
          <p className="text-rose-600 mb-4 text-sm font-medium">{error}</p>
          <Link to={`/group/${groupId}`} className="text-teal-600 hover:text-teal-700 text-xs font-bold">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="enterprise-card p-8 text-center max-w-md space-y-4">
          <p className="text-slate-900 text-lg font-extrabold">No Consensus Generated Yet</p>
          <p className="text-slate-500 text-xs leading-relaxed">
            At least 2 team members must fill out their preferences to calculate a consensus recommendation.
          </p>
          <Link
            to={`/group/${groupId}`}
            className="enterprise-btn-primary inline-block text-xs"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2.5 bg-white sticky top-0 z-30 shadow-xs">
        <Link
          to={`/group/${groupId}`}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
        >
          ← Back to Dashboard
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadReport}
            className="enterprise-btn-dark text-xs py-2 px-4 cursor-pointer flex items-center gap-1.5"
          >
            📅 Download Report (.md)
          </button>
          <button
            onClick={handleCopyShareLink}
            className="enterprise-btn-secondary text-xs py-1.5 px-3 cursor-pointer"
          >
            {copiedLink ? '✓ Link Copied' : 'Share Link'}
          </button>
          <button
            onClick={() => setExportOpen(true)}
            className="enterprise-btn-primary text-xs py-1.5 px-4 cursor-pointer"
          >
            Copy Markdown Report
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 flex-1 w-full">
        {/* Printable PDF Header with Team & Project Name */}
        <div className="text-center pb-3 border-b border-slate-200">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Team: <span className="text-teal-700">{groupName}</span> | Project: <span className="text-indigo-700">{projectName}</span> — Consensus Report
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            AI-driven project recommendation, role allocation, and team fit breakdown.
          </p>
        </div>

        {/* Winner Hero Card */}
        <div className="enterprise-card rounded-2xl p-6 border border-slate-200 relative overflow-hidden bg-white shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap relative z-10">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-widest bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Recommended Project
                </span>
                {result.projectDetails?.isUnique && (
                  <span className="text-[10px] font-extrabold text-purple-800 uppercase tracking-widest bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                    ✨ Tailored Unique Concept
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 mt-2">{result.recommendation}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs font-mono bg-slate-100 text-teal-800 px-2.5 py-0.5 rounded-full border border-slate-200 font-bold">
                  {result.candidateId}
                </span>
                {result.projectDetails?.domain && (
                  <span className="text-xs text-slate-600 font-medium bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
                    📂 {result.projectDetails.domain}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-extrabold tracking-widest">Group Score</p>
              <span className={`text-5xl font-black tabular-nums ${scoreColor(result.groupScore)}`}>
                {result.groupScore}%
              </span>
            </div>
          </div>

          {result.projectDetails?.description && (
            <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              {result.projectDetails.description}
            </p>
          )}

          {result.projectDetails?.problem && (
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-950 space-y-1">
              <p className="font-extrabold uppercase tracking-wider text-[10px] text-amber-800">Problem & Target Need</p>
              <p>{result.projectDetails.problem}</p>
            </div>
          )}

          {result.projectDetails && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Min Hours / Wk</span>
                <span className="font-extrabold text-slate-800">{result.projectDetails.minHoursPerWeek} hrs</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Cost</span>
                <span className="font-extrabold text-slate-800">
                  {result.projectDetails.costPerMember > 0 ? `$${result.projectDetails.costPerMember} / member` : 'Free / Open Source'}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Required Stack</span>
                <span className="font-bold text-teal-800 text-[11px] font-mono truncate block">
                  {result.projectDetails.requiredSkills.join(', ')}
                </span>
              </div>
            </div>
          )}

          {result.runnerUp && (
            <p className="text-xs text-slate-500 pt-3 border-t border-slate-100">
              Runner-up Project Alternative:{' '}
              <span className="text-slate-800 font-extrabold">{result.runnerUp}</span>
            </p>
          )}
        </div>

        {/* Member Scores Breakdown */}
        <div className="enterprise-card rounded-2xl p-6">
          <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">
            Individual Team Member Scores
          </h2>
          <div className="space-y-4">
            {displayMembers.map((member) => {
              const score = result.memberScores[member.userId] ?? 0;
              const breakdown = result.memberBreakdowns?.[member.userId];
              return (
                <Fragment key={member.id}>
                  <ScoreBar label={member.displayName} score={score} />
                  {breakdown && (
                    <div className="ml-2 grid grid-cols-5 gap-2 text-[10px] font-mono pb-2 border-b border-slate-100 last:border-0">
                      {([
                        ['Interest', breakdown.interestScore, 30],
                        ['Skills',   breakdown.skillScore,    25],
                        ['Avail.',   breakdown.availabilityScore, 20],
                        ['Budget',   breakdown.budgetScore,   15],
                        ['Learning', breakdown.learningScore, 10],
                      ] as [string, number, number][]).map(([label, val, max]) => (
                        <div key={label} className="flex flex-col items-center gap-0.5">
                          <span className="text-slate-400 uppercase tracking-wider">{label}</span>
                          <span className="font-bold text-slate-700">{val.toFixed(1)}</span>
                          <span className="text-slate-400">/{max}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>

        {/* Role Allocation Table */}
        <div className="enterprise-card rounded-2xl p-6">
          <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">
            Assigned Team Roles
          </h2>
          <RoleAllocationTable
            roleAllocation={result.roleAllocation}
            members={displayMembers}
            preferencesMap={session.preferencesMap}
            projectName={projectName}
            customRequiredSkills={result.projectDetails?.requiredSkills}
          />
        </div>

        {/* Conflict Analysis */}
        <div className="enterprise-card rounded-2xl p-6">
          <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">
            Conflict Analysis
          </h2>
          <ConflictPanel conflicts={result.conflicts} />
        </div>

        {/* Trade-off Rationale & Explanation */}
        <div className="enterprise-card rounded-2xl p-6">
          <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">
            Trade-off Rationale & Detailed Explanation
          </h2>
          <ExplanationPanel explanation={result.explanation} />
        </div>
      </div>

      {/* Export Modal */}
      {exportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Copy Markdown Report</h3>
              <button
                onClick={() => setExportOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1 h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Copy this Markdown breakdown to share with your team or paste into a pitch deck:
            </p>

            <textarea
              readOnly
              rows={12}
              value={generateMarkdownReport()}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 p-3 focus:outline-none"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setExportOpen(false)}
                className="enterprise-btn-secondary text-xs py-2 px-4 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleCopyMarkdown}
                className="enterprise-btn-primary text-xs py-2 px-4 cursor-pointer"
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
