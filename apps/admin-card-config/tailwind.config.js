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
      },
    },
  },
  plugins: [],
};
