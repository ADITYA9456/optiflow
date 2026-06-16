import { SkeletonCard } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <main className="app-bg min-h-screen p-6 pt-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    </main>
  );
}
