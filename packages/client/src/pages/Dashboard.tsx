import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { groupApi } from '../api/groupApi.ts';
import type { Group } from '@consensus/shared';
import NavbarLogo from '../components/NavbarLogo.tsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchUserGroups();
  }, [user]);

  async function fetchUserGroups() {
    if (!user) return;
    setLoading(true);
    try {
      const { groups: fetchedGroups } = await groupApi.getUserGroups(user.id);
      setGroups(fetchedGroups);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteGroup(groupId: string) {
    console.log('[UI Click] Delete Group triggered:', groupId);
    setDeletingId(groupId);
    try {
      await groupApi.deleteGroup(groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      setConfirmDeleteId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete project group.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    console.log('[UI Click] Create Group Submit triggered:', newGroupName, newProjectName);
    if (!newGroupName.trim() || !user) return;

    setCreating(true);
    setError(null);

    try {
      const { group } = await groupApi.createGroup(newGroupName.trim(), user.id);
      if (newProjectName.trim()) {
        localStorage.setItem(`consensus_projectName_${group.id}`, newProjectName.trim());
      }
      setNewGroupName('');
      setNewProjectName('');
      setShowCreateModal(false);
      navigate(`/group/${group.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create project group.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen app-grid-bg text-slate-900 flex flex-col">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <NavbarLogo showBadge={false} />
          <span className="text-slate-300">|</span>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider hidden sm:inline">
            Student Workspace Dashboard
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl">
              <span
                className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: user.avatarColor || '#0d9488' }}
              >
                {user.displayName[0]}
              </span>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">{user.displayName}</p>
                <p className="text-[10px] text-slate-500 font-mono">@{user.username}</p>
              </div>
              <button
                onClick={logout}
                className="text-[10px] text-rose-600 hover:text-rose-700 font-bold ml-2 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}

          {groups.length > 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="enterprise-btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <span>+ Create New Project</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 space-y-8">
        {/* Welcome Banner */}
        <div className="enterprise-card p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 uppercase tracking-wider">
              Authenticated Session
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Welcome back, {user?.displayName}!
            </h1>
            <p className="text-xs text-slate-600 font-normal mt-1">
              Manage your student team projects, input group preferences, and calculate live consensus.
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="enterprise-card p-12 text-center space-y-3">
            <span className="h-6 w-6 rounded-full bg-teal-600 animate-ping inline-block" />
            <p className="text-xs text-slate-500 font-medium">Loading your projects database...</p>
          </div>
        ) : groups.length === 0 ? (
          /* =========================================================================
             NEW USER FLOW: 0 Groups -> Create Your First Group Form
             ========================================================================= */
          <div className="max-w-xl mx-auto enterprise-card p-8 space-y-6 shadow-md">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
                <span>First Time Setup</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">Create Your First Project Group</h2>
              <p className="text-xs text-slate-600 font-normal">
                You don't have any active project groups yet. Name your project below to start adding team members.
              </p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3.5 text-center font-medium">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleCreateGroup} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Group / Team Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="enterprise-input"
                  placeholder="e.g. CS490 Senior Capstone Alpha Team"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Project Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="enterprise-input"
                  placeholder="e.g. E-commerce Website, EduBot AI Chatbot, Portfolio, Mobile App"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  AI will dynamically calculate tech stack requirements & skill gaps based on your project name.
                </p>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="enterprise-btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
              >
                <span>{creating ? 'Creating Project Group...' : 'Create First Group & Add Members'}</span>
                <span>→</span>
              </button>
            </form>
          </div>
        ) : (
          /* =========================================================================
             RETURNING USER FLOW: Existing Projects Grid
             ========================================================================= */
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Your Saved Project Groups ({groups.length})
              </h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-xs text-teal-600 hover:text-teal-700 font-bold cursor-pointer"
              >
                + Add Another Project
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="enterprise-card p-6 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase">
                        Code: {g.joinCode}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Created {new Date(g.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xl font-extrabold text-slate-900 truncate">{g.name}</h3>
                      <button
                        onClick={() => setConfirmDeleteId(g.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors text-xs font-bold flex-shrink-0 cursor-pointer"
                        title="Delete project"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      Manage team preferences, evaluate candidate trade-offs, and view role allocations.
                    </p>

                    {confirmDeleteId === g.id && (
                      <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl space-y-2 mt-2">
                        <p className="text-xs font-bold text-rose-800">
                          ⚠️ Delete "{g.name}" and all team members permanently?
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteGroup(g.id)}
                            disabled={deletingId === g.id}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
                          >
                            {deletingId === g.id ? 'Deleting...' : 'Yes, Delete Project'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to={`/group/${g.id}`}
                      className="enterprise-btn-primary w-full py-2.5 text-xs text-center justify-center block"
                    >
                      Continue to Project Dashboard →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal for Creating Additional Projects */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-slate-200 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Create New Project Group
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1 bg-slate-100 rounded cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {error && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                ⚠️ {error}
              </p>
            )}

            <form onSubmit={handleCreateGroup} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Group / Team Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="enterprise-input"
                  placeholder="e.g. Fall Hackathon AI Team"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Project Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="enterprise-input"
                  placeholder="e.g. E-commerce, EduBot, Portfolio, Mobile App"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="enterprise-btn-secondary flex-1 py-2.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="enterprise-btn-primary flex-1 py-2.5 text-xs"
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
