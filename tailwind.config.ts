import type { Config } from 'tailwindcss'

const config: Config = {
  // Enables light/dark theming via adding/removing the `dark` class on <html> or <body>
  darkMode: 'class',

  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
    './src/pages/**/*.{ts,tsx}', // safe to include even if you don’t use pages/
  ],

  theme: {
    extend: {
      // These map to CSS variables that the Figma → tokens step will generate
      // (fallbacks keep your UI stable before the first sync runs)
      colors: {
        background: 'var(--background, #ffffff)',
        foreground: 'var(--foreground, #111111)',
        primary:    'var(--primary, #3b82f6)',
        muted:      'var(--muted, #f5f5f5)',
        accent:     'var(--accent, #e5e7eb)',

        // keep your existing brand color too
        gold: '#d4af37',
      },

      borderRadius: { '2xl': '1rem' },
    },
  },

  plugins: [],
}

export default config

