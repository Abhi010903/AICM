/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        surface: '#f8fafc',
        coconut: {
          50: '#f2fbf4',
          100: '#e1f7e6',
          200: '#c3efcd',
          300: '#94e1a5',
          400: '#5ecc77',
          500: '#38b253',
          600: '#2a9442', // Coconut leaf primary
          700: '#237536',
          800: '#205d2e',
          900: '#1c4d28',
          950: '#0a2a13',
        },
        impact: {
          veryHigh: '#dc2626',
          high: '#ea580c',
          medHigh: '#ca8a04',
          medium: '#2563eb',
          shared: '#16a34a',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        malayalam: ['var(--font-malayalam)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
