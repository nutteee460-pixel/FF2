import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fce7ef",
          100: "#f9d0de",
          200: "#f4a1bd",
          300: "#ed729c",
          400: "#e6437b",
          500: "#E91E63",
          600: "#c71b52",
          700: "#a71542",
          800: "#851033",
          900: "#630a24",
        },
        secondary: {
          50: "#f3e5f5",
          100: "#e1bee7",
          200: "#ce93d8",
          300: "#ba68c8",
          400: "#ab47bc",
          500: "#9C27B0",
          600: "#8e24aa",
          700: "#7b1fa2",
          800: "#6a1b9a",
          900: "#4a148c",
        },
        accent: {
          500: "#FF5722",
          600: "#f4511e",
          700: "#e64a19",
        },
        surface: "#FFFFFF",
        background: "#FAFAFA",
        nong: {
          purple: "#6a3093",
          magenta: "#a044ff",
          deep: "#4c1d95",
        },
      },
      fontFamily: {
        kanit: ["Kanit", "Prompt", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 2s infinite",
        shimmer: "shimmer 2s infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
