import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { groupApi } from '../api/groupApi.ts';
import { useGroupStore } from '../store/groupStore.ts';
import { useAuth } from '../context/AuthContext.tsx';

const LS_KEYS = {
  userId: 'consensus_userId',
  groupMemberId: 'consensus_groupMemberId',
  groupId: 'consensus_groupId',
} as const;

export default function JoinGroup() {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  const setCurrentUser = useGroupStore((s) => s.setCurrentUser);

  const [joinCode, setJoinCode] = useState(code ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill code from URL param
  useEffect(() => {
    if (code) setJoinCode(code.toUpperCase());
  }, [code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim() || !auth.user) return;

    setLoading(true);
    setError(null);

    try {
      const result = await groupApi.joinGroup(joinCode.trim().toUpperCase());
      const { group, member } = result;

      // Persist to localStorage
      localStorage.setItem(LS_KEYS.userId, auth.user.id);
      localStorage.setItem(LS_KEYS.groupMemberId, member.id);
      localStorage.setItem(LS_KEYS.groupId, group.id);

      // Hydrate store
      setCurrentUser(auth.user.id, member.id);

      navigate(`/group/${group.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group');
    } finally {
      setLoading(false);
    }
  }

  if (!auth.user) {
    return null; // ProtectedRoute handles redirect to login
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md enterprise-card p-8 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
          <Link to="/dashboard" className="text-xs text-slate-500 hover:text-slate-900 font-semibold transition-colors">
            ← Back to Dashboard
          </Link>
          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 uppercase tracking-wider">
            Join Team Project
          </span>
        </div>

        {/* Authenticated identity display */}
        <div className="flex items-center gap-3 mb-5 p-3.5 bg-teal-50/60 border border-teal-200 rounded-xl">
          <span
            className="h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white shadow-sm"
            style={{ backgroundColor: auth.user.avatarColor || '#0d9488' }}
          >
            {auth.user.displayName[0]}
          </span>
          <div>
            <p className="text-sm font-extrabold text-slate-900">{auth.user.displayName}</p>
            <p className="text-[10px] text-teal-700 font-mono">@{auth.user.username} · Joining as yourself</p>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Join Group Session</h1>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Enter the 6-character join code shared by your team leader.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Join Code</label>
            <input
              id="join-code-input"
              type="text"
              autoFocus={!code}
              className="w-full rounded-xl bg-white border border-slate-300 text-teal-700 font-mono text-lg font-bold tracking-[0.2em] px-4 py-2.5 uppercase focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 placeholder-slate-400 shadow-sm"
              placeholder="e.g. HACK01"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              disabled={loading}
              maxLength={6}
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            id="join-group-submit"
            disabled={loading || !joinCode.trim()}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-teal-500/30 hover:-translate-y-0.5 cursor-pointer focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            {loading ? 'Joining Group...' : `Join as ${auth.user.displayName}`}
          </button>
        </form>
      </div>
    </div>
  );
}
