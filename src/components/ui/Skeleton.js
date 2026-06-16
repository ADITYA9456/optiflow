'use client';

export function Skeleton({ className = 'h-4 w-full', style }) {
  return <div className={`shimmer ${className}`.trim()} style={style} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-5">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-5/6" />
      <Skeleton className="mt-2 h-3 w-2/3" />
    </div>
  );
}

export default Skeleton;
