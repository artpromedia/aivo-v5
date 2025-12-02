/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./apps/**/*.{js,ts,jsx,tsx}",
    "./mobile/**/*.{js,ts,jsx,tsx}",
    "./packages/ui/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    // Educational context breakpoints
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      'tablet-portrait': '768px',
      'tablet-landscape': '1024px',
      'interactive-board': '1920px',
    },
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

        // Primary violet palette (legacy)
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

        // ========================================
        // K-5 Elementary Theme (Warm & Playful)
        // ========================================
        'k5': {
          primary: { DEFAULT: '#FF8A80', light: '#FFBCB5', dark: '#E57373' },
          secondary: { DEFAULT: '#FFE082', light: '#FFF8E1', dark: '#FFD54F' },
          accent: { DEFAULT: '#A5D6A7', light: '#C8E6C9', dark: '#81C784' },
          background: '#FFF8E7',
          'background-sunken': '#FFEEE6',
          surface: '#FFFFFF',
          'surface-elevated': '#FFFCF5',
          border: '#FFE4D6',
          text: '#3E2723',
          'text-secondary': '#5D4037',
          'text-muted': '#8D6E63',
          success: { DEFAULT: '#81C784', light: '#C8E6C9', dark: '#66BB6A' },
          warning: { DEFAULT: '#FFD54F', light: '#FFF8E1', dark: '#FFC107' },
          error: { DEFAULT: '#EF9A9A', light: '#FFCDD2', dark: '#E57373' },
          info: { DEFAULT: '#81D4FA', light: '#E1F5FE', dark: '#4FC3F7' },
        },

        // ========================================
        // 6-8 Middle School Theme (Balanced)
        // ========================================
        'ms': {
          primary: { DEFAULT: '#26A69A', light: '#80CBC4', dark: '#00897B' },
          secondary: { DEFAULT: '#B39DDB', light: '#E1BEE7', dark: '#7E57C2' },
          accent: { DEFAULT: '#4FC3F7', light: '#B3E5FC', dark: '#03A9F4' },
          background: '#F5F5F5',
          'background-sunken': '#F3E5F5',
          surface: '#FFFFFF',
          'surface-elevated': '#FAFAFA',
          border: '#E0E0E0',
          text: '#37474F',
          'text-secondary': '#546E7A',
          'text-muted': '#78909C',
          success: { DEFAULT: '#4DB6AC', light: '#B2DFDB', dark: '#26A69A' },
          warning: { DEFAULT: '#FFB74D', light: '#FFE0B2', dark: '#FFA726' },
          error: { DEFAULT: '#EF5350', light: '#FFCDD2', dark: '#E53935' },
          info: { DEFAULT: '#4FC3F7', light: '#E1F5FE', dark: '#29B6F6' },
        },

        // ========================================
        // 9-12 High School Theme (Professional)
        // ========================================
        'hs': {
          primary: { DEFAULT: '#3F51B5', light: '#7986CB', dark: '#303F9F' },
          secondary: { DEFAULT: '#78909C', light: '#B0BEC5', dark: '#546E7A' },
          accent: { DEFAULT: '#00BCD4', light: '#80DEEA', dark: '#0097A7' },
          background: '#FFFFFF',
          'background-sunken': '#FAFAFA',
          surface: '#FFFFFF',
          'surface-elevated': '#FFFFFF',
          border: '#E0E0E0',
          text: '#212121',
          'text-secondary': '#424242',
          'text-muted': '#757575',
          success: { DEFAULT: '#43A047', light: '#C8E6C9', dark: '#388E3C' },
          warning: { DEFAULT: '#FFA000', light: '#FFE0B2', dark: '#FF8F00' },
          error: { DEFAULT: '#E53935', light: '#FFCDD2', dark: '#D32F2F' },
          info: { DEFAULT: '#2196F3', light: '#BBDEFB', dark: '#1976D2' },
        },

        // Friendly accent colors (legacy)
        mint: { DEFAULT: "#6EE7B7", light: "#A7F3D0", dark: "#059669" },
        sunshine: { DEFAULT: "#FCD34D", light: "#FEF3C7", dark: "#D97706" },
        sky: { DEFAULT: "#7DD3FC", light: "#E0F2FE", dark: "#0284C7" },
        coral: { DEFAULT: "#FF7B5C", light: "#FED7D7", dark: "#E53E3E" },
        salmon: { DEFAULT: "#FF636F" },
        lavender: { DEFAULT: "#FAF5FF", 50: "#FEFCFF", 100: "#FAF5FF", 200: "#F3E8FF" },
        surface: { background: "#F8FAFC", card: "#FFFFFF", elevated: "#FFFFFF" },
        "ai-gradient-start": "#7C3AED",
        "ai-gradient-end": "#A78BFA"
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem",
        "3xl": "2rem",
        pill: "999px",
        // K-5 (playful, rounded)
        'k5-sm': '0.75rem',
        'k5-md': '1.25rem',
        'k5-lg': '1.75rem',
        // Middle School (balanced)
        'ms-sm': '0.5rem',
        'ms-md': '0.75rem',
        'ms-lg': '1rem',
        // High School (subtle, professional)
        'hs-sm': '0.375rem',
        'hs-md': '0.5rem',
        'hs-lg': '0.75rem',
      },
      boxShadow: {
        "soft-primary": "0 18px 40px rgba(124, 58, 237, 0.15)",
        "soft-mint": "0 10px 30px rgba(110, 231, 183, 0.2)",
        "soft-sunshine": "0 10px 30px rgba(252, 211, 77, 0.2)",
        "soft-coral": "0 18px 40px rgba(255, 123, 92, 0.25)",
        "card": "0 4px 20px rgba(0, 0, 0, 0.05)",
        "card-hover": "0 8px 30px rgba(0, 0, 0, 0.08)",
        // K-5 shadows (warm)
        'k5-card': '0 4px 20px rgba(255, 138, 128, 0.15)',
        'k5-elevated': '0 8px 30px rgba(255, 138, 128, 0.2)',
        'k5-focus': '0 0 0 3px rgba(255, 138, 128, 0.4)',
        // Middle School shadows (teal)
        'ms-card': '0 4px 20px rgba(38, 166, 154, 0.12)',
        'ms-elevated': '0 8px 30px rgba(38, 166, 154, 0.18)',
        'ms-focus': '0 0 0 3px rgba(38, 166, 154, 0.4)',
        // High School shadows (neutral)
        'hs-card': '0 2px 12px rgba(0, 0, 0, 0.08)',
        'hs-elevated': '0 4px 20px rgba(0, 0, 0, 0.12)',
        'hs-focus': '0 0 0 3px rgba(63, 81, 181, 0.4)',
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
        "gradient-lavender": "linear-gradient(180deg, #FAF5FF 0%, #F3E8FF 100%)",
        "gradient-friendly": "linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 50%, #F8FAFC 100%)",
        'gradient-k5': 'linear-gradient(135deg, #FF8A80 0%, #FFAB91 100%)',
        'gradient-k5-bg': 'linear-gradient(180deg, #FFF8E7 0%, #FFEEE6 50%, #FFFCF5 100%)',
        'gradient-ms': 'linear-gradient(135deg, #26A69A 0%, #4DB6AC 100%)',
        'gradient-ms-bg': 'linear-gradient(180deg, #F5F5F5 0%, #FAFAFA 50%, #F3E5F5 100%)',
        'gradient-hs': 'linear-gradient(135deg, #3F51B5 0%, #5C6BC0 100%)',
        'gradient-hs-bg': 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        'k5': ['Nunito', 'Comic Neue', 'system-ui', 'sans-serif'],
        'dyslexic': ['OpenDyslexic', 'Comic Sans MS', 'sans-serif'],
      },

      // ========================================
      // Grade-Specific Typography Scale
      // ========================================
      fontSize: {
        // K-5: Larger, more readable for young learners
        'k5-xs': ['0.875rem', { lineHeight: '1.5' }],
        'k5-sm': ['1rem', { lineHeight: '1.6' }],
        'k5-base': ['1.125rem', { lineHeight: '1.7' }],
        'k5-lg': ['1.375rem', { lineHeight: '1.6' }],
        'k5-xl': ['1.625rem', { lineHeight: '1.5' }],
        'k5-2xl': ['2rem', { lineHeight: '1.4' }],
        'k5-3xl': ['2.5rem', { lineHeight: '1.3' }],
        // 6-8: Standard with slight enhancement
        'ms-xs': ['0.75rem', { lineHeight: '1.5' }],
        'ms-sm': ['0.875rem', { lineHeight: '1.5' }],
        'ms-base': ['1rem', { lineHeight: '1.6' }],
        'ms-lg': ['1.25rem', { lineHeight: '1.5' }],
        'ms-xl': ['1.5rem', { lineHeight: '1.4' }],
        'ms-2xl': ['1.875rem', { lineHeight: '1.3' }],
        'ms-3xl': ['2.25rem', { lineHeight: '1.2' }],
        // 9-12: Professional, standard sizing
        'hs-xs': ['0.75rem', { lineHeight: '1.4' }],
        'hs-sm': ['0.875rem', { lineHeight: '1.4' }],
        'hs-base': ['1rem', { lineHeight: '1.5' }],
        'hs-lg': ['1.125rem', { lineHeight: '1.5' }],
        'hs-xl': ['1.375rem', { lineHeight: '1.4' }],
        'hs-2xl': ['1.75rem', { lineHeight: '1.3' }],
        'hs-3xl': ['2rem', { lineHeight: '1.2' }],
      },

      // ========================================
      // Accessibility Utilities
      // ========================================
      
      // Larger tap targets for motor accessibility (WCAG 2.5.5)
      minHeight: {
        'touch': '44px',
        'touch-large': '48px',
        'touch-xl': '56px',
      },
      minWidth: {
        'touch': '44px',
        'touch-large': '48px',
        'touch-xl': '56px',
      },

      // Focus ring variations
      ringWidth: {
        '3': '3px',
        '4': '4px',
      },
      ringOffsetWidth: {
        '3': '3px',
        '4': '4px',
      },

      // Letter spacing for dyslexia support
      letterSpacing: {
        'dyslexic': '0.05em',
        'dyslexic-wide': '0.12em',
        'dyslexic-wider': '0.16em',
      },

      // Line height for readability
      lineHeight: {
        'relaxed-plus': '1.8',
        'loose-plus': '2.2',
        'dyslexic': '1.8',
      },

      // Word spacing for readability
      wordSpacing: {
        'wide': '0.1em',
        'wider': '0.2em',
        'dyslexic': '0.16em',
      },

      // Animation durations with reduced motion support
      transitionDuration: {
        '0': '0ms',
        '50': '50ms',
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },

      // Spacing for educational contexts
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        'touch': '44px',
        'touch-lg': '48px',
      },
    }
  },
  plugins: []
};
