import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { groupApi } from '../api/groupApi.ts';
import { useGroupStore } from '../store/groupStore.ts';
import type { User } from '@consensus/shared';

const LS_KEYS = {
  userId: 'consensus_userId',
  groupMemberId: 'consensus_groupMemberId',
  groupId: 'consensus_groupId',
} as const;

const PRESET_USERS = [
  { id: 'user-alice', name: 'Alice', color: '#6366f1' },
  { id: 'user-bob', name: 'Bob', color: '#f59e0b' },
  { id: 'user-carol', name: 'Carol', color: '#10b981' },
  { id: 'user-david', name: 'David', color: '#3b82f6' },
  { id: 'user-esha', name: 'Esha', color: '#ec4899' },
] as const;

const COLOR_OPTIONS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6'];

export default function JoinGroup() {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const setCurrentUser = useGroupStore((s) => s.setCurrentUser);

  const [joinCode, setJoinCode] = useState(code ?? '');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState('#8b5cf6');
  const [existingUsers, setExistingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    groupApi
      .getUsers()
      .then(({ users }) => setExistingUsers(users))
      .catch(() => setExistingUsers([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let userIdToJoin = selectedUserId;

      if (isCustom) {
        if (!customName.trim()) {
          throw new Error('Please enter a display name for your new member.');
        }
        const { user } = await groupApi.createUser(customName.trim(), customColor);
        userIdToJoin = user.id;
      }

      if (!userIdToJoin) {
        throw new Error('Please select who you are or create a custom profile.');
      }

      const result = await groupApi.joinGroup(joinCode.trim().toUpperCase(), userIdToJoin);
      const { group, member } = result;

      // Persist to localStorage
      localStorage.setItem(LS_KEYS.userId, userIdToJoin);
      localStorage.setItem(LS_KEYS.groupMemberId, member.id);
      localStorage.setItem(LS_KEYS.groupId, group.id);

      // Hydrate store
      setCurrentUser(userIdToJoin, member.id);

      navigate(`/group/${group.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group');
    } finally {
      setLoading(false);
    }
  }

  // Combine seeded list with any newly created custom users
  const userOptions = [
    ...PRESET_USERS,
    ...existingUsers
      .filter((u) => !PRESET_USERS.some((p) => p.id === u.id))
      .map((u) => ({ id: u.id, name: u.displayName, color: u.avatarColor })),
  ];

  const selectedUser = userOptions.find((u) => u.id === selectedUserId);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="w-full max-w-md glass-panel border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-300">
            ← Back Home
          </Link>
          <span className="text-xs font-bold text-indigo-400">Join Team Group</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-100 mb-1">Join Group Session</h1>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Enter your team join code and pick your member identity.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Join Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Join Code</label>
            <input
              type="text"
              autoFocus={!code}
              className="w-full rounded-xl bg-slate-900/80 border border-slate-700/80 text-indigo-300 font-mono text-base tracking-[0.2em] px-4 py-2.5 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-slate-600 shadow-inner"
              placeholder="e.g. HACK01"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              disabled={loading}
              maxLength={10}
            />
          </div>

          {/* User Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300">Who are you?</label>
              <button
                type="button"
                onClick={() => {
                  setIsCustom(!isCustom);
                  setSelectedUserId('');
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
              >
                {isCustom ? '← Pick preset member' : '+ Add new custom member'}
              </button>
            </div>

            {isCustom ? (
              <div className="p-4 bg-slate-900/70 border border-indigo-500/30 rounded-xl space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Frank"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Avatar Color</label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCustomColor(c)}
                        className={`h-6 w-6 rounded-full transition-transform ${
                          customColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {userOptions.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUserId(user.id)}
                    disabled={loading}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all text-xs font-medium ${
                      selectedUserId === user.id
                        ? 'border-indigo-500 bg-indigo-950/80 text-white shadow-md shadow-indigo-500/20'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <span
                      className="h-5 w-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name[0]}
                    </span>
                    <span className="truncate">{user.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/80 border border-red-800 rounded-lg p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !joinCode.trim() || (!isCustom && !selectedUserId)}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30"
          >
            {loading
              ? 'Joining Group...'
              : isCustom
              ? `Create & Join as "${customName || 'Member'}"`
              : selectedUser
              ? `Join as ${selectedUser.name}`
              : 'Join Group'}
          </button>
        </form>
      </div>
    </div>
  );
}
