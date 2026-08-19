import { useMemo } from 'react';
import type { MemberWithDisplay } from '../store/groupStore.ts';
import type { Preference } from '@consensus/shared';

interface Props {
  members: MemberWithDisplay[];
  preferencesMap?: Record<string, Preference | null>;
}

interface DomainScore {
  domain: string;
  score: number; // 0 to 100
}

const DOMAIN_RULES: { name: string; keywords: string[] }[] = [
  { name: 'Frontend', keywords: ['react', 'next.js', 'nextjs', 'typescript', 'javascript', 'html', 'css', 'tailwind', 'ui'] },
  { name: 'Backend', keywords: ['node.js', 'nodejs', 'node', 'express', 'python', 'fastapi', 'go', 'api', 'java', 'c#'] },
  { name: 'AI / ML', keywords: ['nlp', 'ai', 'machine learning', 'python', 'fastapi', 'llm', 'pytorch', 'tensorflow'] },
  { name: 'UI/UX Design', keywords: ['figma', 'ui design', 'ux design', 'ui/ux', 'design', 'wireframing', 'tailwind', 'css'] },
  { name: 'Database & Cloud', keywords: ['sql', 'postgresql', 'mongodb', 'docker', 'firebase', 'aws', 'gcp', 'prisma', 'git'] },
];

function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export default function TeamSkillRadarChart({ members, preferencesMap = {} }: Props) {
  const domainScores: DomainScore[] = useMemo(() => {
    // Collect all skill tags across members
    const allSkills: string[] = [];
    members.forEach((m) => {
      const pref = preferencesMap[m.id];
      if (pref) {
        if (Array.isArray(pref.topSkills)) allSkills.push(...pref.topSkills);
        if (Array.isArray(pref.interests)) allSkills.push(...pref.interests);
      }
    });

    const normalizedSkills = allSkills.map(normalize);

    return DOMAIN_RULES.map((rule) => {
      let matches = 0;
      rule.keywords.forEach((kw) => {
        const normKw = normalize(kw);
        const count = normalizedSkills.filter((s) => s.includes(normKw) || normKw.includes(s)).length;
        matches += count;
      });

      // Calculate score out of 100 based on matches and member count
      const baseScore = Math.min(100, Math.max(35, matches * 25 + Math.min(members.length * 15, 30)));
      return {
        domain: rule.name,
        score: Math.round(baseScore),
      };
    });
  }, [members, preferencesMap]);

  // SVG Radar Layout Geometry
  const size = 280;
  const center = size / 2;
  const radius = 90;
  const total = domainScores.length;

  // Calculate polygon points
  const points = domainScores.map((ds, index) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = (ds.score / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle, ...ds };
  });

  const polygonPointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Grid concentric circles (polygons)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="enterprise-card p-5 space-y-3 text-left">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <span>📊 Team Capability Radar</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Combined domain strengths across {members.length} team member{members.length === 1 ? '' : 's'}
          </p>
        </div>
        <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full border border-teal-200">
          Domain Synthesis
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
        {/* SVG Spider Chart */}
        <div className="relative shrink-0">
          <svg width={size} height={size} className="overflow-visible">
            {/* Concentric Grid Lines */}
            {gridLevels.map((level, lvlIdx) => {
              const gridPts = domainScores.map((_, i) => {
                const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
                const r = radius * level;
                const x = center + r * Math.cos(angle);
                const y = center + r * Math.sin(angle);
                return `${x},${y}`;
              }).join(' ');

              return (
                <polygon
                  key={lvlIdx}
                  points={gridPts}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={lvlIdx === gridLevels.length - 1 ? 'none' : '2,2'}
                />
              );
            })}

            {/* Axis Lines */}
            {domainScores.map((_, i) => {
              const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
              const x2 = center + radius * Math.cos(angle);
              const y2 = center + radius * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x2}
                  y2={y2}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
              );
            })}

            {/* Filled Data Polygon */}
            <polygon
              points={polygonPointsStr}
              fill="rgba(13, 148, 136, 0.2)"
              stroke="#0d9488"
              strokeWidth="2.5"
              className="transition-all duration-500 ease-out"
            />

            {/* Vertex Dots & Labels */}
            {points.map((p, idx) => {
              const labelRadius = radius + 22;
              const lx = center + labelRadius * Math.cos(p.angle);
              const ly = center + labelRadius * Math.sin(p.angle);

              return (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="#0d9488"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="shadow-sm"
                  />
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[9px] font-extrabold fill-slate-700 tracking-tight"
                  >
                    {p.domain} ({p.score}%)
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Domain Score Breakdown Pills */}
        <div className="flex-1 space-y-2 w-full">
          {domainScores.map((ds) => (
            <div key={ds.domain} className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                <span>{ds.domain}</span>
                <span className="font-mono font-bold text-teal-700">{ds.score}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/80">
                <div
                  className="bg-gradient-to-r from-teal-600 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${ds.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
