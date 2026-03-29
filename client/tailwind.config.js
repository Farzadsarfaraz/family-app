/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#F4F7FB",
        ink: "#1F2937",
        home: "#4F46E5",
        grocery: "#16A34A",
        budget: "#EA580C",
        calendar: "#0EA5E9",
        chores: "#8B5CF6",
      },
    },
  },
  plugins: [],
};
