import type { MemberWithDisplay } from '../store/groupStore.ts';
import { computeTaskAssignments } from '../utils/projectTaskMapper.ts';

interface Props {
  roleAllocation: Record<string, string>;
  members: MemberWithDisplay[];
  preferencesMap?: Record<string, any> | undefined;
  projectName?: string | undefined;
  customRequiredSkills?: string[] | undefined;
}

export default function RoleAllocationTable({
  roleAllocation,
  members,
  preferencesMap = {},
  projectName,
  customRequiredSkills,
}: Props) {
  const { assigned, missingSkills } = computeTaskAssignments(
    projectName,
    members,
    preferencesMap,
    customRequiredSkills
  );
  const assignedMap = new Map(assigned.map((a) => [a.member.id, a]));

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-2.5 text-slate-500 font-extrabold uppercase tracking-wider">Member</th>
              <th className="text-left px-4 py-2.5 text-slate-500 font-extrabold uppercase tracking-wider">Role & Scope</th>
              <th className="text-left px-4 py-2.5 text-slate-500 font-extrabold uppercase tracking-wider hidden sm:table-cell">Key Responsibilities</th>
              <th className="text-right px-4 py-2.5 text-slate-500 font-extrabold uppercase tracking-wider">Skill Fit</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, i) => {
              const rawRole = roleAllocation[member.userId] || roleAllocation[member.id];
              const assignment = assignedMap.get(member.id) || assignedMap.get(member.userId);

              const role = rawRole || assignment?.roleName || 'Contributor / Upskilling';
              const matchedSkill = assignment?.matchedSkill || null;
              const isStandby = role.includes('Standby') || assignment?.matchTier === 'NONE';

              return (
                <tr
                  key={member.id}
                  className={`border-b border-slate-100 last:border-0 ${
                    i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                  }`}
                >
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                        style={{ backgroundColor: member.avatarColor || '#0d9488' }}
                      >
                        {member.displayName.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="text-slate-900 font-bold">{member.displayName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg border font-extrabold text-xs inline-block ${
                          isStandby
                            ? 'text-amber-800 bg-amber-50 border-amber-200'
                            : 'text-teal-800 bg-teal-50 border-teal-200'
                        }`}
                      >
                        {role}
                      </span>
                      {assignment?.rationale && (
                        <p className="text-[11px] text-slate-500 leading-tight">
                          {assignment.rationale}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top hidden sm:table-cell">
                    {assignment?.responsibilities && assignment.responsibilities.length > 0 ? (
                      <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                        {assignment.responsibilities.map((resp, rIdx) => (
                          <li key={rIdx}>{resp}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">General integration & QA</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    {assignment?.matchTier === 'DIRECT' ? (
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold block sm:inline-block">
                        ✓ Direct: {matchedSkill}
                      </span>
                    ) : assignment?.matchTier === 'CLOSE' ? (
                      <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-bold block sm:inline-block">
                        ✓ Related: {matchedSkill}
                      </span>
                    ) : assignment?.matchTier === 'ADJACENT' ? (
                      <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-bold block sm:inline-block">
                        ⚡ Transferable: {matchedSkill}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold block sm:inline-block">
                        🌱 Ramp-up Area
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {missingSkills && missingSkills.length > 0 && (
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span>⚠️</span>
            <span>
              Uncovered Project Skill Requirements: <strong className="font-mono">{missingSkills.join(', ')}</strong>
            </span>
          </div>
          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
            Recommended for team pairing & upskilling
          </span>
        </div>
      )}
    </div>
  );
}
