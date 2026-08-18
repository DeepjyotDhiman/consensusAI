import { useState } from 'react';

interface MemberItem {
  id: string;
  userId?: string;
  displayName: string;
  avatarColor?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  members?: MemberItem[];
  memberScores?: Record<string, number>;
}

interface CampusTeamEntry {
  rank: number;
  teamName: string;
  projectTitle: string;
  membersCount: number;
  consensusScore: number;
  badge: string;
}

const GLOBAL_CAMPUS_TEAMS: CampusTeamEntry[] = [
  { rank: 1, teamName: 'Team Alpha', projectTitle: 'AI Consensus Engine', membersCount: 5, consensusScore: 95, badge: '🥇 1st Place' },
  { rank: 2, teamName: 'Hackers United', projectTitle: 'Autonomous Agent Platform', membersCount: 4, consensusScore: 92, badge: '🥈 2nd Place' },
  { rank: 3, teamName: 'Quantum AI Lab', projectTitle: 'Distributed Graph Solver', membersCount: 4, consensusScore: 89, badge: '🥉 3rd Place' },
  { rank: 4, teamName: 'Neural Nexus', projectTitle: 'Real-time Vector Search', membersCount: 3, consensusScore: 86, badge: 'Top 10%' },
  { rank: 5, teamName: 'Cyber Dynamics', projectTitle: 'Smart Contract Auditor', membersCount: 4, consensusScore: 83, badge: 'Top 15%' },
];

export default function LeaderboardModal({ isOpen, onClose, members = [], memberScores = {} }: Props) {
  const [activeTab, setActiveTab] = useState<'MY_TEAM' | 'GLOBAL_CAMPUS'>('MY_TEAM');

  if (!isOpen) return null;

  const sortedMembers = [...members].sort((a, b) => {
    const scoreA = memberScores[a.userId || a.id] ?? 0;
    const scoreB = memberScores[b.userId || b.id] ?? 0;
    return scoreB - scoreA;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] glass-card-dark text-slate-200 flex flex-col overflow-hidden text-left">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏆</span>
            <div>
              <h2 className="text-lg font-extrabold text-white">Leaderboard & Rankings</h2>
              <p className="text-xs text-slate-400">
                Track satisfaction scores for your team and top campus groups platform-wide.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors font-bold text-xs cursor-pointer border border-white/10"
          >
            ✕
          </button>
        </div>

        {/* Dual Tab Navigation */}
        <div className="px-6 pt-4 pb-2 bg-slate-900 border-b border-white/10 flex gap-2">
          <button
            onClick={() => setActiveTab('MY_TEAM')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
              activeTab === 'MY_TEAM'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 border-white/5 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>👥 My Team ({members.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('GLOBAL_CAMPUS')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
              activeTab === 'GLOBAL_CAMPUS'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 border-white/5 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>🌐 Global Campus</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-900">
          {activeTab === 'MY_TEAM' && (
            <div className="space-y-3">
              {sortedMembers.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  No members have joined this group yet.
                </div>
              ) : (
                sortedMembers.map((member, index) => {
                  const score = memberScores[member.userId || member.id] ?? 0;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-slate-800/50 hover:bg-slate-800 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                          index === 0 ? 'bg-amber-400 text-amber-950 shadow-sm' :
                          index === 1 ? 'bg-slate-300 text-slate-900' :
                          index === 2 ? 'bg-amber-700/40 text-amber-200' :
                          'bg-slate-800 text-slate-400 border border-white/10'
                        }`}>
                          {index + 1}
                        </span>
                        <span
                          className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs"
                          style={{ backgroundColor: member.avatarColor || '#0d9488' }}
                        >
                          {member.displayName[0]}
                        </span>
                        <div>
                          <h4 className="text-sm font-extrabold text-white">{member.displayName}</h4>
                          <p className="text-xs text-slate-400 font-medium">
                            Active Team Member
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-400 tabular-nums">
                          {score}%
                        </span>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Fit Score</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'GLOBAL_CAMPUS' && (
            <div className="space-y-3">
              {GLOBAL_CAMPUS_TEAMS.map((team) => (
                <div
                  key={team.rank}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-slate-800/50 hover:bg-slate-800 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                      team.rank === 1 ? 'bg-amber-400 text-amber-950 shadow-sm' :
                      team.rank === 2 ? 'bg-slate-300 text-slate-900' :
                      team.rank === 3 ? 'bg-amber-700/40 text-amber-200' :
                      'bg-slate-800 text-slate-400 border border-white/10'
                    }`}>
                      {team.rank}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-white">{team.teamName}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {team.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {team.projectTitle} • <span className="text-slate-300 font-medium">{team.membersCount} members</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-400 tabular-nums">
                      {team.consensusScore}%
                    </span>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Consensus</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer border border-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
