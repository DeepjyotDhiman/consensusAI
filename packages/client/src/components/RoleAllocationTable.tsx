import type { MemberWithDisplay } from '../store/groupStore.ts';

interface Props {
  roleAllocation: Record<string, string>;
  members: MemberWithDisplay[];
}

export default function RoleAllocationTable({ roleAllocation, members }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-800">
            <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Member</th>
            <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Assigned Role</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, i) => {
            const role = roleAllocation[member.userId] ?? null;
            return (
              <tr
                key={member.id}
                className={`border-b border-gray-700 last:border-0 ${
                  i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-850'
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.displayName.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="text-gray-200">{member.displayName}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {role ? (
                    <span className="text-indigo-300 font-medium">{role}</span>
                  ) : (
                    <span className="text-gray-600">—</span>
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
