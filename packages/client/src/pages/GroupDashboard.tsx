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
import NavbarLogo from '../components/NavbarLogo.tsx';
import type { Preference, ConsensusOutput } from '@consensus/shared';
import type { MemberWithDisplay } from '../store/groupStore.ts';
import { computeTaskAssignments } from '../utils/projectTaskMapper.ts';
import { triggerConfetti } from '../utils/confetti.ts';
import { SkeletonTaskAllocation, SkeletonConsensusSummary } from '../components/SkeletonCard.tsx';
import AiThinkingTerminal from '../components/AiThinkingTerminal.tsx';
import TeamSkillRadarChart from '../components/TeamSkillRadarChart.tsx';

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
  const store = useGroupStore();
  const [editingProject, setEditingProject] = useState(false);
  const [projectInput, setProjectInput] = useState('');

  const activeProjectName = store.projectName || consensusResult?.recommendation || 'E-commerce Platform';

  const { assignedTasks, standbyMembers, profile, missingSkills } = useMemo(() => {
    if (!consensusResult && members.length === 0) {
      return { assignedTasks: [], standbyMembers: members, profile: null, missingSkills: [] };
    }
    const { profile, assigned, standby, missingSkills } = computeTaskAssignments(activeProjectName, members, preferencesMap);
    return { assignedTasks: assigned, standbyMembers: standby, profile, missingSkills };
  }, [consensusResult, members, preferencesMap, activeProjectName]);

  const handleSaveProjectName = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectInput.trim()) {
      store.setProjectName(projectInput.trim());
      if (store.group?.id) {
        localStorage.setItem(`consensus_projectName_${store.group.id}`, projectInput.trim());
      }
    }
    setEditingProject(false);
  };

  if (!profile) return null;

  return (
    <div className="enterprise-card p-4 sm:p-5 space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🎯</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                Current Target Project: <span className="text-teal-700">{profile.projectName || activeProjectName}</span>
              </h3>
              {editingProject ? (
                <form onSubmit={handleSaveProjectName} className="inline-flex items-center gap-1.5">
                  <input
                    type="text"
                    className="px-2.5 py-1 text-xs bg-white border border-teal-500 rounded-lg text-slate-900 focus:outline-none shadow-sm"
                    placeholder="e.g. E-commerce, EduBot, Mobile App"
                    value={projectInput}
                    onChange={(e) => setProjectInput(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="text-[10px] bg-teal-600 hover:bg-teal-700 text-white font-bold px-2.5 py-1 rounded-lg cursor-pointer">
                    Save
                  </button>
                  <button type="button" onClick={() => setEditingProject(false)} className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 px-2.5 py-1 rounded-lg cursor-pointer">
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setProjectInput(activeProjectName);
                    setEditingProject(true);
                  }}
                  className="text-[10px] text-teal-700 hover:text-teal-800 underline font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 cursor-pointer"
                >
                  ✏️ Edit Project
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Required stack: <span className="font-mono font-bold text-teal-700">{profile.requiredSkills.join(', ')}</span>
            </p>
          </div>
        </div>
        {consensusResult && (
          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 font-mono">
            Score: {consensusResult.groupScore}%
          </span>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          Skill-Matched Task Allocations ({assignedTasks.length})
        </h4>
        {assignedTasks.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-1">
            No team members currently match the required project skills.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {assignedTasks.map(({ member, matchedSkill, task }) => (
              <div
                key={member.id}
                className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex items-center justify-between gap-2 shadow-xs hover:border-teal-300 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: member.avatarColor || '#0d9488' }}
                  >
                    {member.displayName[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{member.displayName}</p>
                    <p className="text-[10px] text-slate-600 truncate">{task}</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                  ✓ {matchedSkill}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Skill Gap Alert - Only rendered if there are actual missing skills */}
      {missingSkills && missingSkills.length > 0 && (
        <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl p-4 text-orange-950 text-left space-y-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <span className="text-lg shrink-0 mt-0.5">⚠️</span>
            <div>
              <h4 className="font-extrabold text-xs text-orange-950 uppercase tracking-wider">
                Project Skill Gap Detected
              </h4>
              <p className="text-xs text-orange-900 mt-1 leading-snug font-medium">
                Your team is missing the following required skills: <strong className="font-mono text-orange-950 font-bold bg-orange-100/80 px-2 py-0.5 rounded border border-orange-300/80">{missingSkills.join(', ')}</strong>. Please upskill a team member or add someone new to fulfill these requirements.
              </p>
            </div>
          </div>

          {/* AI Suggested Learning Paths */}
          <div className="pt-3 border-t border-orange-200/80 space-y-2">
            <div className="flex items-center gap-1.5 text-indigo-900">
              <span className="text-xs">✨</span>
              <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-900">
                Suggested Learning Paths
              </h5>
            </div>
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((skill) => (
                <a
                  key={skill}
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent('learn ' + skill + ' tutorial')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:text-indigo-900 hover:shadow-xs transition-all duration-200 cursor-pointer group"
                >
                  <span>▶ Learn {skill}</span>
                  <svg className="w-3 h-3 text-indigo-500 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Constructive Upskilling Status for Team Members Available for New Tasks */}
      {standbyMembers.length > 0 && (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
            <span>💡 Team Members Ready for Upskilling ({standbyMembers.length})</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {standbyMembers.map((member) => (
              <div
                key={member.id}
                className="bg-amber-50/80 border border-amber-200/80 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-950"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: member.avatarColor || '#0d9488' }}
                  >
                    {member.displayName[0]}
                  </span>
                  <span className="font-bold truncate">{member.displayName}</span>
                </div>
                <span className="text-[10px] font-medium text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300/60 truncate">
                  Available for Upskilling in: {missingSkills.length > 0 ? missingSkills.join(', ') : 'New Tech Stack'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



export default function GroupDashboard() {
  const { id: groupId = '' } = useParams<{ id: string }>();
  const store = useGroupStore();
  const auth = useAuth();

  const [currentView, setCurrentView] = useState<'FORM' | 'LIVE_RESULTS'>('FORM');
  const [isCalculating, setIsCalculating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function handleSwitchToResults() {
    setIsCalculating(true);
    setCurrentView('LIVE_RESULTS');
    setTimeout(() => {
      setIsCalculating(false);
      triggerConfetti();
    }, 2800);
  }

  const effectiveUserId = auth.user?.id || store.currentUserId;

  // Read identity from localStorage / auth on mount
  useEffect(() => {
    const userId = auth.user?.id || localStorage.getItem(LS_KEYS.userId);
    const groupMemberId = localStorage.getItem(LS_KEYS.groupMemberId);
    if (userId && groupMemberId) {
      store.setCurrentUser(userId, groupMemberId);
    }
  }, [auth.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Connect socket (hydrates members + preferencesMap + consensus)
  const session = useGroupSession(groupId, effectiveUserId);

  // Fetch group metadata via REST on mount
  useEffect(() => {
    if (!groupId) return;
    const savedProject = localStorage.getItem(`consensus_projectName_${groupId}`);
    if (savedProject) {
      store.setProjectName(savedProject);
    }
    groupApi
      .getGroup(groupId)
      .then(({ group }) => {
        store.setGroup(group);
        store.setGroupName(group.name);
      })
      .catch(console.error);
  }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleBlurSave(groupMemberId: string, prefs: Preference) {
    console.log('[UI Event] Preference auto-save on blur for member:', groupMemberId);
    session.updatePreference(groupMemberId, prefs);
  }

  function handleSubmitPrefs(prefs: Preference) {
    console.log('[UI Click] Member submitting preferences formally');
    if (currentGroupMemberId) {
      session.submitPreference(currentGroupMemberId, prefs);
    }
    showToast('Preferences submitted! Running AI consensus analysis...');
    setIsCalculating(true);
    setCurrentView('LIVE_RESULTS');
    setTimeout(() => {
      setIsCalculating(false);
      triggerConfetti();
    }, 2800);
    setTimeout(() => {
      window.scrollTo({ top: 320, behavior: 'smooth' });
    }, 50);
  }

  function handleGenerateConsensus() {
    if (!currentUserId) return;
    session.generateConsensus(groupId, currentUserId);
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      triggerConfetti();
    }, 2800);
    showToast('Generating final consensus for the team...');
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

  function handleSelectMemberToEdit(_memberId: string) {
    setCurrentView('FORM');
  }

  function handleRemoveMember(memberId: string) {
    console.log('Remove clicked for ID:', memberId);
    store.removeMember(memberId);
  }

  const { group, groupName, projectName, members, preferencesMap, consensusResult, currentUserId, currentGroupMemberId, connectionStatus } = store;

  // Always edit your own preferences (no member switching)
  const activeMemberId = currentGroupMemberId || (members.find((m) => m.userId === (auth.user?.id || currentUserId))?.id ?? null);
  const activePreference = activeMemberId ? preferencesMap[activeMemberId] ?? null : null;

  // Submission progress
  const submittedCount = members.filter((m) => {
    const pref = preferencesMap[m.id];
    return pref?.submittedAt != null;
  }).length;
  const totalMembers = members.length;
  const allSubmitted = totalMembers >= 2 && submittedCount === totalMembers;

  // Is the current user the group leader?
  const currentMember = members.find((m) => m.userId === (auth.user?.id || currentUserId));
  const isLeader = currentMember?.role === 'leader';

  return (
    <div className="min-h-screen app-grid-bg text-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2.5 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <NavbarLogo showBadge={false} />
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
              {groupName || group?.name || 'Group Workspace'}
            </span>
            {projectName && (
              <span className="text-[11px] text-teal-700 font-medium bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full font-mono hidden sm:inline-block">
                🎯 {projectName}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              console.log('[UI Click] Leaderboard button clicked');
              setLeaderboardOpen(true);
            }}
            className="bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 active:scale-95 hover:-translate-y-0.5 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-200 cursor-pointer"
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
              className={`px-3 py-1 rounded-md transition-all duration-200 active:scale-95 cursor-pointer ${currentView === 'FORM'
                  ? 'bg-teal-600 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Form View
            </button>
            <button
              onClick={() => {
                console.log('[UI Click] Tab 2: Live Results View clicked');
                handleSwitchToResults();
              }}
              className={`px-3 py-1 rounded-md transition-all duration-200 active:scale-95 cursor-pointer ${currentView === 'LIVE_RESULTS'
                  ? 'bg-teal-600 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Live Results View
            </button>
          </div>

          <Link
            to={`/join/${group?.joinCode ?? ''}`}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 active:scale-95 hover:-translate-y-0.5 text-white font-bold px-3 py-1.5 rounded-lg transition-all duration-200 shadow-sm flex items-center gap-1"
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
                className="text-[10px] text-rose-600 hover:text-rose-700 active:scale-90 font-bold ml-1 cursor-pointer transition-all"
              >
                Sign Out
              </button>
            </div>
          )}

          <button
            onClick={() => setCatalogOpen(true)}
            className="text-xs text-slate-600 hover:text-slate-900 active:scale-95 hover:-translate-y-0.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all duration-200 hidden sm:block font-medium cursor-pointer"
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
          <div className="bg-teal-50 border border-teal-200 p-3.5 rounded-xl flex items-center justify-between text-xs shadow-sm flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-600 animate-ping" />
              <span className="font-bold text-teal-950">
                Group: <strong className="text-teal-900 font-extrabold">{group.name}</strong>
                {' '}· Join Code: <span className="font-mono text-teal-700 font-bold">{group.joinCode}</span>
                {isLeader && (
                  <span className="ml-2 text-[10px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    👑 Leader
                  </span>
                )}
              </span>
            </div>

            {/* Member submission progress bar */}
            {totalMembers > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-teal-700 font-semibold">
                  {submittedCount}/{totalMembers} submitted
                </span>
                <div className="w-24 h-2 bg-teal-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-500"
                    style={{ width: `${totalMembers > 0 ? (submittedCount / totalMembers) * 100 : 0}%` }}
                  />
                </div>
                {allSubmitted && (
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    ✓ All Ready!
                  </span>
                )}
              </div>
            )}
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
                        onRemove={handleRemoveMember}
                      />
                    ))
                  )}
                </div>
              </section>

              {/* NOTE: Chat removed — was local state only (no realtime). Use a dedicated tool. */}
            </div>

            {/* Right Main Column: Preference Form */}
            <div className="lg:col-span-2 space-y-6">
              {activeMemberId ? (
                <section className="enterprise-card p-6">
                  <ErrorBoundary fallbackTitle="Preference Form Error">
                    <PreferenceForm
                      groupMemberId={activeMemberId}
                      initialValues={activePreference}
                      onBlurSave={handleBlurSave}
                      onSubmitPrefs={handleSubmitPrefs}
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
                  {isCalculating
                    ? 'Calculating optimal AI role allocation & group consensus...'
                    : 'Form submitted successfully. Results update live as members update their profiles.'}
                </p>
              </div>
              <button
                onClick={() => setCurrentView('FORM')}
                className="enterprise-btn-secondary py-1.5 px-3 text-xs"
              >
                ← Edit Form / Preferences
              </button>
            </div>

            {isCalculating ? (
              <div className="space-y-6">
                <AiThinkingTerminal membersCount={members.length} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SkeletonTaskAllocation />
                  <SkeletonConsensusSummary />
                </div>
              </div>
            ) : (
              <>
                {/* Leader: Generate Final Consensus button */}
                {isLeader && !consensusResult && (
                  <div className="enterprise-card p-5 border-2 border-teal-300 bg-teal-50 flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-teal-900">Ready to generate the group recommendation?</h3>
                      <p className="text-xs text-teal-700 mt-0.5">
                        {submittedCount < 2
                          ? `At least 2 members must submit. Currently: ${submittedCount}/${totalMembers}.`
                          : `${submittedCount}/${totalMembers} members have submitted. Click to generate.`}
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateConsensus}
                      disabled={submittedCount < 2}
                      className="enterprise-btn-primary py-2.5 px-5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🤖 Generate Final Consensus
                    </button>
                  </div>
                )}
                {isLeader && consensusResult && (
                  <div className="enterprise-card p-4 border border-emerald-200 bg-emerald-50 flex items-center justify-between flex-wrap gap-3">
                    <span className="text-xs font-bold text-emerald-800">✓ Consensus generated. You can regenerate after members update their preferences.</span>
                    <button
                      onClick={handleGenerateConsensus}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                    >
                      Regenerate
                    </button>
                  </div>
                )}
                {/* Dynamic Target Project & Task Allocation Banner */}
                <TargetProjectTaskAllocation
                  consensusResult={consensusResult}
                  members={members}
                  preferencesMap={preferencesMap}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Team Radar Chart, Connected Members & Conflict Panel */}
                  <div className="space-y-6">
                    <TeamSkillRadarChart members={members} preferencesMap={preferencesMap} />

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
                            onRemove={handleRemoveMember}
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
              </>
            )}
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
