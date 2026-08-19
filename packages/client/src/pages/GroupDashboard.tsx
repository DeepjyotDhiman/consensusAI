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
import type { Preference } from '@consensus/shared';
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
    <section className="enterprise-card p-4 flex flex-col text-left space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <span>💬 Workspace Team Discussion</span>
        </h3>
        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {members.length} Member{members.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="overflow-y-auto max-h-48 space-y-2 pr-1 text-xs">
        {messages.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic text-center py-3">
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
                <span className="font-bold text-teal-700 mr-1.5">{msg.senderName || 'Member'}:</span>
                <span className="text-slate-800 leading-snug">{msg.text}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="flex flex-col gap-2 pt-1">
        {members.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-medium">Sending as:</span>
            <select
              value={selectedMemberId || activeSender?.id || ''}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-white border border-slate-200 text-slate-800 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-teal-500 font-medium cursor-pointer"
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
            className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 disabled:opacity-50 shadow-sm"
          />
          <button
            type="submit"
            disabled={members.length === 0 || !input.trim()}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm"
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
    showToast('Preferences updated — recalculating consensus...');
  }

  function handleDoneClick(prefs: Preference) {
    console.log('[UI Click] Form DONE -> Switching view to LIVE_RESULTS');
    if (currentGroupMemberId) {
      session.updatePreference(currentGroupMemberId, prefs);
    }
    handleSwitchToResults();
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

  function handleRemoveMember(memberId: string) {
    console.log('Remove clicked for ID:', memberId);
    store.removeMember(memberId);
    if (selectedGroupMemberId === memberId) {
      setSelectedGroupMemberId(null);
    }
  }

  const { group, groupName, projectName, members, preferencesMap, consensusResult, currentUserId, currentGroupMemberId, connectionStatus } = store;
  const [selectedGroupMemberId, setSelectedGroupMemberId] = useState<string | null>(null);
  const activeMemberId = selectedGroupMemberId || currentGroupMemberId || (members[0]?.id ?? null);
  const activeMember = members.find((m) => m.id === activeMemberId);
  const activePreference = activeMemberId ? preferencesMap[activeMemberId] ?? null : null;

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
              className={`px-3 py-1 rounded-md transition-all duration-200 active:scale-95 cursor-pointer ${
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
                handleSwitchToResults();
              }}
              className={`px-3 py-1 rounded-md transition-all duration-200 active:scale-95 cursor-pointer ${
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
                        onRemove={handleRemoveMember}
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
