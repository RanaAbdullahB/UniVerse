/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['attribute', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: []
}