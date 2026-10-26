/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        arabic: ['"Scheherazade New"', '"Amiri"', 'serif']
      },
      colors: {
        emerald: {
          950: '#042019'
        },
        gold: {
          400: '#E5C158',
          500: '#D4AF37',
          600: '#B59024'
        }
      }
    }
  },
  plugins: []
};
