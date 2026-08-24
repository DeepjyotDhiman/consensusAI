import type { Conflict } from '@consensus/shared';

interface Props {
  conflicts: Conflict[];
}

const severityStyles = {
  high: {
    badge: 'bg-red-50 text-red-700 border border-red-200',
    label: 'High',
  },
  medium: {
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    label: 'Medium',
  },
  low: {
    badge: 'bg-blue-50 text-blue-700 border border-blue-200',
    label: 'Low',
  },
} as const;

/** Human-readable label for every known ConflictType value. */
const TYPE_LABEL: Record<string, string> = {
  skill:            'Skill',
  budget:           'Budget',
  interest:         'Interest',
  availability:     'Availability',
  BUDGET_MISMATCH:  'Budget',
  AVAILABILITY_GAP: 'Availability',
};

function typeLabel(type: string): string {
  return TYPE_LABEL[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ConflictPanel({ conflicts }: Props) {
  if (conflicts.length === 0) {
    return (
      <div className="flex items-center gap-2 text-emerald-600 text-sm py-3">
        <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
            clipRule="evenodd"
          />
        </svg>
        <span>No conflicts detected</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conflicts.map((conflict, i) => {
        const styles = severityStyles[conflict.severity] ?? severityStyles.low;
        return (
          <div key={i} className="p-3 rounded-lg bg-white border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${styles.badge}`}>
                {styles.label}
              </span>
              <span className="text-xs text-slate-500">{typeLabel(conflict.type)} conflict</span>
            </div>
            <p className="text-sm text-slate-700">{conflict.description}</p>
            {conflict.suggestedResolution && (
              <p className="text-xs text-slate-500 mt-1 italic">{conflict.suggestedResolution}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
