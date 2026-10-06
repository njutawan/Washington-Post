# Accessibility audit — manual checklist (Task 10)

Automated axe-core + Playwright keyboard tests live in `e2e/accessibility.spec.ts`.
Run them with:

```
npm run e2e -- accessibility.spec.ts
```

No browser available (e.g. sandboxed dev environments)? Use the jsdom-based
approximation of the same axe config — it catches all non-contrast violations
(labels, landmarks, heading order, ARIA names) without Playwright:

```
npm run build && (npm run start &)
npm run axe:local            # all 11 routes × light/dark
npm run axe:local /games     # single route; add --light / --dark to filter
```

Caveat: jsdom has no layout engine, so `color-contrast` findings there are
approximate — treat the CI Playwright run as the source of truth for contrast.

Those cover everything a machine can: WCAG 2.0/2.1 AA rules in both light and
dark modes, skip-link focus, Tab-order sanity, form labels, alt text,
landmarks, heading hierarchy. **Screen readers cannot be driven from CI**, so
walk this short manual checklist on each release:

## VoiceOver (macOS / iOS) — 5 minutes

1. **Turn VoiceOver on** (Cmd-F5 on macOS). Reload `/`.
   - You should hear "Skip to main content, link" announced immediately as the
     first focusable item.
2. **Press Enter** on the skip link. VO should jump into `<main>` and begin
   reading the first article headline.
3. **Use VO-Cmd-H** to jump by heading. Verify there is exactly one `<h1>`
   ("The Washington Post" masthead or the article headline depending on page)
   and that sub-sections are properly nested `<h2>` → `<h3>`.
4. **Open an article** (`/article/house-passes-short-term-spending-bill`).
   - Hero image alt text is read (e.g. "Speaker of the House…").
   - Byline, kicker, and dek are announced in document order, not out-of-order
     from CSS floats.
5. **Tab to the Share button**. VO should say "Share, menu button" and expose
   the menuitems (Copy link / X / Facebook / Email) once opened.
6. **Open the live blog** (`/live/shutdown-countdown`). When a new-update pulse
   appears, it should be announced politely (aria-live).
7. **Toggle dark mode** (moon icon in the masthead). Confirm there is no flash
   and body text remains readable.
8. **Sign-in page** (`/signin`): Tab through Email → Password → Sign in;
   labels and error states are announced.

## NVDA (Windows) — 5 minutes

1. Load `/` with NVDA + Firefox/Chrome.
   - Skip link is the first item; pressing Enter moves focus to main.
2. Use `H` to jump headings, `1`/`2`/`3` to jump by heading level, `B` for
   buttons, `F` for forms, `D` for landmarks.
3. Confirm the search input (magnifying glass) has an accessible name
   ("Search" is announced).
4. On the article page, Tab into the paywall CTA — "Subscribe" button label
   and surrounding context ("You've already used your free article…") make
   sense when read linearly.
5. On `/games`, each crossword cell announces its number (if any), letter,
   and whether it is blacked out. The clue lists are reachable.

## Dark-mode color contrast AA

The design tokens are pre-checked (`scripts/contrast.mjs`):

| Pair                              | Ratio  | Grade    |
|-----------------------------------|-------:|----------|
| `--wp-black` text on `--wp-cream` (light) | 17.8:1 | AAA |
| `--wp-red` on `--wp-cream`        |  6.8:1 | AA       |
| `--wp-link` on `--wp-cream`       |  4.9:1 | AA       |
| `--wp-gray` on `--wp-cream`       |  5.1:1 | AA       |
| `--wp-black` text on `#121212` (dark)    | 16.0:1 | AAA |
| `--wp-gray` on dark               |  8.7:1 | AAA      |
| `--wp-link` (#7fb3e6) on dark     |  8.5:1 | AAA      |
| `--wp-red` (#ff5555) on dark      |  6.0:1 | AA       |

Axe `color-contrast` rule is enabled and runs against both themes in CI.

## What we do not yet cover (track for future)

- **Screen-reader testing in CI**: [@guidepup/playwright](https://github.com/guidepup/guidepup)
  can drive VoiceOver/NVDA from Playwright in the future. It is not added
  today because it requires macOS / Windows hosts with the screen reader
  enabled — a heavier CI setup.
- **Zoom / reflow at 400%**: verify nothing becomes two-dimensional or
  clipped at 1280×1024 equivalent. Automated via axe's `target-size` and
  `meta-viewport` rules already.
- **Cognitive accessibility / plain language**: editorial concern.
