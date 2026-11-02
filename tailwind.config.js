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
