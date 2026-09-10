import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import { Skeleton, ArticleSkeleton } from '@/components/Skeleton';

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <main className="wp-container py-6">
        <Skeleton className="h-10 w-1/2 mb-3" />
        <Skeleton className="h-4 w-64 mb-6" />
        <div className="space-y-0">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="py-4 border-b border-wp-border">
              <ArticleSkeleton />
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
