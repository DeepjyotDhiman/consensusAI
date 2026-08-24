

interface MemberItem {
  id: string;
  userId?: string;
  displayName: string;
  avatarColor?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  members?: MemberItem[] | undefined;
  memberScores?: Record<string, number> | undefined;
}


export default function LeaderboardModal({ isOpen, onClose, members = [], memberScores = {} }: Props) {
  // Global Campus tab removed — was hardcoded fake data. Only real team scores are shown.

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

        {/* Content Body — shows real team member scores only */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-900">
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
                          {score > 0 ? 'Consensus participant' : 'Pending preferences'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-400 tabular-nums">
                        {score > 0 ? `${score}%` : '—'}
                      </span>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Fit Score</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
