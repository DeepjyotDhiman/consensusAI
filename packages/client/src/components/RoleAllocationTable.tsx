import type { MemberWithDisplay } from '../store/groupStore.ts';
import { computeTaskAssignments } from '../utils/projectTaskMapper.ts';

interface Props {
  roleAllocation: Record<string, string>;
  members: MemberWithDisplay[];
  preferencesMap?: Record<string, any>;
  projectName?: string;
}

export default function RoleAllocationTable({
  roleAllocation,
  members,
  preferencesMap = {},
  projectName = 'Community Design System',
}: Props) {
  const { assigned } = computeTaskAssignments(projectName, members, preferencesMap);
  const assignedMap = new Map(assigned.map((a) => [a.member.id, a]));

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left px-4 py-2.5 text-slate-500 font-extrabold uppercase tracking-wider">Member</th>
            <th className="text-left px-4 py-2.5 text-slate-500 font-extrabold uppercase tracking-wider">Assigned Role</th>
            <th className="text-right px-4 py-2.5 text-slate-500 font-extrabold uppercase tracking-wider">Skill Match</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, i) => {
            const rawRole = roleAllocation[member.userId] || roleAllocation[member.id];
            const assignment = assignedMap.get(member.id) || assignedMap.get(member.userId);

            const role = rawRole || assignment?.roleName || 'Standby / Upskilling';
            const matchedSkill = assignment?.matchedSkill || null;
            const isStandby = role.includes('Standby');

            return (
              <tr
                key={member.id}
                className={`border-b border-slate-100 last:border-0 ${
                  i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                }`}
              >
                <td className="px-4 py-3">
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
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg border font-extrabold text-xs inline-block ${
                      isStandby
                        ? 'text-amber-800 bg-amber-50 border-amber-200'
                        : 'text-teal-800 bg-teal-50 border-teal-200'
                    }`}
                  >
                    {role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {matchedSkill ? (
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                      ✓ {matchedSkill}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                      ⚠️ Needs Skills
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
