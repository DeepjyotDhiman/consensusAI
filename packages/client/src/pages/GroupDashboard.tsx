import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { groupApi } from '../api/groupApi.ts';
import { useGroupStore } from '../store/groupStore.ts';
import { useGroupSession } from '../hooks/useGroupSession.ts';
import RealtimeBadge from '../components/RealtimeBadge.tsx';
import MemberCard from '../components/MemberCard.tsx';
import PreferenceForm from '../components/PreferenceForm.tsx';
import ConflictPanel from '../components/ConflictPanel.tsx';
import ConsensusSummaryPanel from '../components/ConsensusSummaryPanel.tsx';
import CandidateCatalogModal from '../components/CandidateCatalogModal.tsx';
import type { Preference } from '@consensus/shared';

const LS_KEYS = {
  userId: 'consensus_userId',
  groupMemberId: 'consensus_groupMemberId',
  groupId: 'consensus_groupId',
} as const;

export default function GroupDashboard() {
  const { id: groupId = '' } = useParams<{ id: string }>();
  const store = useGroupStore();

  const [copiedCode, setCopiedCode] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Read identity from localStorage on mount
  useEffect(() => {
    const userId = localStorage.getItem(LS_KEYS.userId);
    const groupMemberId = localStorage.getItem(LS_KEYS.groupMemberId);
    if (userId && groupMemberId) {
      store.setCurrentUser(userId, groupMemberId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Connect socket (hydrates members + preferencesMap + consensus)
  const session = useGroupSession(groupId, store.currentUserId ?? '');

  // Fetch group metadata via REST on mount
  useEffect(() => {
    if (!groupId) return;
    groupApi
      .getGroup(groupId)
      .then(({ group }) => {
        store.setGroup(group);
      })
      .catch(console.error);
  }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleBlurSave(groupMemberId: string, prefs: Preference) {
    session.updatePreference(groupMemberId, prefs);
    showToast('Preferences updated — recalculating consensus...');
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  async function handleCopyCode() {
    if (!group?.joinCode) return;
    try {
      await navigator.clipboard.writeText(group.joinCode);
      setCopiedCode(true);
      showToast(`Join code ${group.joinCode} copied!`);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const { group, members, preferencesMap, consensusResult, connectionStatus } = session;
  const currentGroupMemberId = store.currentGroupMemberId;
  const currentUserId = store.currentUserId;

  const currentMember = members.find((m) => m.userId === currentUserId);
  const currentPreference = currentGroupMemberId ? preferencesMap[currentGroupMemberId] ?? null : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
      {/* Header */}
      <header className="border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between glass-panel sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
          >
            ← Home
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-sm font-bold text-slate-100">Group Dashboard</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCatalogOpen(true)}
            className="text-xs text-indigo-300 hover:text-white px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-700/50 hover:bg-indigo-900/60 transition-colors hidden sm:block font-medium"
          >
            Project Catalog
          </button>

          <RealtimeBadge connectionStatus={connectionStatus} />
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Top Banner: Group Info + Share Code */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                Team Session
              </span>
              <span className="text-xs text-slate-400">
                {members.length} member{members.length === 1 ? '' : 's'} connected
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              {group?.name ?? 'Loading Group...'}
            </h1>
          </div>

          {group?.joinCode && (
            <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-700/80 p-2.5 rounded-xl">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Join Code</p>
                <span className="font-mono text-xl font-bold text-indigo-300 tracking-widest">
                  {group.joinCode}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-sm"
              >
                {copiedCode ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-indigo-950 border border-indigo-500/50 text-indigo-200 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Members & Preference Form */}
          <div className="space-y-6">
            {/* Members List */}
            <section className="glass-panel rounded-2xl p-5 border border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Connected Team Members ({members.length})
                </h2>
                <Link
                  to={`/join/${group?.joinCode ?? ''}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  + Add Member
                </Link>
              </div>

              <div className="space-y-2">
                {members.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">
                    Waiting for team members to join session...
                  </p>
                ) : (
                  members.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      preference={preferencesMap[member.id] ?? null}
                      isCurrentUser={member.userId === currentUserId}
                    />
                  ))
                )}
              </div>
            </section>

            {/* Preference Form */}
            {currentGroupMemberId && currentMember ? (
              <section className="glass-panel rounded-2xl p-6 border border-slate-800/80">
                <PreferenceForm
                  groupMemberId={currentGroupMemberId}
                  initialValues={currentPreference}
                  onBlurSave={handleBlurSave}
                />
              </section>
            ) : (
              <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 text-center">
                <p className="text-xs text-slate-400 mb-3">
                  {currentUserId
                    ? 'Locating your member record...'
                    : 'Select or create your user identity to input preferences.'}
                </p>
                <Link
                  to={`/join/${group?.joinCode ?? ''}`}
                  className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                >
                  Join as Group Member →
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: Conflicts & Consensus Summary */}
          <div className="space-y-6">
            {/* Conflicts Panel */}
            <section className="glass-panel rounded-2xl p-5 border border-slate-800/80">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Detected Team Conflicts
              </h2>
              <ConflictPanel conflicts={consensusResult?.conflicts ?? []} />
            </section>

            {/* Consensus Summary */}
            <section className="glass-panel rounded-2xl p-6 border border-slate-800/80">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Live Recommendation
                </h2>
                {consensusResult && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800 font-mono">
                    Updated live
                  </span>
                )}
              </div>
              <ConsensusSummaryPanel
                consensusResult={consensusResult}
                members={members}
                groupId={groupId}
              />
            </section>
          </div>
        </div>
      </div>

      {/* Catalog Modal */}
      <CandidateCatalogModal isOpen={catalogOpen} onClose={() => setCatalogOpen(false)} />
    </div>
  );
}
