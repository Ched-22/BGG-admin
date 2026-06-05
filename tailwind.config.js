/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0B0B",
        "bg-elevated": "#1a1a1a",
        fg: "#EDEDED",
        gold: "#C2A46D",
        neutral: "#8A8A8A",
        destructive: "#d4183d",
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        body: ['"Montserrat"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        brand: "0.25rem",
      },
    },
  },
  plugins: [],
};
