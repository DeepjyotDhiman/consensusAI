import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { groupApi } from '../api/groupApi.ts';

const LS_KEYS = {
  groupId: 'consensus_groupId',
} as const;

export default function CreateGroup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ groupId: string; joinCode: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await groupApi.createGroup(name.trim());
      const { group, member } = result;
      // Store creator identity
      localStorage.setItem(LS_KEYS.groupId, group.id);
      localStorage.setItem('consensus_groupMemberId', member.id);
      setCreated({ groupId: group.id, joinCode: group.joinCode });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (created) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md enterprise-card p-8 text-center space-y-5 shadow-xl border border-slate-200">
          <div className="inline-block px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
            Team Created Successfully 🎉
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Team Workspace Ready</h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            Share this join code with your teammates so they can connect and submit preferences:
          </p>

          {/* Join code */}
          <div className="bg-teal-50/80 border border-teal-200 rounded-2xl px-6 py-5">
            <p className="text-[10px] text-teal-700 font-extrabold uppercase tracking-wider mb-1">Shareable Join Code</p>
            <span className="font-mono text-3xl font-extrabold text-teal-900 tracking-[0.25em] select-all">
              {created.joinCode}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="enterprise-btn-secondary w-full py-2.5 text-xs font-bold cursor-pointer"
          >
            {copied ? '✓ Copied to Clipboard!' : 'Copy Join Code'}
          </button>

          <button
            onClick={() => navigate(`/group/${created.groupId}`)}
            className="enterprise-btn-primary w-full py-3 text-xs uppercase font-extrabold tracking-wider shadow-lg shadow-teal-500/30 cursor-pointer"
          >
            Go to Team Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md enterprise-card p-8 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
          <Link to="/dashboard" className="text-xs text-slate-500 hover:text-slate-900 font-semibold transition-colors">
            ← Back to Dashboard
          </Link>
          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 uppercase tracking-wider">
            New Team
          </span>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Create a Team</h1>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Give your team a name to get a shareable join code for your teammates. The project will be automatically recommended by AI based on team preferences.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Team / Group Name</label>
            <input
              type="text"
              autoFocus
              className="enterprise-input text-xs"
              placeholder="e.g. Team Phoenix or Alpha Squad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            <p className="text-[10px] text-slate-500 mt-1">
              💡 Teammates will input their skills & interests, and ConsensusAI will recommend the best project.
            </p>
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-teal-500/30 hover:-translate-y-0.5 cursor-pointer focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            {loading ? 'Creating Team...' : 'Create Team'}
          </button>
        </form>
      </div>
    </div>
  );
}
