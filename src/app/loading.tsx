import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import { Skeleton, ArticleSkeleton, SidebarSkeleton } from '@/components/Skeleton';

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <main className="wp-container py-6">
        <div className="grid lg:grid-cols-3 gap-8 pb-8 border-b-2 border-wp-black">
          <div className="lg:col-span-2">
            <ArticleSkeleton variant="lead" />
          </div>
          <div className="lg:col-span-1 space-y-0">
            <ArticleSkeleton variant="large" />
            <div className="pt-5 space-y-0">
              <ArticleSkeleton />
              <ArticleSkeleton />
              <ArticleSkeleton />
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid md:grid-cols-2 gap-6">
                  <ArticleSkeleton variant="large" />
                  <div className="space-y-0">
                    <ArticleSkeleton />
                    <ArticleSkeleton />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1">
            <SidebarSkeleton />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
