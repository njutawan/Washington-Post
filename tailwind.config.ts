import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Channel-based CSS vars so utilities follow .dark (see globals.css
        // --wp-*-ch triplets). The documented v3 pattern keeps opacity
        // modifiers (/70, /20, ...) working. `dark`/`yellow` stay static:
        // dark is unused, yellow is only a translucent read-aloud highlight.
        wp: {
          black: 'rgb(var(--wp-black-ch) / <alpha-value>)',
          dark: '#1a1a1a',
          ink: 'rgb(var(--wp-ink-ch) / <alpha-value>)',
          gray: 'rgb(var(--wp-gray-ch) / <alpha-value>)',
          light: 'rgb(var(--wp-light-ch) / <alpha-value>)',
          cream: 'rgb(var(--wp-cream-ch) / <alpha-value>)',
          border: 'rgb(var(--wp-border-ch) / <alpha-value>)',
          red: 'rgb(var(--wp-red-ch) / <alpha-value>)',
          link: 'rgb(var(--wp-link-ch) / <alpha-value>)',
          green: 'rgb(var(--wp-green-ch) / <alpha-value>)',
          yellow: '#fff3bf',
        },
      },
      fontFamily: {
        sans: ['"Franklin Gothic Medium"', '"Franklin Gothic"', '"Source Sans Pro"', 'Arial', 'sans-serif'],
        serif: ['"Source Serif Pro"', 'Georgia', '"Times New Roman"', 'serif'],
        display: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
      },
      letterSpacing: {
        tightest: '-0.03em',
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#2b2b2b',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '1.1rem',
            lineHeight: '1.7',
            maxWidth: '70ch',
            a: { color: '#1a6ec5', textDecoration: 'underline' },
            h2: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, marginTop: '2rem', borderTop: '3px solid #121212', paddingTop: '1rem' },
            h3: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700 },
            blockquote: {
              fontStyle: 'italic',
              fontSize: '1.5rem',
              borderLeft: '4px solid #b40001',
              paddingLeft: '1.5rem',
              margin: '2rem 0',
              color: '#121212',
            },
            'blockquote p:first-of-type::before': { content: 'none' },
            'blockquote p:first-of-type::after': { content: 'none' },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
