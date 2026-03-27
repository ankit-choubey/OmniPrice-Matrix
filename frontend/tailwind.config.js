/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#080808",
        panel: "#121212",
        borderline: "#2A2A2A",
        matrixGreen: "#A3E635",
        matrixGreenDim: "rgba(163, 230, 53, 0.1)",
      },
    },
  },
  plugins: [],
}