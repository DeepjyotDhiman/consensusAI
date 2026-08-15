import { useState } from 'react';
import { Link } from 'react-router-dom';
import CandidateCatalogModal from '../components/CandidateCatalogModal.tsx';

const FLOW_STEPS = [
  {
    num: '01',
    title: 'Gather Team Preferences',
    desc: 'Each student inputs their tech stack, interests, budget limits, and weekly availability.',
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
    desc: 'Candidates are evaluated with standard deviation penalties to avoid outlier dissatisfaction.',
    icon: '🎯',
  },
  {
    num: '04',
    title: 'Live AI Recommendation',
    desc: 'Instant output of the optimal project choice, tailored role allocations, and trade-off breakdown.',
    icon: '🚀',
  },
];

export default function Landing() {
  const [catalogOpen, setCatalogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background glow graphics */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between glass-panel sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-xs shadow-lg shadow-indigo-500/30">
            C
          </div>
          <span className="text-base font-bold tracking-tight text-slate-100">
            Consensus<span className="text-indigo-400">AI</span>
          </span>
          <span className="ml-2 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300">
            Campus Life & Student AI
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCatalogOpen(true)}
            className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700/80 hover:bg-slate-800/80 transition-colors hidden sm:block"
          >
            Explore Decision Candidates
          </button>
          <Link
            to="/join"
            className="text-xs text-slate-300 hover:text-white px-3.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800/60 transition-colors"
          >
            Join Group
          </Link>
          <Link
            to="/create"
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-1.5 rounded-lg shadow-md shadow-indigo-600/30 transition-all hover:scale-105"
          >
            Create Group
          </Link>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-5xl mx-auto z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs mb-6 backdrop-blur-sm animate-pulse-subtle">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span>AI-Powered Campus Collaboration & Consensus Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          AI-Assisted Group Decisions for <br />
          <span className="text-gradient">Student Teams & Campus Life</span>
        </h1>

        <p className="text-slate-400 max-w-2xl text-base sm:text-lg mb-10 leading-relaxed">
          Students on campus frequently collaborate in teams but have different skills, interests, availability, budgets, and learning goals. ConsensusAI helps them reach an AI-assisted, transparent group decision instead of relying on informal discussion.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto">
          <Link
            to="/create"
            className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-sm flex items-center justify-center gap-2 group hover:scale-[1.02]"
          >
            <span>Create New Group</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>

          <Link
            to="/join/HACK01"
            className="px-8 py-3.5 glass-panel glass-panel-hover text-slate-200 hover:text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <span>Try Demo Group (HACK01)</span>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="w-full max-w-4xl mt-6">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800/80 pb-3">
            <h2 className="text-xs uppercase font-bold tracking-widest text-slate-400">
              How ConsensusAI Works
            </h2>
            <button
              onClick={() => setCatalogOpen(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-4"
            >
              Browse 10 Project Archetypes →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {FLOW_STEPS.map((step) => (
              <div
                key={step.num}
                className="glass-panel glass-panel-hover rounded-xl p-5 border border-slate-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl">{step.icon}</span>
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-200 mb-1.5">{step.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 py-6 border-t border-slate-900/80 z-10">
        ConsensusAI &copy; {new Date().getFullYear()} — Built for Hackathon Teams
      </footer>

      {/* Catalog Modal */}
      <CandidateCatalogModal isOpen={catalogOpen} onClose={() => setCatalogOpen(false)} />
    </div>
  );
}
