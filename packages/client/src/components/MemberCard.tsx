import { useState } from 'react';
import type { MemberWithDisplay } from '../store/groupStore.ts';
import type { Preference } from '@consensus/shared';
import MemberDetailModal from './MemberDetailModal.tsx';

interface Props {
  member: MemberWithDisplay;
  preference: Preference | null;
  isCurrentUser: boolean;
  onEdit?: (memberId: string) => void;
}

function csvToArray(csv: any): string[] {
  if (Array.isArray(csv)) return csv.filter(Boolean).map(String);
  if (typeof csv !== 'string') return [];
  return csv.split(',').map((s) => s.trim()).filter(Boolean);
}

export default function MemberCard({ member, preference, isCurrentUser, onEdit }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!member) return null;

  const hasPrefs = preference !== null && preference !== undefined;
  const displayName = member.displayName || 'Student';
  const initials = displayName.slice(0, 2).toUpperCase();

  const formattedMemberData = {
    id: member.id || '',
    name: displayName,
    avatarColor: member.avatarColor || '#0d9488',
    skills: csvToArray(preference?.skills),
    interests: csvToArray(preference?.interests),
    availabilityHours: Number(preference?.availabilityHours) || 0,
    budget: Number(preference?.budget) || 0,
    learningGoals: csvToArray(preference?.learningGoals),
    notes: preference?.learningGoals ? `Goals: ${preference.learningGoals}` : undefined,
  };

  return (
    <>
      <div
        onClick={() => {
          console.log('Edit clicked for ID:', member.id);
          if (onEdit) {
            onEdit(member.id);
          } else {
            setModalOpen(true);
          }
        }}
        className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 hover:border-teal-500/60 hover:shadow-sm cursor-pointer transition-all group"
        title="Click to edit member details"
      >
        {/* Avatar */}
        <div
          className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
          style={{ backgroundColor: member.avatarColor }}
        >
          {initials}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
              {member.displayName}
            </span>
            {isCurrentUser && (
              <span className="text-[10px] bg-teal-600 text-white px-1.5 py-0.5 rounded font-bold">
                You
              </span>
            )}
            {/* Preference dot indicator */}
            <span
              className={`ml-auto h-2 w-2 rounded-full flex-shrink-0 ${
                hasPrefs ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`}
              title={hasPrefs ? 'Preferences synced' : 'No preferences yet'}
            />
          </div>

          {/* Preference chips */}
          {hasPrefs && formattedMemberData.skills.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {formattedMemberData.skills.map((skill) => (
                <span
                  key={skill}
                  className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono border border-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-[11px] text-slate-400 italic">No preferences set yet — click to view</p>
          )}
        </div>
      </div>

      {/* Member Detail Modal */}
      <MemberDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        member={formattedMemberData}
        onEdit={onEdit}
      />
    </>
  );
}
