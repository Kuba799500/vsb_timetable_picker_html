/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx}",
    "./src/index.html"
  ],
  safelist: [
    "bg-green-700",
    "bg-fuchsia-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-purple-700",
    "bg-pink-900",
    "bg-indigo-500",
    "bg-violet-900"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

