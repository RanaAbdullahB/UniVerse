/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        navy: {
          DEFAULT: '#0f1b2d',
          mid: '#1a2d4a',
          light: '#243d5e',
        },
        gold: {
          DEFAULT: '#c9a84c',
          light: '#e8c97a',
          dim: '#8a6f30',
        },
      },
    },
  },
  plugins: [],
};
