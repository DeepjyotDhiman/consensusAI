import { Link, useNavigate } from 'react-router-dom';

interface NavbarLogoProps {
  showBadge?: boolean;
  showBackButton?: boolean;
}

export default function NavbarLogo({ showBadge = true, showBackButton = true }: NavbarLogoProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2 text-left">
      {/* Small Clean Back Navigation Button */}
      {showBackButton && (
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center justify-center group"
          title="Go Back"
          aria-label="Go Back"
        >
          <svg
            className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Brand Logo & Text */}
      <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
        {/* Premium Logo Icon Container */}
        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 group-hover:shadow-lg transition-all duration-300">
          <svg
            className="h-4 w-4 sm:h-5 sm:w-5 text-white group-hover:rotate-12 transition-transform duration-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Network & AI Consensus Synapse Nodes */}
            <circle cx="12" cy="5" r="2.5" />
            <circle cx="5" cy="18" r="2.5" />
            <circle cx="19" cy="18" r="2.5" />
            <line x1="12" y1="7.5" x2="5" y2="15.5" />
            <line x1="12" y1="7.5" x2="19" y2="15.5" />
            <line x1="7.5" y1="18" x2="16.5" y2="18" />
          </svg>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
            Consensus<span className="text-emerald-600">AI</span>
          </span>
          {showBadge && (
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-slate-100 border border-slate-200 text-slate-600 hidden md:inline-block">
              Enterprise Campus Platform
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
