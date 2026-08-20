export function SkeletonTaskAllocation() {
  return (
    <div className="enterprise-card p-4 sm:p-5 space-y-4 text-left animate-pulse">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-full bg-slate-200" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-48 bg-slate-200 rounded-md" />
            <div className="h-2.5 w-32 bg-slate-200 rounded-md" />
          </div>
        </div>
        <div className="h-5 w-20 bg-slate-200 rounded-full" />
      </div>

      <div className="space-y-2">
        <div className="h-3 w-36 bg-slate-200 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-slate-100 border border-slate-200/80 p-3 rounded-xl flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-full bg-slate-200 shrink-0" />
                <div className="space-y-1">
                  <div className="h-3 w-24 bg-slate-200 rounded-md" />
                  <div className="h-2.5 w-32 bg-slate-200 rounded-md" />
                </div>
              </div>
              <div className="h-4 w-16 bg-slate-200 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonConsensusSummary() {
  return (
    <div className="enterprise-card p-6 space-y-5 animate-pulse text-left">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="h-4 w-40 bg-slate-200 rounded-md" />
        <div className="h-5 w-24 bg-slate-200 rounded-full" />
      </div>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-slate-200 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-3/4 bg-slate-200 rounded-md" />
          <div className="h-3 w-1/2 bg-slate-200 rounded-md" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-3 w-full bg-slate-200 rounded-md" />
        <div className="h-3 w-5/6 bg-slate-200 rounded-md" />
      </div>
    </div>
  );
}

export default function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-slate-200 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 w-28 bg-slate-200 rounded-md" />
          <div className="h-2.5 w-20 bg-slate-200 rounded-md" />
        </div>
      </div>
    </div>
  );
}
