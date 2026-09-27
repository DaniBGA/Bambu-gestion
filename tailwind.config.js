/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bambu: {
          50: '#f2f7f2',
          100: '#e0ebe0',
          200: '#c2d7c3',
          300: '#98bb9a',
          400: '#6d9c71',
          500: '#4d7f52',
          600: '#3a6440',
          700: '#305035',
          800: '#29412c',
          900: '#233626',
          950: '#111e13',
        },
        clay: {
          500: '#c17a4f',
          600: '#a8623a',
        }
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
