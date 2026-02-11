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
        "bd-dark": "#0a0a12",
        "bd-card": "#12121a",
        "bd-accent": "#3b82f6",
        "bd-gold": "#fbbf24",
        "bd-red": "#ef4444",
        "bd-green": "#22c55e",
        "bd-frost": "#67e8f9",
        "bd-laser": "#a855f7",
      },
    },
  },
  plugins: [],
};

export default config;
