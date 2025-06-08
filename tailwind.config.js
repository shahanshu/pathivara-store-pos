// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
      colors: {
        primary: '#1a73e8', // Example primary color
        secondary: '#fbbc05', // Example secondary color
        accent: '#34a853', // Example accent color
      },
      // You could add custom animation keyframes here if desired
      // keyframes: {
      //   fadeInUp: {
      //     '0%': { opacity: '0', transform: 'translateY(20px)' },
      //     '100%': { opacity: '1', transform: 'translateY(0)' },
      //   },
      // },
      // animation: {
      //   fadeInUp: 'fadeInUp 0.5s ease-out',
      // },
    },
  },
  plugins: [],
};