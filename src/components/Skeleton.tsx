export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={'animate-pulse bg-wp-border/60 ' + className} aria-hidden="true" />
  );
}

export function ArticleSkeleton({ variant = 'small' }: { variant?: 'lead' | 'large' | 'small' }) {
  if (variant === 'lead') {
    return (
      <div className="pb-6 md:pb-0">
        <Skeleton className="w-full h-[360px] md:h-[480px] mb-4" />
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-10 w-4/5 mb-3" />
        <Skeleton className="h-10 w-3/5 mb-3" />
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-5 w-4/5 mb-3" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }
  if (variant === 'large') {
    return (
      <div className="pb-5 border-b border-wp-border">
        <Skeleton className="w-full h-[220px] md:h-[260px] mb-3" />
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-7 w-full mb-2" />
        <Skeleton className="h-7 w-3/4 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }
  return (
    <div className="pb-4 border-b border-wp-border">
      <Skeleton className="h-3 w-16 mb-2" />
      <Skeleton className="h-5 w-full mb-1" />
      <Skeleton className="h-5 w-4/5 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <aside className="space-y-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border-t-4 border-b border-wp-black pt-3 pb-1">
          <Skeleton className="h-3 w-32 mb-4" />
          {[1, 2, 3, 4, 5].map((j) => (
            <div key={j} className="flex gap-3 py-3 border-b border-wp-border">
              <Skeleton className="w-7 h-7 flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </aside>
  );
}

export function ArticlePageSkeleton() {
  return (
    <main className="wp-container py-6">
      <Skeleton className="h-3 w-64 mb-6" />
      <div className="grid lg:grid-cols-3 gap-8">
        <article className="lg:col-span-2">
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-12 w-full mb-3" />
          <Skeleton className="h-12 w-4/5 mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-3/4 mb-6" />
          <div className="flex gap-4 pb-4 border-b border-wp-border mb-6">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="w-full h-[400px] mb-3" />
          <div className="space-y-4 mt-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i}>
                <Skeleton className={'h-5 w-full mb-2 ' + (i % 2 === 0 ? 'w-5/6' : '')} />
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        </article>
        <aside>
          <SidebarSkeleton />
        </aside>
      </div>
    </main>
  );
}
