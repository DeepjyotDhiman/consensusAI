import type { MemberWithDisplay } from '../store/groupStore.ts';
import type { Preference } from '@consensus/shared';

interface Props {
  member: MemberWithDisplay;
  preference: Preference | null;
  isCurrentUser: boolean;
}

export default function MemberCard({ member, preference, isCurrentUser }: Props) {
  const hasPrefs = preference !== null && preference !== undefined;
  const initials = member.displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800 border border-gray-700">
      {/* Avatar */}
      <div
        className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
        style={{ backgroundColor: member.avatarColor }}
      >
        {initials}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-100 truncate">
            {member.displayName}
          </span>
          {isCurrentUser && (
            <span className="text-xs bg-indigo-600 text-indigo-100 px-1.5 py-0.5 rounded font-medium">
              You
            </span>
          )}
          {/* Preference dot indicator */}
          <span
            className={`ml-auto h-2 w-2 rounded-full flex-shrink-0 ${
              hasPrefs ? 'bg-green-500' : 'bg-gray-600'
            }`}
            title={hasPrefs ? 'Preferences set' : 'No preferences yet'}
          />
        </div>

        {/* Preference chips */}
        {hasPrefs && preference.skills.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {preference.skills.map((skill) => (
              <span
                key={skill}
                className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-xs text-gray-500 italic">No preferences yet</p>
        )}
      </div>
    </div>
  );
}
