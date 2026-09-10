import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import { Skeleton, ArticleSkeleton, SidebarSkeleton } from '@/components/Skeleton';

export default function SectionLoading() {
  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <main className="wp-container py-6">
        <Skeleton className="h-3 w-48 mb-6" />
        <div className="border-b-4 border-wp-black mb-6 pb-3">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-12 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="pb-8 border-b border-wp-border mb-8">
              <ArticleSkeleton variant="large" />
            </div>
            <div className="space-y-0">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="py-4 border-b border-wp-border">
                  <ArticleSkeleton />
                </div>
              ))}
            </div>
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
