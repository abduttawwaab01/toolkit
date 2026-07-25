"use client";

export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-surface-light/50 ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[100, 80, 60].map((w, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="w-16 h-4 shrink-0" />
          <Skeleton className={`h-8 flex-1`} style={{ maxWidth: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}

export function MediaGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function EffectsPanelSkeleton() {
  return (
    <div className="space-y-3 p-3">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-14 rounded-lg" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-lg" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PlayerSkeleton() {
  return (
    <div className="relative w-full aspect-video bg-surface-light/30 rounded-xl overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-16 rounded-2xl glass flex items-center justify-center animate-pulse">
          <div className="size-6 text-text-tertiary">▶</div>
        </div>
      </div>
    </div>
  );
}

export function MixerSkeleton() {
  return (
    <div className="flex gap-3 p-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton className="h-24 w-6 rounded-full" />
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
      <div className="flex-1" />
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-28 w-8 rounded-full" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}
