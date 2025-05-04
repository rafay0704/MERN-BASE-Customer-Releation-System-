/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Adjust the path to your source files
  ],
  theme: {
    extend: {
      animation: {
        marquee: 'marquee 60s linear infinite', // Use linear for smoother continuous scroll
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(100%)' }, // Start off-screen to the right
          '100%': { transform: 'translateX(-100%)' }, // End off-screen to the left
        },
      },
    },
  },
  plugins: [],
};
