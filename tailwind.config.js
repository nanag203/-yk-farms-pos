/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1F3D2B',
          light: '#2A5138',
        },
        moss: '#4A6741',
        gold: {
          DEFAULT: '#D9A441',
          dark: '#B8842E',
        },
        cream: '#F7F3EA',
        clay: '#8B5E3C',
        ink: '#1C1C1C',
      },
      fontFamily: {
        display: ['var(--font-slab)', 'serif'],
        body: ['var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
