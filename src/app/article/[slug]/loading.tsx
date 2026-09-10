import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import { ArticlePageSkeleton } from '@/components/Skeleton';

export default function ArticleLoading() {
  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <ArticlePageSkeleton />
      <Footer />
    </div>
  );
}
