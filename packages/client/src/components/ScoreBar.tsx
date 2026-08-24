interface Props {
  label: string;
  score: number;
  color?: string;
  showValue?: boolean;
}

function barColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function textColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

export default function ScoreBar({ label, score, color, showValue = true }: Props) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const autoBarColor = color ?? barColor(clampedScore);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-700">{label}</span>
        {showValue && (
          <span className={`text-sm font-semibold tabular-nums ${textColor(clampedScore)}`}>
            {clampedScore}%
          </span>
        )}
      </div>
      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${autoBarColor}`}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  );
}
