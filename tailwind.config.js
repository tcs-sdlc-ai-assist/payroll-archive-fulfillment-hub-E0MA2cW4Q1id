/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'kelly-green': '#00AE42',
        'kelly-dark': '#003B1F',
        'kelly-gray': {
          50: '#f7f7f8',
          100: '#eeeef0',
          200: '#d9d9de',
          300: '#b8b8c0',
          400: '#91919d',
          500: '#747482',
          600: '#5e5e6a',
          700: '#4d4d57',
          800: '#42424a',
          900: '#3a3a40',
          950: '#26262b',
        },
      },
    },
  },
  plugins: [],
};