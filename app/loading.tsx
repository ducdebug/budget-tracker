import { HomeSkeletonLoader } from '@/components/skeleton-loader';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between px-6 pt-2 pb-4 bg-background safe-area-top">
        <div className="flex items-center gap-2">
          <div className="h-7 w-32 rounded-lg animate-pulse bg-muted" />
          <div className="h-5 w-5 rounded-full animate-pulse bg-muted" />
        </div>
        <div className="h-10 w-10 rounded-full animate-pulse bg-muted" />
      </div>
      <HomeSkeletonLoader />
      {/* Bottom nav skeleton */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto">
        <div className="flex items-center justify-around px-4 py-3 bg-background border-t border-border">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 w-10 rounded-xl animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
