import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/Skeleton';

export default function GamesLoading() {
  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <main className="wp-container py-6">
        <Skeleton className="h-10 w-64 mb-3" />
        <Skeleton className="h-4 w-80 mb-6" />
        <Skeleton className="h-[360px] w-[360px] max-w-full" />
      </main>
      <Footer />
    </div>
  );
}
