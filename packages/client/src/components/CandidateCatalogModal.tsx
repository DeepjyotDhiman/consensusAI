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

  const categories = Array.from(new Set(candidates.map((c) => c.domain)));

  const filtered = candidates.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.requiredSkills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || c.domain === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl flex flex-col border border-slate-200 shadow-2xl overflow-hidden text-left">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Candidate Project Archetypes</h2>
            <p className="text-xs text-slate-500">
              The pre-loaded candidate projects ConsensusAI evaluates against your team preferences.
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-3 items-center justify-between">
          <input
            type="text"
            placeholder="Search candidates by skill, title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 w-full sm:w-64 shadow-xs"
          />

          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${categoryFilter === 'all'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              All ({candidates.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${categoryFilter === cat
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
            <div className="py-12 text-center text-slate-500 animate-pulse text-xs font-medium">
              Loading candidates catalog...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No project candidates match your search filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((candidate) => (
                <div
                  key={candidate.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:border-teal-500/40 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-bold">
                        {candidate.id}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {candidate.domain}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 mb-1">{candidate.title}</h3>
                    <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                      {candidate.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap gap-1">
                      {candidate.requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-mono"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Budget: ${candidate.costPerMember} / member</span>
                      <span>Commitment: {candidate.minHoursPerWeek}h/week</span>
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
