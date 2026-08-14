import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupApi } from '../api/groupApi.ts';

const LS_KEYS = {
  userId: 'consensus_userId',
  groupMemberId: 'consensus_groupMemberId',
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
      const { group, joinCode } = result;
      localStorage.setItem(LS_KEYS.groupId, group.id);
      setCreated({ groupId: group.id, joinCode });
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <div className="mb-2 text-xs text-gray-500 uppercase tracking-widest">Group Created</div>
          <p className="text-gray-300 mb-6 text-sm">
            Share this code with your teammates so they can join:
          </p>

          {/* Join code */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-6 py-5 mb-4">
            <p className="text-xs text-gray-500 mb-1">Join Code</p>
            <span className="font-mono text-4xl font-bold text-indigo-300 tracking-[0.25em] select-all">
              {created.joinCode}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="w-full mb-3 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            {copied ? '✓ Copied!' : 'Copy Code'}
          </button>

          <button
            onClick={() => navigate(`/group/${created.groupId}`)}
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
          >
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-xl p-8">
        <h1 className="text-xl font-bold text-gray-100 mb-1">Create a Group</h1>
        <p className="text-sm text-gray-500 mb-6">
          Give your group a name and get a shareable join code.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Group Name</label>
            <input
              type="text"
              autoFocus
              className="w-full rounded-md bg-gray-800 border border-gray-700 text-gray-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
              placeholder="e.g. Team Phoenix"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950 border border-red-800 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      </div>
    </div>
  );
}
