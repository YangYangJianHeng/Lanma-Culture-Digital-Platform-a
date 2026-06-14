/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4a6cf7',
        'primary-light': '#6b8aff',
        'primary-dark': '#3451d1',
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false
  }
};
