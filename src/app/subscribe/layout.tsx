import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscribe',
  description: 'Subscribe to The Washington Post for unlimited access to breaking news and analysis.',
  alternates: { canonical: '/subscribe' },
};

export default function SubscribeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
