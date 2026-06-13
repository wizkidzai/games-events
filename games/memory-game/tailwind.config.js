/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'wk-teal': '#006464',
        'wk-magenta': '#A30078',
        'wk-yellow': '#FFC832',
        'wk-blue': '#0AA4EB',
        'wk-red': '#FF4747',
        'wk-green': '#43A277',
        'wk-dark': '#2D2D2D',
        'wk-light': '#FAFAFA',
      },
      fontFamily: {
        display: ['Gill Sans Display', 'Gill Sans', 'system-ui', 'sans-serif'],
        ui: ['Poppins', 'Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
