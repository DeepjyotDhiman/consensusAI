import { useState, useMemo } from 'react';
import type { Candidate, ConsensusOutput } from '@consensus/shared';
import ScoreBar from './ScoreBar.tsx';
import RoleAllocationTable from './RoleAllocationTable.tsx';
import ConflictPanel from './ConflictPanel.tsx';
import ExplanationPanel from './ExplanationPanel.tsx';
import MemberDetailModal from './MemberDetailModal.tsx';

// -----------------------------------------------------------------------------
// Data Types
// -----------------------------------------------------------------------------
export interface MemberData {
  id: string;
  name: string;
  avatarColor: string;
  skills: string[];
  interests: string[];
  availabilityHours: number;
  budget: number;
  learningGoals: string[];
  notes?: string;
}

export interface FormData {
  name: string;
  skills: string;
  interests: string;
  availabilityHours: number;
  budget: number;
  learningGoals: string;
  notes: string;
}

export type ViewMode = 'ENTRY_FORM' | 'LIVE_RESULTS';

// -----------------------------------------------------------------------------
// 4 Default Group Members
// -----------------------------------------------------------------------------
const DEFAULT_4_MEMBERS: MemberData[] = [
  {
    id: 'member-alice',
    name: 'Alice',
    avatarColor: '#6366f1',
    skills: ['Machine Learning', 'Python', 'Data Analysis'],
    interests: ['AI', 'Social Impact'],
    availabilityHours: 20,
    budget: 500,
    learningGoals: ['Deep Learning', 'MLOps'],
    notes: 'Excited to work on something with real-world impact using AI.',
  },
  {
    id: 'member-bob',
    name: 'Bob',
    avatarColor: '#f59e0b',
    skills: ['React', 'TypeScript', 'Python', 'UI Design'],
    interests: ['AI', 'Frontend'],
    availabilityHours: 15,
    budget: 200,
    learningGoals: ['Machine Learning', 'React Native'],
    notes: 'Want to combine frontend skills with AI/ML.',
  },
  {
    id: 'member-carol',
    name: 'Carol',
    avatarColor: '#10b981',
    skills: ['Network Security', 'Linux', 'Python'],
    interests: ['AI', 'Cybersecurity'],
    availabilityHours: 15,
    budget: 150,
    learningGoals: ['Machine Learning', 'Penetration Testing'],
    notes: 'Want to build something combining AI with security.',
  },
  {
    id: 'member-david',
    name: 'David',
    avatarColor: '#3b82f6',
    skills: ['Node.js', 'Go', 'Linux'],
    interests: ['Developer Tools', 'Web3'],
    availabilityHours: 10,
    budget: 300,
    learningGoals: ['Rust', 'Distributed Systems'],
    notes: 'Focus on backend infra and developer tools.',
  },
];

// -----------------------------------------------------------------------------
// Preset Catalog for Live Scoring Engine
// -----------------------------------------------------------------------------
const CANDIDATES_CATALOG: Candidate[] = [
  {
    id: 'cand-01',
    title: 'AI Accessibility Tool',
    description: 'A machine-learning powered application that assists users with disabilities through real-time speech-to-text and adaptive UI.',
    domain: 'AI/ML',
    domainTags: ['AI', 'Machine Learning', 'Accessibility', 'Frontend'],
    requiredSkills: ['Machine Learning', 'Python', 'React', 'Data Analysis'],
    costPerMember: 300,
    minHoursPerWeek: 15,
  },
  {
    id: 'cand-02',
    title: 'Community Design System',
    description: 'An open-source UI component library with accessibility support and Figma integration for community design.',
    domain: 'Frontend/Design',
    domainTags: ['Frontend', 'Design', 'UI Design', 'Accessibility'],
    requiredSkills: ['React', 'TypeScript', 'CSS', 'UI Design'],
    costPerMember: 100,
    minHoursPerWeek: 8,
  },
  {
    id: 'cand-03',
    title: 'SecureVault Cryptography',
    description: 'A zero-knowledge password manager and encryption vault with client-side secret protection.',
    domain: 'Cybersecurity',
    domainTags: ['Cybersecurity', 'Privacy', 'Cryptography', 'Linux'],
    requiredSkills: ['Network Security', 'Linux', 'Python', 'Cryptography'],
    costPerMember: 150,
    minHoursPerWeek: 12,
  },
  {
    id: 'cand-04',
    title: 'EduBot AI Tutor',
    description: 'An adaptive AI tutoring bot targeting under-resourced students via lightweight Web UI.',
    domain: 'AI/Social Impact',
    domainTags: ['AI', 'Social Impact', 'EdTech', 'Machine Learning'],
    requiredSkills: ['Machine Learning', 'Python', 'React', 'TypeScript'],
    costPerMember: 200,
    minHoursPerWeek: 12,
  },
];

