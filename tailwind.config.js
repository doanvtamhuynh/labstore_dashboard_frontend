/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#1f2937',
        line: '#d9dee7',
        brand: '#0f766e',
        berry: '#9f1239',
        amber: '#b45309',
      },
    },
  },
  plugins: [],
}
