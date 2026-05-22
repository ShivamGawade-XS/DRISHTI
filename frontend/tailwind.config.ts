import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        drishti: {
          bg: "#0a0f1e",
          card: "#111827",
          surface: "#1a2235",
          border: "#1e293b",
          cyan: "#00d4ff",
          magenta: "#ff006e",
          amber: "#ffbe0b",
          green: "#00f5a0",
          red: "#ff4757",
          text: "#e2e8f0",
          muted: "#64748b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-in-left": "slideInLeft 0.4s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "pulse-fast": "pulse 1.5s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
        "counter-up": "counterUp 1s ease-out",
        shimmer: "shimmer 2s linear infinite",
        "border-glow": "borderGlow 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(0, 212, 255, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.6)" },
        },
        counterUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        borderGlow: {
          "0%, 100%": { borderColor: "rgba(0, 212, 255, 0.3)" },
          "50%": { borderColor: "rgba(0, 212, 255, 0.8)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-mesh":
          "radial-gradient(at 40% 20%, rgba(0, 212, 255, 0.05) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(255, 0, 110, 0.05) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(0, 245, 160, 0.05) 0px, transparent 50%)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
