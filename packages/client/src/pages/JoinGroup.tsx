import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { groupApi } from '../api/groupApi.ts';
import { useGroupStore } from '../store/groupStore.ts';
import { useAuth } from '../context/AuthContext.tsx';
import type { User } from '@consensus/shared';

const LS_KEYS = {
  userId: 'consensus_userId',
  groupMemberId: 'consensus_groupMemberId',
  groupId: 'consensus_groupId',
} as const;

const PRESET_USERS = [
  { id: 'user-alice', name: 'Alice', color: '#0d9488' },
  { id: 'user-bob', name: 'Bob', color: '#0284c7' },
  { id: 'user-carol', name: 'Carol', color: '#059669' },
  { id: 'user-david', name: 'David', color: '#d97706' },
  { id: 'user-esha', name: 'Esha', color: '#e11d48' },
] as const;

const COLOR_OPTIONS = ['#0d9488', '#0284c7', '#059669', '#d97706', '#e11d48', '#7c3aed', '#db2777', '#475569'];

export default function JoinGroup() {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  const setCurrentUser = useGroupStore((s) => s.setCurrentUser);

  const [joinCode, setJoinCode] = useState(code ?? '');
  const [selectedUserId, setSelectedUserId] = useState(auth.user?.id ?? '');
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState('#0d9488');
  const [existingUsers, setExistingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    groupApi
      .getUsers()
      .then(({ users }) => setExistingUsers(users))
      .catch(() => setExistingUsers([]));
  }, []);

  useEffect(() => {
    if (auth.user) {
      setSelectedUserId(auth.user.id);
    }
  }, [auth.user]);

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

  // Combine authenticated user + preset list + custom users
  const userOptions = [
    ...(auth.user ? [{ id: auth.user.id, name: `${auth.user.displayName} (You)`, color: auth.user.avatarColor || '#0d9488' }] : []),
    ...PRESET_USERS.filter((p) => p.id !== auth.user?.id),
    ...existingUsers
      .filter((u) => u.id !== auth.user?.id && !PRESET_USERS.some((p) => p.id === u.id))
      .map((u) => ({ id: u.id, name: u.displayName, color: u.avatarColor })),
  ];

  const selectedUser = userOptions.find((u) => u.id === selectedUserId);

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

        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Join Group Session</h1>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Enter your team join code and select your member identity.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Join Code */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Join Code</label>
            <input
              type="text"
              autoFocus={!code}
              className="w-full rounded-xl bg-white border border-slate-300 text-teal-700 font-mono text-lg font-bold tracking-[0.2em] px-4 py-2.5 uppercase focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 placeholder-slate-400 shadow-sm"
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
              <label className="block text-xs font-bold text-slate-700">Who are you?</label>
              <button
                type="button"
                onClick={() => {
                  setIsCustom(!isCustom);
                  setSelectedUserId('');
                }}
                className="text-[11px] text-teal-600 hover:text-teal-700 font-bold cursor-pointer"
              >
                {isCustom ? '← Select member' : '+ Add custom member'}
              </button>
            </div>

            {isCustom ? (
              <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-600 font-bold mb-1">Display Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Frank"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="enterprise-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 font-bold mb-1">Avatar Color</label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCustomColor(c)}
                        className={`h-6 w-6 rounded-full transition-transform cursor-pointer ${
                          customColor === c ? 'scale-125 ring-2 ring-teal-600 shadow-sm' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {userOptions.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUserId(user.id)}
                    disabled={loading}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all text-xs font-bold text-left cursor-pointer ${
                      selectedUserId === user.id
                        ? 'border-teal-600 bg-teal-600 text-white shadow-md shadow-teal-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
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
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !joinCode.trim() || (!isCustom && !selectedUserId)}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-teal-500/30 hover:-translate-y-0.5 cursor-pointer focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
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
