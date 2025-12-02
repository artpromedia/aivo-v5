import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ========================================
        // Dynamic CSS Variable-Based Colors
        // These switch automatically based on grade band
        // ========================================
        'theme': {
          primary: {
            DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
            light: 'rgb(var(--color-primary-light) / <alpha-value>)',
            dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
            contrast: 'rgb(var(--color-primary-contrast) / <alpha-value>)',
          },
          secondary: {
            DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
            light: 'rgb(var(--color-secondary-light) / <alpha-value>)',
            dark: 'rgb(var(--color-secondary-dark) / <alpha-value>)',
            contrast: 'rgb(var(--color-secondary-contrast) / <alpha-value>)',
          },
          accent: {
            DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
            light: 'rgb(var(--color-accent-light) / <alpha-value>)',
            dark: 'rgb(var(--color-accent-dark) / <alpha-value>)',
          },
          background: {
            DEFAULT: 'rgb(var(--color-background) / <alpha-value>)',
            elevated: 'rgb(var(--color-background-elevated) / <alpha-value>)',
            sunken: 'rgb(var(--color-background-sunken) / <alpha-value>)',
          },
          surface: {
            DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
            elevated: 'rgb(var(--color-surface-elevated) / <alpha-value>)',
            border: 'rgb(var(--color-border) / <alpha-value>)',
          },
          text: {
            DEFAULT: 'rgb(var(--color-text) / <alpha-value>)',
            secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
            muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
            inverse: 'rgb(var(--color-text-inverse) / <alpha-value>)',
          },
          success: {
            DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
            light: 'rgb(var(--color-success-light) / <alpha-value>)',
            dark: 'rgb(var(--color-success-dark) / <alpha-value>)',
          },
          warning: {
            DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
            light: 'rgb(var(--color-warning-light) / <alpha-value>)',
            dark: 'rgb(var(--color-warning-dark) / <alpha-value>)',
          },
          error: {
            DEFAULT: 'rgb(var(--color-error) / <alpha-value>)',
            light: 'rgb(var(--color-error-light) / <alpha-value>)',
            dark: 'rgb(var(--color-error-dark) / <alpha-value>)',
          },
          info: {
            DEFAULT: 'rgb(var(--color-info) / <alpha-value>)',
            light: 'rgb(var(--color-info-light) / <alpha-value>)',
            dark: 'rgb(var(--color-info-dark) / <alpha-value>)',
          },
        },
        // Primary violet palette (legacy compatibility)
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
          900: "#4C1D95",
        },
        // Friendly accent colors
        mint: {
          DEFAULT: "#6EE7B7",
          light: "#A7F3D0",
          dark: "#059669",
        },
        sunshine: {
          DEFAULT: "#FCD34D",
          light: "#FEF3C7",
          dark: "#D97706",
        },
        sky: {
          DEFAULT: "#7DD3FC",
          light: "#E0F2FE",
          dark: "#0284C7",
        },
        coral: {
          DEFAULT: "#FF7B5C",
          light: "#FED7D7",
          dark: "#E53E3E",
        },
        salmon: {
          DEFAULT: "#FF636F",
        },
        // Surface colors
        lavender: {
          DEFAULT: "#FAF5FF",
          50: "#FEFCFF",
          100: "#FAF5FF",
          200: "#F3E8FF",
        },
        surface: {
          background: "#F8FAFC",
          card: "#FFFFFF",
          elevated: "#FFFFFF",
        },
        // Legacy gradient colors
        "ai-gradient-start": "#7C3AED",
        "ai-gradient-end": "#A78BFA",
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem",
        "3xl": "2rem",
        pill: "999px",
      },
      boxShadow: {
        "soft-primary": "0 18px 40px rgba(124, 58, 237, 0.15)",
        "soft-mint": "0 10px 30px rgba(110, 231, 183, 0.2)",
        "soft-sunshine": "0 10px 30px rgba(252, 211, 77, 0.2)",
        "soft-coral": "0 18px 40px rgba(255, 123, 92, 0.25)",
        card: "0 4px 20px rgba(0, 0, 0, 0.05)",
        "card-hover": "0 8px 30px rgba(0, 0, 0, 0.08)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
        "gradient-lavender": "linear-gradient(180deg, #FAF5FF 0%, #F3E8FF 100%)",
        "gradient-friendly":
          "linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 50%, #F8FAFC 100%)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
        'k5': ['Nunito', 'Comic Neue', 'system-ui', 'sans-serif'],
        'dyslexic': ['OpenDyslexic', 'Comic Sans MS', 'sans-serif'],
      },
      // Accessibility utilities
      minHeight: {
        'touch': '44px',
        'touch-large': '48px',
      },
      minWidth: {
        'touch': '44px',
        'touch-large': '48px',
      },
    },
  },
  plugins: [],
};

export default config;
