/**
 * Font tokens for the WaPo clone.
 *
 * We define CSS variables for three font families (sans / serif / display)
 * using system + web fallbacks that closely match the Washington Post's
 * typographic palette:
 *
 *   --font-sans     ≈ Franklin Gothic / Source Sans Pro → Franklin Gothic
 *                     Medium, Arial Narrow, system-ui. Used for nav, UI,
 *                     bylines, kickers.
 *   --font-serif    ≈ Georgia / Source Serif 4 → body copy.
 *   --font-display  ≈ Playfair Display / Bodoni → headlines (dekor).
 *
 * The production site can layer @next/font/google on top of these at a
 * later date (uncomment the next/font/google block below when Google
 * Fonts is reachable at build time).
 */

// Production: uncomment the following next/font block so Google Fonts load with
// font-display: swap and no FOIT. When blocked (offline/sandboxed), the CSS
// fallbacks above take over.
//
// import { Playfair_Display, Source_Serif_4, Source_Sans_3 } from 'next/font/google';
// export const sans = Source_Sans_3({
//   subsets: ['latin'],
//   weight: ['400', '600', '700', '900'],
//   display: 'swap',
//   variable: '--font-sans',
//   fallback: ['"Franklin Gothic Medium"', 'Arial Narrow', 'Arial', 'sans-serif'],
// });
// export const serif = Source_Serif_4({
//   subsets: ['latin'],
//   weight: ['400', '600', '700'],
//   display: 'swap',
//   variable: '--font-serif',
//   fallback: ['Georgia', '"Times New Roman"', 'serif'],
// });
// export const display = Playfair_Display({
//   subsets: ['latin'],
//   weight: ['700', '900'],
//   display: 'swap',
//   variable: '--font-display',
//   fallback: ['Georgia', '"Times New Roman"', 'serif'],
// });

// CSS-variable names exported so consumers can reference them in className.
export const sans = { variable: '--font-sans', className: '' } as const;
export const serif = { variable: '--font-serif', className: '' } as const;
export const display = { variable: '--font-display', className: '' } as const;

/** Appends these font-family values to :root via globals.css. */
export const fontFamilies = {
  sans: [
    '"Franklin Gothic Medium"',
    '"Franklin Gothic"',
    '"ITC Franklin Gothic"',
    '"Arial Narrow"',
    'Arial',
    'system-ui',
    '-apple-system',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ].join(', '),
  serif: ['Georgia', '"Times New Roman"', 'Cambria', '"Droid Serif"', 'serif'].join(', '),
  display: [
    '"Playfair Display"',
    'Georgia',
    '"Times New Roman"',
    'Cambria',
    'serif',
  ].join(', '),
};
