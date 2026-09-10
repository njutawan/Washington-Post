'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ShareIcon, LinkIcon, TwitterIcon, FacebookIcon, CheckIcon } from './Icons';
import { track } from '@/lib/track';
import { showToast } from './Toaster';

type Props = {
  url?: string;       // absolute or relative; defaults to current page
  title: string;
  text?: string;
  className?: string;
  variant?: 'button' | 'icon';
};

/**
 * Share button. Uses the native Web Share API (navigator.share) on
 * mobile/supporting browsers. Falls back to a dropdown with Copy link,
 * Twitter/X and Facebook share buttons, plus a Mastodon/email option for
 * broad desktop coverage. Shows a "Link copied" confirmation for 2s.
 */
export default function ShareSheet({ url, title, text, className = '', variant = 'icon' }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNative, setCanNative] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanNative(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const shareUrl =
    typeof window !== 'undefined'
      ? new URL(url || window.location.pathname, window.location.origin).toString()
      : url || '/';

  const handleClick = async () => {
    if (canNative) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        track('share', { props: { method: 'native' } });
        return;
      } catch {
        /* user cancelled or failed — fall through to menu */
      }
    }
    setOpen((o) => !o);
  };

  const trackShare = (method: string) => {
    track('share', { props: { method, url: shareUrl } });
    setOpen(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackShare('copy');
      showToast('Link copied to clipboard');
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1400);
    } catch {
      // Legacy fallback
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
      document.body.removeChild(ta);
    }
  };

  const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`;
  const shareX = (e: React.MouseEvent) => {
    trackShare('twitter');
    if (typeof window !== 'undefined') {
      e.preventDefault();
      window.open(twUrl, 'xshare', 'width=600,height=500,noopener');
    }
  };
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent((text ? text + '\n\n' : '') + shareUrl)}`;

  const baseBtnCls = variant === 'button'
    ? 'flex items-center gap-2 px-4 py-2.5 bg-wp-black text-white text-[11px] font-sans font-bold uppercase tracking-wider hover:bg-wp-red transition tap-target'
    : 'w-10 h-10 flex items-center justify-center hover:bg-wp-light rounded-full transition tap-target';

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        onClick={handleClick}
        className={baseBtnCls}
        aria-label="Share"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <ShareIcon className={variant === 'button' ? 'w-4 h-4' : 'w-4 h-4'} />
        {variant === 'button' && <span>Share</span>}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 bg-white border-2 border-wp-black shadow-xl z-50 animate-slide-in"
        >
          <ul className="py-1 font-sans text-sm">
            <li>
              <button
                role="menuitem"
                onClick={copyLink}
                className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-wp-light tap-target"
              >
                {copied ? <CheckIcon className="w-4 h-4 text-wp-green" /> : <LinkIcon className="w-4 h-4" />}
                <span>{copied ? 'Link copied!' : 'Copy link'}</span>
              </button>
            </li>
            <li>
              <a
                role="menuitem"
                href={twUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-wp-light tap-target"
                onClick={shareX}
              >
                <TwitterIcon className="w-4 h-4" />
                <span>Share on X / Twitter</span>
              </a>
            </li>
            <li>
              <a
                role="menuitem"
                href={fbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-wp-light tap-target"
                onClick={(e) => {
                  trackShare('facebook');
                  // FB share popup at reasonable size; also prevent navigation so the popup opens instead of following href
                  if (typeof window !== 'undefined') {
                    e.preventDefault();
                    window.open(fbUrl, 'fbshare', 'width=640,height=480,noopener');
                  }
                }}
              >
                <FacebookIcon className="w-4 h-4" />
                <span>Share on Facebook</span>
              </a>
            </li>
            <li>
              <a
                role="menuitem"
                href={emailUrl}
                className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-wp-light tap-target"
                onClick={() => trackShare('email')}
              >
                <span aria-hidden="true" className="w-4 text-center font-bold">✉</span>
                <span>Email</span>
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
