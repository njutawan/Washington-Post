import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/Skeleton';

export default function AuthorLoading() {
  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <main className="wp-container py-6 md:py-10">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 pb-8 border-b-2 border-wp-black">
          <Skeleton className="w-32 h-32 rounded-full" />
          <div className="flex-1 w-full">
            <Skeleton className="h-10 w-3/4 mb-3" />
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
        <div className="space-y-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="py-4 border-b border-wp-border">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-6 w-5/6 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
