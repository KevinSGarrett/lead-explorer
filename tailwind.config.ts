import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: { gold: '#d4af37' },
      borderRadius: { '2xl': '1rem' },
    },
  },
  plugins: [],
}
export default config
