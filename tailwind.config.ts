import type { Config } from "tailwindcss";

// Theme tokens drive runtime via CSS variables (lib/theme.ts). Tailwind picks them up
// so existing utility classes (bg-app, text-ink, border-app, etc.) still compose.

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        app: 'var(--bg)',
        deep: 'var(--bg-deep)',
        surface: 'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        // Legacy primary/accent kept as accent var so existing JSX doesn't break visually
        // (will be migrated page by page in F3-F5).
        primary: {
          50:  'var(--accent-soft)',
          100: 'var(--accent-soft)',
          200: 'var(--accent-soft)',
          300: 'var(--accent)',
          400: 'var(--accent)',
          500: 'var(--accent)',
          600: 'var(--accent)',
          700: 'var(--accent)',
          800: 'var(--accent)',
          900: 'var(--ink)',
        },
      },
      borderColor: {
        app: 'var(--border)',
        strong: 'var(--border-strong)',
        DEFAULT: 'var(--border)',
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
        serif: ['var(--font-serif)'],
      },
      borderRadius: {
        card: '14px',
      },
      letterSpacing: {
        head: '-0.02em',
        body: '-0.01em',
        mono: '0.04em',
        eyebrow: '0.12em',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};

export default config;
