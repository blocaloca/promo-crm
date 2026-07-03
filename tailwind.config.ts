import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0d0f", panel: "#15181c", edge: "#242a30", muted: "#8a949e",
        text: "#e8ecef", accent: "#e8ecef",
        ok: "#4ea88b", warn: "#d9a54c", cold: "#c96a5e",
      },
      fontFamily: {
        sans: ['"Hanken Grotesk"', "system-ui", "sans-serif"],
        mono: ['"Spline Sans Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
