import Link from 'next/link';
export default function InlineNewsletter({
  newsletter = 'morning-mix',
  title = 'Stay informed',
  description = 'Manage your newsletter preferences securely from your account.',
}: {
  newsletter?: string;
  title?: string;
  description?: string;
}) {
  return (
    <aside className="my-8 border-y-2 border-wp-black py-6">
      <h2 className="headline text-xl">{title}</h2>
      <p>{description}</p>
      <Link
        href={'/newsletters#' + encodeURIComponent(newsletter)}
        className="font-bold underline"
      >
        Sign in and manage preferences
      </Link>
      <p className="text-xs text-wp-gray">
        Email delivery is not enabled until verified opt-in is available.
      </p>
    </aside>
  );
}
