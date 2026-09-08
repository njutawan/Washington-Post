'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { track } from '@/lib/track';

type Comment = {
  id: string;
  author: string;
  userName?: string;
  time: string;
  text: string;
  recommends: number;
  createdAt?: string;
  replies?: Comment[];
};

const seedComments: Comment[] = [
  {
    id: 'c1',
    author: 'ReaderInDC',
    time: '8 minutes ago',
    text: 'It is refreshing to see the Speaker do the right thing even when it costs him political capital. The country comes before party.',
    recommends: 247,
  },
  {
    id: 'c2',
    author: 'BudgetWatcher',
    time: '22 minutes ago',
    text: 'A CR through November just kicks the can down the road. We’ll be right back here in two months.',
    recommends: 163,
  },
  {
    id: 'c3',
    author: 'CapitolHillInsider',
    time: '37 minutes ago',
    text: 'The math in the Senate is going to be tight. McConnell has signaled support but a handful of Rs may defect.',
    recommends: 58,
  },
];

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function CommentItem({ c }: { c: Comment }) {
  const [recs, setRecs] = useState(c.recommends);
  const [recommended, setRecommended] = useState(false);
  return (
    <div className="py-4 border-b border-wp-border">
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-full bg-wp-black text-white flex items-center justify-center font-serif font-bold text-sm flex-shrink-0"
          aria-hidden="true"
        >
          {(c.userName || c.author).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-sans font-bold text-sm">{c.userName || c.author}</span>
            <span className="text-xs font-sans text-wp-gray">{c.createdAt ? timeAgo(c.createdAt) : c.time}</span>
          </div>
          <p className="text-[1rem] leading-relaxed my-2 text-wp-ink font-serif">{c.text}</p>
          <div className="flex items-center gap-4 text-xs font-sans">
            <button
              onClick={() => {
                setRecommended((r) => { setRecs((n) => n + (r ? -1 : 1)); return !r; });
              }}
              className={'flex items-center gap-1 hover:text-wp-red transition tap-target ' + (recommended ? 'text-wp-red font-bold' : 'text-wp-gray')}
            >
              ▲ Recommend ({recs})
            </button>
            <button className="text-wp-gray hover:text-wp-black py-2 px-1 tap-target">Reply</button>
            <button className="text-wp-gray hover:text-wp-black py-2 px-1 tap-target">Share</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Comments({ articleId }: { articleId: string }) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<Comment[]>(seedComments);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/comments/${articleId}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.comments?.length) return;
        // Merge: API comments first, then seed
        const apiComments: Comment[] = d.comments.map((c: any) => ({
          id: c.id,
          author: 'reader',
          userName: c.userName,
          text: c.body,
          recommends: 0,
          createdAt: c.createdAt,
          time: timeAgo(c.createdAt),
        }));
        setComments([...apiComments, ...seedComments]);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [articleId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      if (status !== 'authenticated') {
        setError('Please sign in to post a comment.');
        return;
      }
      const res = await fetch(`/api/comments/${articleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post');
      const newComment: Comment = {
        id: data.comment.id,
        author: 'you',
        userName: session?.user?.name || 'You',
        text: data.comment.body,
        recommends: 0,
        createdAt: data.comment.createdAt,
        time: 'Just now',
      };
      setComments([newComment, ...comments]);
      setText('');
      track('comment_post', { props: { articleId, length: text.length } });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-12 border-t-4 border-wp-black pt-6">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="headline text-2xl">Comments ({comments.length})</h2>
        <button className="text-xs font-sans uppercase tracking-wider text-wp-link hover:underline">
          View all comments
        </button>
      </div>

      {status === 'authenticated' ? (
        <form onSubmit={submit} className="mb-8 p-4 border border-wp-border bg-wp-light">
          <p className="font-sans text-sm mb-2">
            Commenting as <span className="font-bold">{session.user?.name || session.user?.email}</span>
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Join the conversation…"
            aria-label="Write a comment"
            rows={3}
            maxLength={1000}
            className="w-full px-3 py-2 border border-wp-border bg-white font-serif text-base outline-none focus:border-wp-black resize-y"
          />
          <div className="flex justify-between items-center mt-2 gap-3 flex-wrap">
            <p className="text-[11px] font-sans text-wp-gray">Comments are moderated. Keep it civil.</p>
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              className="bg-wp-black text-white px-5 py-2.5 font-sans font-bold uppercase text-xs tracking-wider hover:bg-wp-red transition disabled:opacity-40 tap-target"
            >
              {submitting ? 'Posting…' : 'Post comment'}
            </button>
          </div>
          {error && <p className="text-wp-red text-sm font-sans mt-2" role="alert">{error}</p>}
        </form>
      ) : (
        <div className="mb-8 p-4 border border-wp-border bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="font-sans text-sm">
            <span className="font-bold">Join the conversation.</span> Sign in to post a comment.
          </p>
          <Link href={`/signin?callbackUrl=/article/${articleId}`} className="bg-wp-black text-white px-5 py-2.5 font-sans font-bold uppercase text-xs tracking-wider hover:bg-wp-red transition tap-target">
            Sign in to comment
          </Link>
        </div>
      )}

      <div>
        {comments.map((c) => <CommentItem key={c.id} c={c} />)}
      </div>
    </section>
  );
}
