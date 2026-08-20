import React from 'react';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    id: string;
    name: string;
    avatarColor: string;
    skills: string[];
    interests: string[];
    availabilityHours: number;
    budget: number;
    learningGoals: string[];
    notes?: string;
  } | null;
  fitScore?: number;
  assignedRole?: string;
  onEdit?: (memberId: string) => void;
}

export default function MemberDetailModal({
  isOpen,
  onClose,
  member,
  fitScore,
  assignedRole,
  onEdit,
}: MemberDetailModalProps) {
  if (!isOpen || !member) return null;

  const safeSkills = Array.isArray(member.skills)
    ? member.skills
    : typeof member.skills === 'string'
    ? (member.skills as string).split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const safeInterests = Array.isArray(member.interests)
    ? member.interests
    : typeof member.interests === 'string'
    ? (member.interests as string).split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const safeLearningGoals = Array.isArray(member.learningGoals)
    ? member.learningGoals
    : typeof member.learningGoals === 'string'
    ? (member.learningGoals as string).split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white max-w-lg w-full rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-5 relative text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-xs font-bold p-1 h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"
        >
          ✕
        </button>

        {/* Header / Avatar & Name */}
        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
          <div
            className="h-14 w-14 rounded-full flex items-center justify-center text-xl font-extrabold text-white shadow-md"
            style={{ backgroundColor: member.avatarColor }}
          >
            {member.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">{member.name}</h2>
              {fitScore !== undefined && (
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {fitScore}% Fit
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {member.id}</p>
          </div>
        </div>

        {/* Assigned Role Banner (if present) */}
        {assignedRole && (
          <div className="bg-teal-50 border border-teal-200 p-3 rounded-xl flex items-center justify-between">
            <span className="text-xs text-teal-800 font-bold uppercase tracking-wider">
              Assigned Group Role
            </span>
            <span className="text-xs font-extrabold text-white bg-teal-600 px-2.5 py-1 rounded-lg">
              {assignedRole}
            </span>
          </div>
        )}

        {/* Full Details Grid */}
        <div className="space-y-4 text-xs">
          {/* Skills */}
          <div>
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Skills ({safeSkills.length})
            </span>
            {safeSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {safeSkills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-teal-50 border border-teal-200 text-teal-900 px-2.5 py-1 rounded-lg font-bold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">No skills listed</p>
            )}
          </div>

          {/* Interests */}
          <div>
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Interests ({safeInterests.length})
            </span>
            {safeInterests.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {safeInterests.map((interest) => (
                  <span
                    key={interest}
                    className="bg-slate-100 border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg font-bold"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">No interests listed</p>
            )}
          </div>

          {/* Key Metrics: Availability & Budget */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Availability</span>
              <p className="text-sm font-extrabold text-teal-800 font-mono mt-0.5">
                {member.availabilityHours ?? 0} hrs / week
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Budget Limit</span>
              <p className="text-sm font-extrabold text-emerald-700 font-mono mt-0.5">
                ${member.budget ?? 0} USD
              </p>
            </div>
          </div>

          {/* Learning Goals */}
          {safeLearningGoals.length > 0 && (
            <div>
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Learning Goals
              </span>
              <div className="flex flex-wrap gap-1.5">
                {safeLearningGoals.map((goal) => (
                  <span
                    key={goal}
                    className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg"
                  >
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {member.notes && (
            <div>
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Notes
              </span>
              <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed italic">
                "{member.notes}"
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          {onEdit && (
            <button
              onClick={() => {
                console.log('Edit clicked for ID:', member.id);
                onEdit(member.id);
                onClose();
              }}
              className="enterprise-btn-primary py-2 px-4 text-xs font-bold cursor-pointer"
            >
              ✏️ Edit Member Data
            </button>
          )}
          <button
            onClick={onClose}
            className="enterprise-btn-secondary py-2 px-4 text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
