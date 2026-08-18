import { useState } from 'react';
import { Link } from 'react-router-dom';
import CandidateCatalogModal from '../components/CandidateCatalogModal.tsx';
import JoinGroupModal from '../components/JoinGroupModal.tsx';
import LeaderboardModal from '../components/LeaderboardModal.tsx';
import { useAuth } from '../context/AuthContext.tsx';

const FLOW_STEPS = [
  {
    num: '01',
    title: 'Gather Team Preferences',
    desc: 'Each student inputs tech skills, interest tags, budget constraints, and weekly availability.',
    icon: '⚡',
  },
  {
    num: '02',
    title: 'Analyze Group Conflicts',
    desc: 'The engine flags skill overlaps, budget gaps, and schedule mismatches in real time.',
    icon: '🔍',
  },
  {
    num: '03',
    title: 'Score Candidate Projects',
    desc: 'Candidates are evaluated with standard deviation penalties to prevent outlier dissatisfaction.',
    icon: '🎯',
  },
  {
    num: '04',
    title: 'Live AI Recommendation',
    desc: 'Instant output of optimal project choice, tailored role allocations, and trade-off breakdown.',
    icon: '🚀',
  },
];

export default function Landing() {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const primaryBtnClass =
    'enterprise-btn-primary py-3 px-6 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer';

  const secondaryBtnClass =
    'enterprise-btn-secondary py-3 px-6 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header Navigation / Navbar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-teal-600 flex items-center justify-center font-extrabold text-white text-sm shadow-md shadow-teal-500/20">
            C
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-extrabold tracking-tight text-slate-900">
              Consensus<span className="text-teal-600">AI</span>
            </span>
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-slate-100 border border-slate-200 text-slate-600 hidden sm:inline-block">
              Enterprise Campus Platform
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              console.log('[UI Click] Leaderboard clicked');
              setLeaderboardOpen(true);
            }}
            className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 font-bold px-3 py-1.5 rounded-lg border border-amber-200/80 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <span>🏆 Leaderboard</span>
          </button>

          <button
            onClick={() => {
              console.log('[UI Click] Explore Project Catalog clicked');
              setCatalogOpen(true);
            }}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all hidden sm:block cursor-pointer"
          >
            Explore Project Catalog
          </button>

          <button
            onClick={() => {
              console.log('[UI Click] Join Group Navbar button clicked');
              setJoinModalOpen(true);
            }}
            className="text-xs text-slate-700 hover:text-slate-900 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
          >
            Join Group
          </button>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg">
                <span
                  className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: user.avatarColor || '#0d9488' }}
                >
                  {user.displayName[0]}
                </span>
                <span className="text-xs font-bold text-slate-800">{user.displayName}</span>
                <button
                  onClick={logout}
                  className="text-[10px] text-rose-600 hover:text-rose-700 font-bold ml-1 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
              <Link
                to="/dashboard"
                className={`${primaryBtnClass} py-1.5 px-3.5 text-xs`}
              >
                Dashboard →
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs text-slate-700 hover:text-slate-900 font-semibold px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className={`${primaryBtnClass} py-1.5 px-3.5 text-xs`}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-5xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-6 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
          <span>AI-Powered Campus Team Formation & Consensus Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-slate-900">
          AI-Assisted Group Decisions for <br />
          <span className="text-teal-600">Student Teams & Campus Life</span>
        </h1>

        <p className="text-slate-600 max-w-2xl text-base sm:text-lg mb-10 leading-relaxed font-normal">
          Students on campus frequently collaborate in teams but have different skills, interests, availability, budgets, and learning goals. ConsensusAI brings transparent, AI-assisted decision making to eliminate friction.
        </p>

        {/* Hero Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3.5 mb-16 w-full sm:w-auto justify-center">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className={`${primaryBtnClass} text-base py-3 px-8 flex items-center justify-center gap-2`}
            >
              <span>Go to Your Workspace</span>
              <span>→</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className={`${primaryBtnClass} text-base py-3 px-8 flex items-center justify-center gap-2`}
              >
                <span>Get Started / Login</span>
                <span>→</span>
              </Link>
              <Link
                to="/signup"
                className={`${secondaryBtnClass} text-base py-3 px-8 flex items-center justify-center gap-2`}
              >
                <span>Create Account</span>
              </Link>
            </>
          )}
        </div>

        {/* Enterprise Feature Grid */}
        <div className="w-full max-w-5xl mt-4">
          <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-3 text-left">
            <h2 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
              How ConsensusAI Works
            </h2>
            <button
              onClick={() => {
                console.log('[UI Click] Browse 10 Project Archetypes clicked');
                setCatalogOpen(true);
              }}
              className="text-xs text-teal-600 hover:text-teal-700 font-bold cursor-pointer"
            >
              Browse 10 Project Archetypes →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {FLOW_STEPS.map((step) => (
              <div
                key={step.num}
                className="enterprise-card p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">{step.icon}</span>
                    <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 py-8 border-t border-slate-200 bg-white">
        ConsensusAI Platform &copy; {new Date().getFullYear()} — Enterprise Campus Decision System
      </footer>

      {/* Modals */}
      <CandidateCatalogModal isOpen={catalogOpen} onClose={() => setCatalogOpen(false)} />
      <JoinGroupModal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
      <LeaderboardModal isOpen={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
    </div>
  );
}