const PRESET_SKILLS = ['React', 'TypeScript', 'Python', 'Machine Learning', 'Linux', 'UI Design', 'Data Analysis', 'Node.js', 'Go', 'Rust'];
const PRESET_INTERESTS = ['AI', 'Social Impact', 'Cybersecurity', 'Web3', 'Frontend', 'Developer Tools', 'EdTech', 'FinTech'];
const AVATAR_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6'];

// Helper functions for CSV conversions
function csvToArray(csv: any): string[] {
  if (Array.isArray(csv)) return csv.filter(Boolean).map(String);
  if (typeof csv !== 'string') return [];
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function arrayToCsv(arr: any): string {
  if (Array.isArray(arr)) return arr.filter(Boolean).join(', ');
  if (typeof arr === 'string') return arr;
  return '';
}

// -----------------------------------------------------------------------------
// Live Consensus Engine Logic (Client-Side, operating strictly on addedMembers)
// -----------------------------------------------------------------------------
function computeConsensusFromMembers(members: MemberData[]): ConsensusOutput | null {
  if (members.length < 2) return null;

  // Calculate member satisfaction scores for each candidate
  const scoredCandidates = CANDIDATES_CATALOG.map((candidate) => {
    const memberScores: Record<string, number> = {};

    for (const member of members) {
      // Skill match (0-30 pts)
      const memberSkillsLower = new Set(member.skills.map((s) => s.toLowerCase()));
      const matchedSkills = candidate.requiredSkills.filter((rs) =>
        memberSkillsLower.has(rs.toLowerCase())
      ).length;
      const skillScore = candidate.requiredSkills.length > 0
        ? (matchedSkills / candidate.requiredSkills.length) * 30
        : 25;

      // Interest match (0-30 pts)
      const domainTagsLower = new Set(candidate.domainTags.map((t) => t.toLowerCase()));
      const matchedInterests = member.interests.filter((i) =>
        domainTagsLower.has(i.toLowerCase())
      ).length;
      const interestScore = member.interests.length > 0
        ? (matchedInterests / member.interests.length) * 30
        : 15;

      // Availability (0-20 pts)
      const availabilityScore = Math.min(member.availabilityHours / candidate.minHoursPerWeek, 1) * 20;

      // Budget (0-20 pts)
      const budgetScore = Math.min(member.budget / candidate.costPerMember, 1) * 20;

      const total = Math.min(100, Math.round(skillScore + interestScore + availabilityScore + budgetScore));
      memberScores[member.id] = total;
    }

    const scoresList = Object.values(memberScores);
    const mean = scoresList.reduce((a, b) => a + b, 0) / scoresList.length;
    const variance = scoresList.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scoresList.length;
    const stdDev = Math.sqrt(variance);
    const groupScore = Math.max(0, Math.min(100, Math.round(mean - 0.4 * stdDev)));

    return {
      candidate,
      memberScores,
      groupScore,
    };
  });

  // Sort by group score descending
  scoredCandidates.sort((a, b) => b.groupScore - a.groupScore);
  const winner = scoredCandidates[0];
  const runnerUp = scoredCandidates[1];

  // Role allocations
  const roleAllocation: Record<string, string> = {};
  const assignedMemberIds = new Set<string>();

  for (const skill of winner.candidate.requiredSkills) {
    let bestMemberId: string | null = null;
    let bestScore = -1;

    for (const m of members) {
      if (assignedMemberIds.has(m.id)) continue;
      const matchCount = m.skills.filter((s) => s.toLowerCase().includes(skill.toLowerCase())).length;
      if (matchCount > bestScore) {
        bestScore = matchCount;
        bestMemberId = m.id;
      }
    }

    if (bestMemberId) {
      roleAllocation[bestMemberId] = skill;
      assignedMemberIds.add(bestMemberId);
    }
  }

  // Conflict analysis
  const conflicts: ConsensusOutput['conflicts'] = [];

  // Check budget conflicts
  const budgets = members.map((m) => m.budget);
  const minBudget = Math.min(...budgets);
  const maxBudget = Math.max(...budgets);
  if (maxBudget - minBudget >= 250) {
    const lowBudgetMember = members.find((m) => m.budget === minBudget);
    conflicts.push({
      id: 'conflict-budget-gap',
      type: 'BUDGET_MISMATCH',
      severity: 'high',
      description: `Significant budget mismatch: ${lowBudgetMember?.name || 'Member'} limit is $${minBudget}, while group max is $${maxBudget}.`,
      affectedUserIds: members.map((m) => m.id),
      suggestedResolution: `Align project scope around $${minBudget} to avoid financial strain for lower budget members.`
    });
  }

  // Check availability conflicts
  const hours = members.map((m) => m.availabilityHours);
  const minHours = Math.min(...hours);
  if (minHours < 12) {
    const lowHoursMember = members.find((m) => m.availabilityHours === minHours);
    conflicts.push({
      id: 'conflict-avail-low',
      type: 'AVAILABILITY_GAP',
      severity: 'medium',
      description: `${lowHoursMember?.name || 'Member'} has limited availability (${minHours} hrs/wk).`,
      affectedUserIds: [lowHoursMember?.id || ''],
      suggestedResolution: 'Assign focused component sub-tasks rather than critical path dependencies.'
    });
  }

  return {
    recommendation: winner.candidate.title,
    candidateId: winner.candidate.id,
    groupScore: winner.groupScore,
    memberScores: winner.memberScores,
    roleAllocation,
    conflicts,
    explanation: [
      `Selected "${winner.candidate.title}" because it maximizes interest and skill alignment across all ${members.length} added members.`,
      `Group score of ${winner.groupScore}% reflects high overall satisfaction while minimizing skill gaps.`,
      runnerUp ? `Runner-up alternative: "${runnerUp.candidate.title}" (${runnerUp.groupScore}% fit).` : 'Optimal fit found.'
    ],
    runnerUp: runnerUp?.candidate.title ?? 'None'
  };
}

// -----------------------------------------------------------------------------
// Main Component: SequentialMemberEntry
// -----------------------------------------------------------------------------
export default function SequentialMemberEntry() {
  // Pre-load default 4 members
  const [addedMembers, setAddedMembers] = useState<MemberData[]>(DEFAULT_4_MEMBERS);
  const [editingMemberId, setEditingMemberId] = useState<string | null>('member-alice');
  const [selectedModalMember, setSelectedModalMember] = useState<MemberData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize form with Alice's data by default
  const [currentFormData, setCurrentFormData] = useState<FormData>({
    name: DEFAULT_4_MEMBERS[0].name,
    skills: arrayToCsv(DEFAULT_4_MEMBERS[0].skills),
    interests: arrayToCsv(DEFAULT_4_MEMBERS[0].interests),
    availabilityHours: DEFAULT_4_MEMBERS[0].availabilityHours,
    budget: DEFAULT_4_MEMBERS[0].budget,
    learningGoals: arrayToCsv(DEFAULT_4_MEMBERS[0].learningGoals),
    notes: DEFAULT_4_MEMBERS[0].notes ?? '',
  });

  const [viewMode, setViewMode] = useState<ViewMode>('ENTRY_FORM');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Derive live consensus output ONLY from addedMembers
  const liveConsensus = useMemo(() => {
    return computeConsensusFromMembers(addedMembers);
  }, [addedMembers]);

  // Create member object from current form data
  function buildMemberFromForm(): MemberData | null {
    if (!currentFormData.name.trim()) return null;
    return {
      id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: currentFormData.name.trim(),
      avatarColor: AVATAR_COLORS[addedMembers.length % AVATAR_COLORS.length],
      skills: csvToArray(currentFormData.skills),
      interests: csvToArray(currentFormData.interests),
      availabilityHours: currentFormData.availabilityHours,
      budget: currentFormData.budget,
      learningGoals: csvToArray(currentFormData.learningGoals),
      notes: currentFormData.notes,
    };
  }

  // Clear current form inputs & reset editing state
  function resetForm() {
    setCurrentFormData({
      name: '',
      skills: '',
      interests: '',
      availabilityHours: 15,
      budget: 200,
      learningGoals: '',
      notes: '',
    });
    setEditingMemberId(null);
    setValidationError(null);
  }

  // Load member details into form for editing
  function selectMemberToEdit(id: string) {
    console.log('Edit clicked for ID:', id);
    const found = addedMembers.find((m) => m.id === id);
    if (!found) return;

    setEditingMemberId(id);
    setCurrentFormData({
      name: found.name,
      skills: arrayToCsv(found.skills),
      interests: arrayToCsv(found.interests),
      availabilityHours: found.availabilityHours,
      budget: found.budget,
      learningGoals: arrayToCsv(found.learningGoals),
      notes: found.notes || '',
    });
    setViewMode('ENTRY_FORM');
    setValidationError(null);
  }

  // Button 1 Logic: "Save & Add Next User" or "Update Member Data"
  function handleSaveAndAddNext() {
    console.log('[UI Click] Save & Add Next User clicked');
    if (!currentFormData.name.trim()) {
      setValidationError('Please enter a display name for the group member.');
      return;
    }

    if (editingMemberId) {
      // UPDATE existing member
      setAddedMembers((prev) =>
        prev.map((m) =>
          m.id === editingMemberId
            ? {
                ...m,
                name: currentFormData.name.trim(),
                skills: csvToArray(currentFormData.skills),
                interests: csvToArray(currentFormData.interests),
                availabilityHours: currentFormData.availabilityHours,
                budget: currentFormData.budget,
                learningGoals: csvToArray(currentFormData.learningGoals),
                notes: currentFormData.notes,
              }
            : m
        )
      );
      resetForm();
    } else {
      // ADD new member
      const newMember = buildMemberFromForm();
      if (newMember) {
        setAddedMembers((prev) => [...prev, newMember]);
        resetForm();
      }
    }
  }

  // Button 2 Logic: "Done (Show Live Results)"
  function handleDoneShowResults() {
    let updatedMembers = [...addedMembers];

    if (currentFormData.name.trim()) {
      if (editingMemberId) {
        updatedMembers = updatedMembers.map((m) =>
          m.id === editingMemberId
            ? {
                ...m,
                name: currentFormData.name.trim(),
                skills: csvToArray(currentFormData.skills),
                interests: csvToArray(currentFormData.interests),
                availabilityHours: currentFormData.availabilityHours,
                budget: currentFormData.budget,
                learningGoals: csvToArray(currentFormData.learningGoals),
                notes: currentFormData.notes,
              }
            : m
        );
      } else {
        const newMember = buildMemberFromForm();
        if (newMember) {
          updatedMembers.push(newMember);
        }
      }
      setAddedMembers(updatedMembers);
      resetForm();
    }

    if (updatedMembers.length === 0) {
      setValidationError('Please add at least 1 group member before viewing results.');
      return;
    }

    setViewMode('LIVE_RESULTS');
  }

  // Chip toggles for skills/interests
  function toggleChip(field: 'skills' | 'interests', item: string) {
    const current = csvToArray(currentFormData[field]);
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    setCurrentFormData((v) => ({ ...v, [field]: arrayToCsv(updated) }));
  }

  const inputClass =
    'w-full rounded-xl bg-white border border-slate-300 text-slate-900 text-xs px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 placeholder-slate-400 transition-all shadow-sm';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col items-center justify-start relative">
      {/* Top Header */}
      <div className="w-full max-w-4xl glass-panel p-6 rounded-2xl border border-slate-800 mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 uppercase tracking-widest">
            Campus Collaboration
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            4 Member Data Management & Consensus
          </h1>
          <p className="text-xs text-slate-400">
            Active Members: <strong className="text-teal-700 font-mono">{addedMembers.length}</strong> members loaded
          </p>
        </div>

        {/* View mode toggle tabs */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-semibold">
          <button
            onClick={() => setViewMode('ENTRY_FORM')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              viewMode === 'ENTRY_FORM'
                ? 'bg-teal-600 text-white font-bold shadow-md shadow-teal-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Form Entry View
          </button>
          <button
            onClick={() => setViewMode('LIVE_RESULTS')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              viewMode === 'LIVE_RESULTS'
                ? 'bg-teal-600 text-white font-bold shadow-md shadow-teal-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Results View ({addedMembers.length})
          </button>
        </div>
      </div>

      {/* Main Flow Container */}
      <div className="w-full max-w-4xl space-y-6">
        {/* =========================================================================
           SELECT MEMBER TO EDIT OPTIONS BAR (Alice / Bob / Carol / David)
           ========================================================================= */}
        <div className="bg-teal-50/80 p-4 rounded-2xl border border-teal-200 space-y-2 text-left">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚡ Select Member to Edit Details:</span>
            </label>
            <span className="text-[10px] text-teal-700 font-mono font-medium">
              Click any button to view & modify student preferences
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {addedMembers.slice(0, 4).map((m) => {
              const isSelected = editingMemberId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => selectMemberToEdit(m.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-xs font-bold text-left cursor-pointer ${
                    isSelected
                      ? 'border-teal-600 bg-teal-600 text-white ring-2 ring-teal-500/30 shadow-md scale-[1.02]'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: m.avatarColor }}
                  >
                    {m.name[0]}
                  </span>
                  <div className="truncate flex-1">
                    <p className="truncate text-xs font-extrabold">{m.name}</p>
                    <p className={`text-[10px] font-normal truncate ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                      ${m.budget} • {m.availabilityHours}h/wk
                    </p>
                  </div>
                  {isSelected && <span className="text-[10px] text-teal-100 font-bold">Editing</span>}
                </button>
              );
            })}
          </div>
        </div>

        {viewMode === 'ENTRY_FORM' ? (
          /* =========================================================================
             VIEW 1: ENTRY FORM
             ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            {/* Left Sidebar: List of Saved Members */}
            <div className="space-y-4 lg:col-span-1">
              <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex justify-between items-center">
                  <span>Group Members ({addedMembers.length})</span>
                  <button
                    onClick={resetForm}
                    className="text-[10px] text-teal-600 hover:text-teal-700 font-bold underline cursor-pointer"
                  >
                    + Add New
                  </button>
                </h3>

                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {addedMembers.map((member, idx) => {
                    const isEditing = editingMemberId === member.id;
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-xs ${
                          isEditing
                            ? 'bg-teal-50 border-teal-500 text-teal-950 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div
                          onClick={() => openMemberModal(member)}
                          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                          title="Click to view all details"
                        >
                          <span
                            className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm flex-shrink-0"
                            style={{ backgroundColor: member.avatarColor }}
                          >
                            {member.name[0]}
                          </span>
                          <div className="truncate">
                            <p className="font-extrabold text-slate-900 truncate">{member.name}</p>
                            <p className="text-[10px] text-slate-500 truncate font-medium">
                              ${member.budget} • {member.availabilityHours}h/wk
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => selectMemberToEdit(member.id)}
                          className="px-2 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold transition-all flex-shrink-0 cursor-pointer"
                        >
                          {isEditing ? 'Editing' : '✏️ Edit'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Main Column: Member Detail Form */}
            <div className="lg:col-span-2">
              <div className="enterprise-card p-6 rounded-2xl space-y-5">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      {editingMemberId ? (
                        <>
                          <span className="text-teal-700">✏️ Editing Details for "{currentFormData.name}"</span>
                        </>
                      ) : (
                        `Input Member Details (#${addedMembers.length + 1})`
                      )}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {editingMemberId
                        ? 'Modify member details below and click "Update Member Data".'
                        : 'Fill in details for this group member and click next or finish.'}
                    </p>
                  </div>
                  {editingMemberId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-xs text-slate-400 hover:text-slate-200 font-semibold px-2 py-1 rounded bg-slate-800"
                    >
                      ✕ Cancel Edit
                    </button>
                  )}
                </div>

                {validationError && (
                  <p className="text-xs text-rose-400 bg-rose-950/80 border border-rose-800 rounded-xl p-3">
                    ⚠️ {validationError}
                  </p>
                )}

                <div className="space-y-4">
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Member Display Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="e.g. Alice"
                      value={currentFormData.name}
                      onChange={(e) => {
                        setCurrentFormData((v) => ({ ...v, name: e.target.value }));
                        if (validationError) setValidationError(null);
                      }}
                    />
                  </div>

                  {/* Skills Input + Quick Chips */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Skills <span className="text-slate-500 font-normal">(comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="e.g. React, TypeScript, Python"
                      value={currentFormData.skills}
                      onChange={(e) => setCurrentFormData((v) => ({ ...v, skills: e.target.value }))}
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {PRESET_SKILLS.map((skill) => {
                        const active = csvToArray(currentFormData.skills).includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleChip('skills', skill)}
                            className={`text-[10px] px-2 py-0.5 rounded-md border font-mono transition-all ${
                              active
                                ? 'bg-teal-600 border-teal-600 text-white font-bold'
                                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {active ? `✓ ${skill}` : `+ ${skill}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interests Input + Quick Chips */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Interests <span className="text-slate-500 font-normal">(comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="e.g. AI, Social Impact, Cybersecurity"
                      value={currentFormData.interests}
                      onChange={(e) => setCurrentFormData((v) => ({ ...v, interests: e.target.value }))}
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {PRESET_INTERESTS.map((interest) => {
                        const active = csvToArray(currentFormData.interests).includes(interest);
                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => toggleChip('interests', interest)}
                            className={`text-[10px] px-2 py-0.5 rounded-md border font-mono transition-all ${
                              active
                                ? 'bg-teal-600 border-teal-600 text-white font-bold'
                                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {active ? `✓ ${interest}` : `+ ${interest}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sliders Grid: Availability & Budget */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-slate-700">Availability</label>
                        <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {currentFormData.availabilityHours} hrs/wk
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={40}
                        step={1}
                        value={currentFormData.availabilityHours}
                        onChange={(e) => setCurrentFormData((v) => ({ ...v, availabilityHours: Number(e.target.value) }))}
                        className="w-full accent-teal-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-slate-300">Budget Limit</label>
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                          ${currentFormData.budget} USD
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1000}
                        step={25}
                        value={currentFormData.budget}
                        onChange={(e) => setCurrentFormData((v) => ({ ...v, budget: Number(e.target.value) }))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Learning Goals */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Learning Goals
                    </label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="e.g. Deep Learning, MLOps, System Design"
                      value={currentFormData.learningGoals}
                      onChange={(e) => setCurrentFormData((v) => ({ ...v, learningGoals: e.target.value }))}
                    />
                  </div>
                </div>

                  {/* FORM BUTTONS */}
                  <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleSaveAndAddNext}
                      className="enterprise-btn-secondary py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <span>{editingMemberId ? '✓ Update Member Data' : '+ Save & Add Next User'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDoneShowResults}
                      className="py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-teal-500/30 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                    >
                      <span>Done (Show Live Results)</span>
                      <span>→</span>
                    </button>
                  </div>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             VIEW 2: LIVE RESULTS VIEW
             ========================================================================= */
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-teal-50 border border-teal-200 p-4 rounded-2xl">
              <div>
                <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
                  Live Group Consensus — {addedMembers.length} Member{addedMembers.length === 1 ? '' : 's'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any member card below to view their full details or trigger an edit.
                </p>
              </div>

              <button
                onClick={() => setViewMode('ENTRY_FORM')}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all shadow-md"
              >
                + Add / Edit Members
              </button>
            </div>

            {/* Edge case check for < 2 members */}
            {addedMembers.length < 2 ? (
              <div className="glass-panel p-8 rounded-2xl border border-amber-500/30 text-center space-y-3">
                <p className="text-amber-400 font-bold text-sm">
                  ⚠️ Minimum 2 Members Required for Group Consensus
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  You have currently added <strong>{addedMembers.length} member</strong> ({addedMembers[0]?.name || 'Member 1'}). Please add at least one more member to calculate trade-offs, group scores, and role allocations.
                </p>
                <button
                  onClick={() => setViewMode('ENTRY_FORM')}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  ← Return to Form & Add Member 2
                </button>
              </div>
            ) : liveConsensus ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Added Members & Conflicts */}
                <div className="space-y-6">
                  {/* Added Members List (Click to open modal / Edit) */}
                  <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Scored Team Members ({addedMembers.length}) — Click to View Details
                    </h3>
                    <div className="space-y-2">
                      {addedMembers.map((member) => (
                        <div
                          key={member.id}
                          onClick={() => openMemberModal(member)}
                          className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-500/60 hover:shadow-sm cursor-pointer transition-all text-xs"
                          title="Click to view full details"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                              style={{ backgroundColor: member.avatarColor }}
                            >
                              {member.name[0]}
                            </span>
                            <span className="font-bold text-slate-900">{member.name}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-teal-800 font-bold text-xs bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              {liveConsensus.memberScores[member.id] ?? 0}% Fit
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectMemberToEdit(member.id);
                              }}
                              className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] rounded cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conflict Panel */}
                  <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Detected Conflicts ({liveConsensus.conflicts.length})
                    </h3>
                    <ConflictPanel conflicts={liveConsensus.conflicts} />
                  </div>
                </div>

                {/* Right Column: Winning Recommendation & Details */}
                <div className="space-y-6">
                  {/* Winning Recommendation Card */}
                  <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-extrabold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 uppercase tracking-wider">
                          Winning Group Choice
                        </span>
                        <h2 className="text-2xl font-extrabold text-white mt-1">
                          {liveConsensus.recommendation}
                        </h2>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Group Score</p>
                        <span className="text-4xl font-black text-emerald-400 font-mono">
                          {liveConsensus.groupScore}%
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                      Runner-up Project: <strong className="text-slate-200">{liveConsensus.runnerUp}</strong>
                    </p>
                  </div>

                  {/* Individual Satisfaction Scores */}
                  <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Individual Member Satisfaction Scores
                    </h3>
                    {addedMembers.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => openMemberModal(member)}
                        className="cursor-pointer hover:opacity-90"
                      >
                        <ScoreBar
                          label={member.name}
                          score={liveConsensus.memberScores[member.id] ?? 0}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Role Allocations */}
                  {Object.keys(liveConsensus.roleAllocation).length > 0 && (
                    <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Assigned Project Roles
                      </h3>
                      <RoleAllocationTable
                        roleAllocation={liveConsensus.roleAllocation}
                        members={addedMembers.map((m) => ({
                          id: m.id,
                          groupId: 'seq-group',
                          userId: m.id,
                          displayName: m.name,
                          avatarColor: m.avatarColor,
                          joinedAt: Date.now(),
                        }))}
                      />
                    </div>
                  )}

                  {/* Trade-off Rationale */}
                  <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Trade-off Rationale
                    </h3>
                    <ExplanationPanel explanation={liveConsensus.explanation} />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Member Detail Modal */}
      <MemberDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        member={selectedModalMember}
        fitScore={
          selectedModalMember && liveConsensus
            ? liveConsensus.memberScores[selectedModalMember.id]
            : undefined
        }
        assignedRole={
          selectedModalMember && liveConsensus
            ? liveConsensus.roleAllocation[selectedModalMember.id]
            : undefined
        }
        onEdit={selectMemberToEdit}
      />
    </div>
  );
}
