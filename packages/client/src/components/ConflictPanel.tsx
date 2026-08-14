import type { Conflict } from '@consensus/shared';

interface Props {
  conflicts: Conflict[];
}

const severityStyles = {
  high: {
    badge: 'bg-red-900 text-red-400 border border-red-700',
    label: 'High',
  },
  medium: {
    badge: 'bg-amber-900 text-amber-400 border border-amber-700',
    label: 'Medium',
  },
  low: {
    badge: 'bg-blue-900 text-blue-400 border border-blue-700',
    label: 'Low',
  },
} as const;

export default function ConflictPanel({ conflicts }: Props) {
  if (conflicts.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm py-3">
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
        const styles = severityStyles[conflict.severity];
        return (
          <div key={i} className="p-3 rounded-lg bg-gray-800 border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${styles.badge}`}>
                {styles.label}
              </span>
              <span className="text-xs text-gray-400 capitalize">{conflict.type} conflict</span>
            </div>
            <p className="text-sm text-gray-300">{conflict.description}</p>
          </div>
        );
      })}
    </div>
  );
}
