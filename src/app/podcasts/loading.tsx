import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/Skeleton';

export default function PodcastsLoading() {
  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <main className="wp-container py-8">
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-10 w-2/3 mb-3" />
        <Skeleton className="h-4 w-1/2 mb-6" />
        <ol className="divide-y divide-wp-border border-t-2 border-b border-wp-black">
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="py-5 flex gap-5 items-start">
              <Skeleton className="w-12 h-12" />
              <div className="flex-1">
                <Skeleton className="h-3 w-48 mb-2" />
                <Skeleton className="h-6 w-4/5 mb-1" />
                <Skeleton className="h-3 w-full" />
              </div>
            </li>
          ))}
        </ol>
      </main>
      <Footer />
    </div>
  );
}
