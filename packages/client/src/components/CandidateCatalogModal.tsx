import { useEffect, useState } from 'react';
import { groupApi, type Candidate } from '../api/groupApi.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CandidateCatalogModal({ isOpen, onClose }: Props) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    if (isOpen && candidates.length === 0) {
      setLoading(true);
      groupApi
        .getCandidates()
        .then(({ candidates }) => setCandidates(candidates))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, candidates.length]);

  if (!isOpen) return null;

  const categories = Array.from(new Set(candidates.map((c) => c.category)));

  const filtered = candidates.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.requiredSkills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] glass-panel rounded-2xl flex flex-col border border-indigo-500/20 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-gradient">Candidate Project Archetypes</h2>
            <p className="text-xs text-slate-400">
              The 10 pre-loaded hackathon candidate projects ConsensusAI evaluates against your team preferences.
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-slate-800/50 bg-slate-900/30 flex flex-wrap gap-3 items-center justify-between">
          <input
            type="text"
            placeholder="Search candidates by skill, title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
          />

          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({candidates.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-500 animate-pulse">
              Loading candidates catalog...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No project candidates match your search filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((candidate) => (
                <div
                  key={candidate.id}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-xs text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50 font-bold">
                        {candidate.id}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {candidate.category}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100 mb-1">{candidate.title}</h3>
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                      {candidate.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/60">
                    <div className="flex flex-wrap gap-1">
                      {candidate.requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-md border border-slate-700/60 font-mono"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Budget: ${candidate.minBudget} – ${candidate.maxBudget}</span>
                      <span>Min Commitment: {candidate.minHoursWeek}h/week</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
