import Link from 'next/link';

export default function NoAccess() {
  return (
    <div className="min-h-screen bg-wp-cream flex items-center justify-center px-4">
      <div className="max-w-xl text-center">
        <div className="kicker text-wp-red text-xs uppercase tracking-[0.3em] font-bold mb-4">Editorial CMS</div>
        <h1 className="masthead-title text-4xl md:text-5xl mb-3 leading-none">Access restricted</h1>
        <div className="w-16 h-0.5 bg-wp-black mx-auto mb-5" />
        <p className="font-serif text-lg text-wp-ink leading-relaxed mb-6">
          You are signed in but your account does not have editorial privileges.
          The Newsroom CMS is available only to reporters, assigning editors,
          and managing editors. If you believe you should have access, contact
          the Standards desk.
        </p>
        <div className="flex items-center justify-center gap-4 text-sm font-sans">
          <Link href="/" className="bg-wp-red text-white px-5 py-2.5 font-bold uppercase text-xs tracking-wider hover:bg-wp-black transition">Return to site</Link>
          <Link href="/account" className="underline hover:text-wp-red">Your account</Link>
        </div>
      </div>
    </div>
  );
}
