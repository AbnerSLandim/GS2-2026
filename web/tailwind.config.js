/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Source Sans 3 Variable"', '"Source Sans 3"', "system-ui", "Segoe UI", "sans-serif"],
        display: ['"Montserrat Variable"', "Montserrat", "system-ui", "sans-serif"],
      },
      colors: {
        paper: { DEFAULT: "#F4F2EC", deep: "#ECE9E1", card: "#FBFAF7" },
        rule: { DEFAULT: "#DCD8CD", strong: "#C4BFB1" },
        ink: { DEFAULT: "#14171C", soft: "#30343B", muted: "#5B5F66", faint: "#66696F" },
        petrol: { 50: "#E8F0F1", 100: "#D0E1E3", 300: "#7FA9AF", 500: "#1E6E7B", 600: "#0E5966", 700: "#0B4A55", 800: "#083A43", 900: "#062B32" },
        baixo: { DEFAULT: "#16A34A", text: "#15803D", bg: "#ECF7EF", line: "#BFE3C9" },
        moderado: { DEFAULT: "#CA8A04", text: "#946405", bg: "#FBF5E1", line: "#EAD9A0" },
        alto: { DEFAULT: "#EA580C", text: "#B9440A", bg: "#FCF0E7", line: "#F2CDB2" },
        critico: { DEFAULT: "#DC2626", text: "#B91C1C", bg: "#FBEDEC", line: "#F0C4C1" },
      },
      borderRadius: { xl: "12px", "2xl": "16px" },
      boxShadow: {
        card: "0 1px 0 rgba(20,23,28,0.03)",
        lift: "0 1px 2px rgba(20,23,28,0.05), 0 12px 32px -16px rgba(20,23,28,0.18)",
      },
    },
  },
  plugins: [],
};
