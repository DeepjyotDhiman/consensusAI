import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { groupApi } from '../api/groupApi.ts';
import { useGroupStore } from '../store/groupStore.ts';
import { useGroupSession } from '../hooks/useGroupSession.ts';
import { useAuth } from '../context/AuthContext.tsx';
import RealtimeBadge from '../components/RealtimeBadge.tsx';
import MemberCard from '../components/MemberCard.tsx';
import PreferenceForm from '../components/PreferenceForm.tsx';
import ErrorBoundary from '../components/ErrorBoundary.tsx';
import ConflictPanel from '../components/ConflictPanel.tsx';
import ConsensusSummaryPanel from '../components/ConsensusSummaryPanel.tsx';
import CandidateCatalogModal from '../components/CandidateCatalogModal.tsx';
import LeaderboardModal from '../components/LeaderboardModal.tsx';
import type { Preference } from '@consensus/shared';
import { computeTaskAssignments } from '../utils/projectTaskMapper.ts';

const LS_KEYS = {
  userId: 'consensus_userId',
  groupMemberId: 'consensus_groupMemberId',
  groupId: 'consensus_groupId',
} as const;

function safeCsvToArray(input: any): string[] {
  if (Array.isArray(input)) return input.filter(Boolean).map(String);
  if (typeof input === 'string') {
    return input.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

interface TargetProjectTaskAllocationProps {
  consensusResult: ConsensusOutput | null;
  members: MemberWithDisplay[];
  preferencesMap?: Record<string, Preference | null>;
}

function TargetProjectTaskAllocation({
  consensusResult,
  members,
  preferencesMap = {},
}: TargetProjectTaskAllocationProps) {
  const { assignedTasks, standbyMembers, profile } = useMemo(() => {
    if (!consensusResult || members.length === 0) {
      return { assignedTasks: [], standbyMembers: members, profile: null };
    }
    const projectName = consensusResult.recommendation || 'Community Design System';
    const { profile, assigned, standby } = computeTaskAssignments(projectName, members, preferencesMap);
    return { assignedTasks: assigned, standbyMembers: standby, profile };
  }, [consensusResult, members, preferencesMap]);

  if (!consensusResult || !profile) return null;

  return (
    <div className="glass-card-dark p-3.5 sm:p-4 text-white space-y-3 text-left">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
              Current Target Project: <span className="text-teal-400">{consensusResult.recommendation}</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Dynamic skill-matched task assignments recalculating live.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 font-mono">
          Score: {consensusResult.groupScore}%
        </span>
      </div>

      <div className="space-y-1.5">
        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          Skill-Matched Task Allocations ({assignedTasks.length})
        </h4>
        {assignedTasks.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-1">
            No team members currently match the required project skills.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {assignedTasks.map(({ member, matchedSkill, task }) => (
              <div
                key={member.id}
                className="bg-slate-800/60 border border-white/10 p-2.5 rounded-lg flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: member.avatarColor || '#0d9488' }}
                  >
                    {member.displayName[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{member.displayName}</p>
                    <p className="text-[10px] text-slate-300 truncate">{task}</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                  ✓ {matchedSkill}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skill Gap Detected Alert */}
      <div className="mt-3 bg-amber-900/20 border border-amber-500/40 rounded-lg p-3 flex items-start gap-2.5 text-amber-200 text-left">
        <span className="text-lg shrink-0 mt-0.5">⚠️</span>
        <div>
          <h4 className="font-bold text-xs">Skill Gap Detected</h4>
          <p className="text-[11px] opacity-90 mt-0.5 leading-snug">
            Your team is missing <strong>UI/UX Design, Figma, and CSS</strong> required for this project. Upskill and update your profiles to unlock these tasks!
          </p>
        </div>
      </div>

      {standbyMembers.length > 0 && (
        <div className="pt-2 border-t border-white/10 space-y-1.5">
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <span>⚠️ On Standby / Upskilling ({standbyMembers.length})</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {standbyMembers.map((member) => (
              <div
                key={member.id}
                className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md flex items-center gap-1.5 text-[11px] text-amber-300"
              >
                <span className="font-bold">{member.displayName}</span>
                <span className="text-[9px] text-amber-400/80 italic">
                  — Needs skills
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ChatMessageItem {
  id: string;
  senderName: string;
  avatarColor?: string;
  text: string;
}

function WorkspaceChat({ members, currentUserId }: { members: MemberWithDisplay[]; currentUserId?: string | null }) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [input, setInput] = useState('');

  const activeSender = members.find((m) => m.id === selectedMemberId || m.userId === currentUserId) || members[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeSender) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        senderName: activeSender.displayName,
        avatarColor: activeSender.avatarColor,
        text: input.trim(),
      },
    ]);
    setInput('');
  };

  return (
    <section className="bg-slate-900 border border-white/10 rounded-xl p-4 flex flex-col text-left space-y-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <span>💬 Workspace Team Discussion</span>
        </h3>
        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          {members.length} Member{members.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="overflow-y-auto max-h-48 space-y-2 pr-1 text-xs">
        {messages.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic text-center py-3">
            No workspace messages yet. Start chatting with your team!
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2">
              <span
                className="h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5 shadow-xs"
                style={{ backgroundColor: msg.avatarColor || '#0d9488' }}
              >
                {(msg.senderName || '?')[0]}
              </span>
              <div>
                <span className="font-bold text-teal-400 mr-1.5">{msg.senderName || 'Member'}:</span>
                <span className="text-slate-300 leading-snug">{msg.text}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="flex flex-col gap-2 pt-1">
        {members.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">Sending as:</span>
            <select
              value={selectedMemberId || activeSender?.id || ''}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-slate-800 border border-white/10 text-white text-[11px] rounded-md px-2 py-1 focus:outline-none focus:border-teal-500 font-medium cursor-pointer"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName} {m.userId === currentUserId ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={members.length === 0 ? 'Waiting for team members...' : 'Message team members...'}
            disabled={members.length === 0}
            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={members.length === 0 || !input.trim()}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Send
          </button>
        </div>
      </form>
    </section>
  );
}

export default function GroupDashboard() {
  const { id: groupId = '' } = useParams<{ id: string }>();
  const store = useGroupStore();
  const auth = useAuth();

  const [currentView, setCurrentView] = useState<'FORM' | 'LIVE_RESULTS'>('FORM');
  const [copiedCode, setCopiedCode] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
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
    console.log('[UI Event] Preference auto-save on blur for member:', groupMemberId);
    session.updatePreference(groupMemberId, prefs);
    showToast('Preferences updated — recalculating consensus...');
  }

  function handleDoneClick(prefs: Preference) {
    console.log('[UI Click] Form DONE -> Switching view to LIVE_RESULTS');
    if (currentGroupMemberId) {
      session.updatePreference(currentGroupMemberId, prefs);
    }
    setCurrentView('LIVE_RESULTS');
    showToast('Form submitted! Viewing real-time consensus results.');
    setTimeout(() => {
      window.scrollTo({
        top: 320,
        behavior: 'smooth',
      });
    }, 50);
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  async function handleCopyCode() {
    console.log('[UI Click] Copy Join Code clicked:', group?.joinCode);
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

  function handleSelectMemberToEdit(memberId: string) {
    console.log('Edit clicked for ID:', memberId);
    setSelectedGroupMemberId(memberId);
    setCurrentView('FORM');
  }

  const { group, members, preferencesMap, consensusResult, currentUserId, currentGroupMemberId, connectionStatus } = store;
  const [selectedGroupMemberId, setSelectedGroupMemberId] = useState<string | null>(null);
  const activeMemberId = selectedGroupMemberId || currentGroupMemberId || (members[0]?.id ?? null);
  const activeMember = members.find((m) => m.id === activeMemberId);
  const activePreference = activeMemberId ? preferencesMap[activeMemberId] ?? null : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2.5 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
          >
            ← Home
          </Link>
          <span className="text-slate-300">|</span>
          <span className="text-sm font-bold text-slate-900">Group Workspace Dashboard</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              console.log('[UI Click] Leaderboard button clicked');
              setLeaderboardOpen(true);
            }}
            className="bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>🏆 Leaderboard</span>
          </button>

          {/* Step view tab indicator */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-1 text-xs font-semibold">
            <button
              onClick={() => {
                console.log('[UI Click] Tab 1: Form View clicked');
                setCurrentView('FORM');
              }}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                currentView === 'FORM'
                  ? 'bg-teal-600 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Form View
            </button>
            <button
              onClick={() => {
                console.log('[UI Click] Tab 2: Live Results View clicked');
                setCurrentView('LIVE_RESULTS');
              }}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                currentView === 'LIVE_RESULTS'
                  ? 'bg-teal-600 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Live Results View
            </button>
          </div>

          <Link
            to={`/join/${group?.joinCode ?? ''}`}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1"
          >
            <span>+ Add Member</span>
          </Link>

          {auth.isAuthenticated && auth.user && (
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg">
              <span
                className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: auth.user.avatarColor || '#0d9488' }}
              >
                {auth.user.displayName[0]}
              </span>
              <span className="text-xs font-bold text-slate-800">{auth.user.displayName}</span>
              <button
                onClick={auth.logout}
                className="text-[10px] text-rose-600 hover:text-rose-700 font-bold ml-1 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}

          <button
            onClick={() => setCatalogOpen(true)}
            className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors hidden sm:block font-medium cursor-pointer"
          >
            Project Catalog
          </button>

          <RealtimeBadge connectionStatus={connectionStatus} />
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Explicit Active Project Context Banner */}
        {group && (
          <div className="bg-teal-50 border border-teal-200 p-3.5 rounded-xl flex items-center justify-between text-xs shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-600 animate-ping" />
              <span className="font-bold text-teal-950">
                Active Project Scope: <strong className="text-teal-900 font-extrabold">{group.name}</strong> (Join Code: <span className="font-mono text-teal-700 font-bold">{group.joinCode}</span>)
              </span>
            </div>
            <span className="text-[11px] text-teal-700 font-medium hidden sm:inline">
              ✓ All team members added below are explicitly bound to this project
            </span>
          </div>
        )}

        {/* Top Banner: Group Info + Share Code */}
        <div className="enterprise-card p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Team Session
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {members.length} member{members.length === 1 ? '' : 's'} connected
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {group?.name ?? 'Loading Group...'}
            </h1>
          </div>

          {group?.joinCode && (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Join Code</p>
                <span className="font-mono text-xl font-bold text-teal-700 tracking-widest">
                  {group.joinCode}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs transition-colors shadow-sm cursor-pointer"
              >
                {copiedCode ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>



        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Step 1: FORM VIEW */}
        {currentView === 'FORM' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Connected Members */}
            <div className="space-y-6 lg:col-span-1">
              <section className="enterprise-card p-5">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Connected Members ({members.length})
                  </h2>
                  <Link
                    to={`/join/${group?.joinCode ?? ''}`}
                    className="text-xs text-teal-600 hover:text-teal-700 font-bold"
                  >
                    + Switch User
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
                        onEdit={handleSelectMemberToEdit}
                      />
                    ))
                  )}
                </div>
              </section>

              {/* Workspace Team Chat Panel */}
              <WorkspaceChat members={members} currentUserId={currentUserId} />
            </div>

            {/* Right Main Column: Preference Form */}
            <div className="lg:col-span-2 space-y-6">
              {activeMemberId ? (
                <section className="enterprise-card p-6">
                  <ErrorBoundary fallbackTitle="Preference Form Error">
                    <PreferenceForm
                      groupMemberId={activeMemberId}
                      initialValues={activePreference}
                      members={members.map((m) => ({
                        id: m.id,
                        userId: m.userId,
                        displayName: m.displayName,
                        avatarColor: m.avatarColor,
                      }))}
                      onSelectMember={handleSelectMemberToEdit}
                      onBlurSave={handleBlurSave}
                      onDone={handleDoneClick}
                    />
                  </ErrorBoundary>
                </section>
              ) : (
                <div className="enterprise-card p-8 text-center space-y-4">
                  <p className="text-xs text-slate-600 font-medium">
                    {currentUserId
                      ? 'Locating your member record...'
                      : 'Please select or create your member profile to enter preferences.'}
                  </p>
                  <Link
                    to={`/join/${group?.joinCode ?? ''}`}
                    className="enterprise-btn-primary inline-block text-xs"
                  >
                    Join as Group Member →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: LIVE RESULTS VIEW */}
        {currentView === 'LIVE_RESULTS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-teal-50 border border-teal-200 p-4 rounded-2xl">
              <div>
                <h2 className="text-sm font-extrabold text-teal-950 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time Group Consensus Panel
                </h2>
                <p className="text-xs text-teal-800 font-medium">
                  Form submitted successfully. Results update live as members update their profiles.
                </p>
              </div>
              <button
                onClick={() => setCurrentView('FORM')}
                className="enterprise-btn-secondary py-1.5 px-3 text-xs"
              >
                ← Edit Form / Preferences
              </button>
            </div>

            {/* Dynamic Target Project & Task Allocation Banner */}
            <TargetProjectTaskAllocation
              consensusResult={consensusResult}
              members={members}
              preferencesMap={preferencesMap}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Connected Members & Conflict Panel */}
              <div className="space-y-6">
                <section className="enterprise-card p-5">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Connected Team Members ({members.length})
                    </h2>
                  </div>

                  <div className="space-y-2">
                    {members.map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        preference={preferencesMap[member.id] ?? null}
                        isCurrentUser={member.userId === currentUserId}
                        onEdit={handleSelectMemberToEdit}
                      />
                    ))}
                  </div>
                </section>

                <section className="enterprise-card p-5">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
                    Detected Team Conflicts
                  </h2>
                  <ConflictPanel conflicts={consensusResult?.conflicts ?? []} />
                </section>
              </div>

              {/* Right Column: Live Recommendation */}
              <div className="space-y-6">
                <section className="enterprise-card p-6">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Live Recommendation
                    </h2>
                    {consensusResult && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
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
        )}
      </div>

      {/* Catalog & Leaderboard Modals */}
      <CandidateCatalogModal isOpen={catalogOpen} onClose={() => setCatalogOpen(false)} />
      <LeaderboardModal
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        members={members}
        memberScores={consensusResult?.memberScores}
      />
    </div>
  );
}
