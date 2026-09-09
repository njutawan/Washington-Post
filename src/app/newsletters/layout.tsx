import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Newsletters',
  description:
    'Hand-curated newsletters from our award-winning newsroom — each with a clear cadence and mission. Always free.',
  alternates: { canonical: '/newsletters' },
};

export default function NewslettersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
