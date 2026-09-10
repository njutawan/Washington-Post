import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/Skeleton';

export default function LiveLoading() {
  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <main className="wp-container py-6">
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-6" />
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border-l-4 border-wp-border pl-5 py-2 relative">
              <span className="absolute left-[7px] top-3 w-3 h-3 rounded-full bg-wp-border" />
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-5 w-4/5 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-11/12" />
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
