/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090B",
        surface: {
          DEFAULT: "#121215",
          elevated: "#18181B",
          subtle: "#1C1C20",
          card: "#111114"
        },
        border: {
          DEFAULT: "#27272A",
          muted: "#202023",
          bright: "#3F3F46"
        },
        brand: {
          DEFAULT: "#10B981", // Emerald industrial pulse
          accent: "#06B6D4",
          violet: "#8B5CF6"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"]
      },
      keyframes: {
        pulseSlow: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        radar: {
          '0%': { transform: 'scale(0.95)', opacity: 0.8 },
          '100%': { transform: 'scale(1.8)', opacity: 0 }
        }
      },
      animation: {
        'pulse-slow': 'pulseSlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-ping': 'radar 2s cubic-bezier(0, 0, 0.2, 1) infinite'
      }
    },
  },
  plugins: [],
};
