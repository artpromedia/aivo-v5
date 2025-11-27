/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./apps/**/*.{js,ts,jsx,tsx}",
    "./mobile/**/*.{js,ts,jsx,tsx}",
    "./packages/ui/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Primary violet palette
        primary: {
          DEFAULT: "#7C3AED",
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95"
        },
        // Friendly accent colors
        mint: {
          DEFAULT: "#6EE7B7",
          light: "#A7F3D0",
          dark: "#059669"
        },
        sunshine: {
          DEFAULT: "#FCD34D",
          light: "#FEF3C7",
          dark: "#D97706"
        },
        sky: {
          DEFAULT: "#7DD3FC",
          light: "#E0F2FE",
          dark: "#0284C7"
        },
        coral: {
          DEFAULT: "#FF7B5C",
          light: "#FED7D7",
          dark: "#E53E3E"
        },
        salmon: {
          DEFAULT: "#FF636F"
        },
        // Surface colors
        lavender: {
          DEFAULT: "#FAF5FF",
          50: "#FEFCFF",
          100: "#FAF5FF",
          200: "#F3E8FF"
        },
        surface: {
          background: "#F8FAFC",
          card: "#FFFFFF",
          elevated: "#FFFFFF"
        },
        // Legacy gradient colors (kept for compatibility)
        "ai-gradient-start": "#7C3AED",
        "ai-gradient-end": "#A78BFA"
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem",
        "3xl": "2rem",
        pill: "999px"
      },
      boxShadow: {
        "soft-primary": "0 18px 40px rgba(124, 58, 237, 0.15)",
        "soft-mint": "0 10px 30px rgba(110, 231, 183, 0.2)",
        "soft-sunshine": "0 10px 30px rgba(252, 211, 77, 0.2)",
        "soft-coral": "0 18px 40px rgba(255, 123, 92, 0.25)",
        "card": "0 4px 20px rgba(0, 0, 0, 0.05)",
        "card-hover": "0 8px 30px rgba(0, 0, 0, 0.08)"
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
        "gradient-lavender": "linear-gradient(180deg, #FAF5FF 0%, #F3E8FF 100%)",
        "gradient-friendly": "linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 50%, #F8FAFC 100%)"
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
