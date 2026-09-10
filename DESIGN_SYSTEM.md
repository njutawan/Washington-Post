# The Washington Post Clone — Design System

The design system lives in Storybook. Run it with:

```
npm run storybook     # http://localhost:6006
npm run build-storybook
```

`npm run chromatic` publishes to Chromatic for visual review on every PR
(requires `CHROMATIC_PROJECT_TOKEN`).

## Tokens (Tailwind)

| Token | Hex | Use |
|-------|-----|-----|
| `--wp-black` / `wp-black` | `#121212` | Body text, masthead, CTA buttons |
| `--wp-ink` / `wp-ink` | `#2b2b2b` | Article body |
| `--wp-gray` / `wp-gray` | `#6b6b6b` (light) / `#b5b0a6` (dark) | Secondary text (AA contrast) |
| `--wp-cream` / `wp-cream` | `#faf9f6` (light) / `#121212` (dark) | Page background |
| `--wp-light` / `wp-light` | `#f5f3ee` / `#1f1f1f` | Hover surfaces |
| `--wp-border` / `wp-border` | `#dcdcdc` / `#3a3a3a` | Dividers |
| `--wp-red` / `wp-red` | `#b40001` (light) / `#ff5555` (dark) | Accents, links hover, focus rings (AA) |
| `--wp-link` / `wp-link` | `#1a6ec5` / `#7fb3e6` | Hyperlinks (AA+) |
| `--wp-green` / `wp-green` | `#1e7e34` / `#6fd48b` | Success states |

## Typography

- **Display / Headlines**: Playfair Display (serif), weight 700/900, letter-spacing -0.01em,
  lining numerals (`lnum`), discretionary ligatures, `text-wrap: balance`.
- **Body**: Source Serif Pro, 1.1rem/1.7, old-style numerals (`onum`), standard ligatures,
  `hanging-punctuation: first last allow-end`, `text-wrap: pretty`, real drop caps via
  `initial-letter: 3` (with float fallback).
- **UI / Navigation**: Source Sans 3 / Franklin Gothic, weight 700, uppercase tracking.

## Spacing

- 4/8/12/16/24/32/48/64 base scale via Tailwind.
- Container `wp-container` is 1200 px max with responsive paddings.
- Tap targets ≥ 44×44 px on mobile (`.tap-target`).

## Motion

- Page transitions use the View Transitions API (280ms cross-fade) with a
  shared-element `vt-hero`/`vt-title` morph; `prefers-reduced-motion` disables
  them.
- Top-loader bar (3px red) on navigation start; fades after commit.
- Drop caps / marquee / live-dot honor reduced-motion.

## Accessibility

- Skip link, visible `:focus-visible` ring (red, 2px), landmarks, alt text,
  labeled form controls, ARIA live regions for live blog and podcasts.
- WCAG 2.1 AA verified in both themes via axe-core (`npm run test:a11y`).
