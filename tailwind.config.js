/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B1220',
          light: '#0F1729',
        },
        surface: '#131C2E',
        surface2: '#1A2540',
        line: '#263252',
        signal: {
          teal: '#2DD4BF',
          amber: '#F5A623',
          coral: '#F2545B',
          green: '#34D399',
        },
        text: {
          primary: '#E7ECF3',
          muted: '#8B96A8',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(45, 212, 191, 0.15)',
      },
    },
  },
  plugins: [],
};
