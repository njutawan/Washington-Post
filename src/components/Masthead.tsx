'use client';

import { topNav, subNav } from '@/lib/data';
import { useState } from 'react';
import Link from 'next/link';
import SearchBar from './SearchBar';
import { MenuIcon, BookmarkIcon } from './Icons';
import LiveTicker from './LiveTicker';
import SkipLink from './SkipLink';
import ThemeToggle from './ThemeToggle';
import SubscriberMeter from './SubscriberMeter';
import AuthControls from './AuthControls';
import TopBarWeather from './TopBarWeather';
import EditionSwitcher from './EditionSwitcher';

export default function Masthead() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <SkipLink />
      <header className="bg-wp-cream sticky top-0 z-40 shadow-sm" role="banner" style={{ paddingTop: 'var(--sat)' }}>
      {/* Breaking / live ticker — runs ACROSS THE TOP above everything, like WaPo's real red live bar */}
      <LiveTicker />
      {/* Top utility bar */}
      <div className="border-b border-wp-border">
        <div className="wp-container py-1 md:py-1.5 flex items-center justify-between text-xs font-sans text-wp-gray">
          <div className="flex items-center gap-1 md:gap-2 min-w-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 -ml-2 font-bold uppercase tracking-wider text-wp-black tap-target"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <span className="hidden sm:inline truncate text-[11px]">{today}</span>
            <TopBarWeather />
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/newsletters" className="hidden md:inline px-2 py-1 hover:text-wp-red text-[11px]">Newsletters</Link>
            <Link href="/editorial" className="hidden md:inline px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-wp-red hover:bg-wp-red hover:text-white transition" title="Editorial CMS — staff only">Newsroom</Link>
            <EditionSwitcher />
            <SearchBar />
            <SubscriberMeter />
            <AuthControls />
            <Link
              href="/bookmarks"
              className="hidden sm:flex w-10 h-10 items-center justify-center hover:bg-wp-light text-wp-black hover:text-wp-red transition tap-target"
              aria-label="Saved stories"
              title="Saved for later"
            >
              <BookmarkIcon className="w-[18px] h-[18px]" />
            </Link>
            <ThemeToggle />
            <Link
              href="/subscribe"
              className="bg-wp-black text-white px-3 py-2 font-bold uppercase tracking-wider text-[11px] hover:bg-wp-red transition ml-1 hidden sm:inline-block tap-target"
            >
              Subscribe
            </Link>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="wp-container py-4 sm:py-5 md:py-6 text-center">
        <div className="text-[10px] sm:text-[11px] font-sans uppercase tracking-[0.2em] md:tracking-[0.3em] text-wp-gray mb-1 md:mb-2">
          Democracy Dies in Darkness
        </div>
        <Link href="/" className="inline-block" onClick={closeMenu}>
          <h1 className="masthead-title fluid-display tracking-tightest hover:text-wp-ink">
            The Washington Post
          </h1>
        </Link>
        <div className="flex justify-center items-center gap-4 mt-3 md:mt-4">
          <div className="hidden md:block h-px flex-1 bg-wp-border" />
          <div className="text-[10px] md:text-xs font-sans tracking-widest uppercase text-wp-gray">
            Edition: U.S.
          </div>
          <div className="hidden md:block h-px flex-1 bg-wp-border" />
        </div>
      </div>

      {/* Primary nav: horizontal scroll on mobile/tablet, centered on desktop */}
      <nav aria-label="News sections" className="border-t-2 border-b border-wp-black bg-wp-cream">
        <div className="wp-container relative scroll-fade">
          <ul className="flex items-center gap-4 md:gap-5 py-2 overflow-x-auto no-scrollbar -mx-1 px-1 md:mx-0 md:px-0 md:justify-center md:overflow-visible">
            {topNav.map((item) => (
              <li key={item.slug} className="flex-shrink-0">
                <a href={`/${item.slug}`} className="nav-link whitespace-nowrap py-2 inline-block">
                  {item.label}
                </a>
              </li>
            ))}
            <li className="ml-2 md:ml-4 pl-2 md:pl-4 border-l border-wp-border flex-shrink-0">
              <Link href="/live/shutdown-countdown" className="nav-link whitespace-nowrap text-wp-red flex items-center gap-1 py-2">
                <span className="live-dot" /> Live
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Secondary nav: visible & scrollable on tablet+, compact chips on mobile */}
      <nav aria-label="More sections" className="border-b border-wp-border bg-white/40">
        <div className="wp-container relative scroll-fade">
          <ul className="flex items-center gap-4 md:gap-6 py-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 md:mx-0 md:px-0 md:justify-center md:overflow-visible text-[11px] md:text-[12px]">
            {subNav.map((item) => (
              <li key={item.slug} className="flex-shrink-0">
                <Link href={`/${item.slug}`} className="font-sans text-wp-gray hover:text-wp-black uppercase tracking-wider whitespace-nowrap py-2 inline-block">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile drawer menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-wp-border bg-white">
          <ul className="px-4 py-2 pb-6">
            {[...topNav, ...subNav].map((item) => (
              <li key={item.slug} className="border-b border-wp-border">
                <a href={`/${item.slug}`} className="block py-3 nav-link" onClick={closeMenu}>
                  {item.label}
                </a>
              </li>
            ))}
            <li className="pt-4 grid grid-cols-2 gap-2">
              <Link
                href="/bookmarks"
                onClick={closeMenu}
                className="text-center border-2 border-wp-black py-3 font-sans font-bold uppercase tracking-wider text-sm"
              >
                Saved
              </Link>
              <Link
                href="/subscribe"
                onClick={closeMenu}
                className="text-center bg-wp-black text-white py-3 font-sans font-bold uppercase tracking-wider text-sm"
              >
                Subscribe
              </Link>
            </li>
          </ul>
        </div>
      )}

      </header>
      {/* Spacer for sticky header height (handled by document flow on desktop, but avoids content jump when sticking) */}
    </>
  );
}
