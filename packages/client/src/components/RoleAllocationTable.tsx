import type { MemberWithDisplay } from '../store/groupStore.ts';

interface Props {
  roleAllocation: Record<string, string>;
  members: MemberWithDisplay[];
}

export default function RoleAllocationTable({ roleAllocation, members }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left px-4 py-2.5 text-slate-500 font-extrabold uppercase tracking-wider">Member</th>
            <th className="text-left px-4 py-2.5 text-slate-500 font-extrabold uppercase tracking-wider">Assigned Role</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, i) => {
            const role = roleAllocation[member.userId] ?? null;
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
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.displayName.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="text-slate-900 font-bold">{member.displayName}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {role ? (
                    <span className="text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 font-extrabold">
                      {role}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
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
