import { useState } from 'react';
import { Link } from 'react-router-dom';
import CandidateCatalogModal from '../components/CandidateCatalogModal.tsx';
import JoinGroupModal from '../components/JoinGroupModal.tsx';
import LeaderboardModal from '../components/LeaderboardModal.tsx';
import NavbarLogo from '../components/NavbarLogo.tsx';
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
        <NavbarLogo showBackButton={false} />

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

      {/* Edge-to-Edge Full-Width Hero Section */}
      <section className="w-full bg-gradient-to-b from-teal-50/70 via-emerald-50/30 to-slate-50/10 py-16 px-4 sm:px-6 text-center border-b border-slate-200/60 relative overflow-hidden">
        {/* Subtle Ambient Wash */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/20 via-transparent to-teal-100/20 pointer-events-none" />

        {/* Inner Content Centered */}
        <div className="max-w-5xl mx-auto flex flex-col items-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50/90 border border-teal-200 text-teal-800 text-xs font-semibold mb-6 shadow-2xs backdrop-blur-xs">
            <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
            <span>AI-Powered Campus Team Formation &amp; Consensus Engine</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-5 leading-tight text-slate-950 max-w-4xl">
            AI-Assisted Group Decisions for <br />
            <span className="text-teal-600">Student Teams &amp; Campus Life</span>
          </h1>

          <p className="text-slate-600 max-w-xl text-sm sm:text-base mb-8 leading-relaxed font-normal">
            Students on campus frequently collaborate in teams but have different skills, interests, availability, budgets, and learning goals. ConsensusAI brings transparent, AI-assisted decision making to eliminate friction.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto justify-center">
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
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center px-4 max-w-5xl mx-auto w-full">

        {/* Section 2: How ConsensusAI Works Grid */}
        <div className="w-full max-w-5xl my-16">
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
                className="enterprise-card p-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300"
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

        {/* Section 3: Campus Use Cases */}
        <div className="w-full max-w-5xl my-16 text-left">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Tailored for Student Success
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 mb-2">
              Campus Use Cases
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Designed specifically to resolve team friction across all collaborative university scenarios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Use Case 1: Hackathons */}
            <div className="enterprise-card p-6 space-y-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-slate-200/80 rounded-2xl bg-white">
              <div className="h-12 w-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-2xl shadow-xs">
                🚀
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 mb-1">
                  Hackathons &amp; Codeathons
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Quickly match team members based on fast-paced stack requirements (e.g., React, Python, FastAPI) and assign roles before the timer starts.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Speed &amp; Skill Fit
                </span>
              </div>
            </div>

            {/* Use Case 2: Final Year Projects */}
            <div className="enterprise-card p-6 space-y-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-slate-200/80 rounded-2xl bg-white">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl shadow-xs">
                🎓
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 mb-1">
                  Final Year Projects
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Align multi-month commitments, complementary technical skills, and research goals to ensure balanced workload distribution without burnout.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Long-term Alignment
                </span>
              </div>
            </div>

            {/* Use Case 3: Study Groups */}
            <div className="enterprise-card p-6 space-y-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-slate-200/80 rounded-2xl bg-white">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-2xl shadow-xs">
                📚
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 mb-1">
                  Course Study Groups
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Coordinate weekly availability, exam prep topics, and learning goals so no student is left behind or overwhelmed during assignment sprints.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Schedule Harmony
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Section 4: Final CTA Banner with Pattern, Social Proof & Pulsing Button */}
      <section
        className="w-full bg-gradient-to-b from-teal-50/90 via-emerald-50/60 to-slate-50 border-y border-teal-200/80 py-20 px-4 text-center relative overflow-hidden shadow-xs"
        style={{
          backgroundImage: 'radial-gradient(#0d9488 0.75px, transparent 0.75px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          {/* Social Proof Avatars */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-2">
            <div className="flex -space-x-2 overflow-hidden p-0.5">
              <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                A
              </span>
              <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                S
              </span>
              <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                M
              </span>
              <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                R
              </span>
              <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-rose-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                K
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white/90 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-teal-200/80 shadow-2xs">
              <span className="text-amber-500 font-extrabold">★★★★★</span>
              <span>Join 500+ students optimizing their teams</span>
            </div>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Ready to build your dream team?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto font-normal leading-relaxed">
            Eliminate team drama, optimize skill fit, and reach instant group consensus in under 2 minutes.
          </p>

          {/* Pulsing Glow CTA Button - Distinct Concluding Action */}
          <div className="pt-4 flex justify-center">
            <div className="relative inline-flex group">
              <span className="absolute -inset-1 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 opacity-75 blur-md group-hover:opacity-100 animate-pulse transition duration-1000 group-hover:duration-200" />
              <Link
                to={isAuthenticated ? '/dashboard' : '/signup'}
                className="relative enterprise-btn-primary text-sm py-4 px-9 shadow-xl shadow-teal-500/25 active:scale-95 hover:-translate-y-0.5 transition-all flex items-center gap-2.5 font-extrabold"
              >
                <span>{isAuthenticated ? 'Go to Group Workspace 🚀' : 'Create Your First Group 🚀'}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* Modals */}
      <CandidateCatalogModal isOpen={catalogOpen} onClose={() => setCatalogOpen(false)} />
      <JoinGroupModal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
      <LeaderboardModal isOpen={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
    </div>
  );
}
