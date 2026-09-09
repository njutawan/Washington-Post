import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search stories, topics, writers, and video from The Washington Post.',
  robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
