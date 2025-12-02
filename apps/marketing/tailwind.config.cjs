const config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Friendly lavender palette
        lavender: {
          50: '#FAF5FF',
          100: '#F5EBFF',
          200: '#E9D5FF',
          300: '#D4BFFF',
          400: '#C084FC',
          500: '#A855F7',
        },
        // Primary violet
        violet: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#7C3AED',
          600: '#6D28D9',
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#3B0764',
        },
        // Friendly accent colors
        mint: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
        },
        sunshine: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
        },
        sky: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
        },
        // Keep coral for compatibility
        coral: {
          50: '#fff5f3',
          100: '#ffe8e3',
          200: '#ffd4cb',
          300: '#ffb5a5',
          400: '#ff8970',
          500: '#ff7b5c',
          600: '#ff5a3c',
          700: '#f03e24',
          800: '#c93520',
          900: '#a62f20',
        },
        salmon: {
          50: '#fff4f4',
          100: '#ffe7e8',
          200: '#ffd3d5',
          300: '#ffadb2',
          400: '#ff7a82',
          500: '#ff636f',
          600: '#ff3d4d',
          700: '#e62e3f',
          800: '#c02737',
          900: '#a02432',
        },
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'bounce-soft': 'bounceSoft 2s infinite',
        float: 'float 6s ease-in-out infinite',
        gradient: 'gradient 8s ease infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      boxShadow: {
        coral: '0 20px 50px -10px rgba(255, 123, 92, 0.3)',
        salmon: '0 20px 50px -10px rgba(255, 99, 111, 0.3)',
        purple: '0 20px 50px -10px rgba(168, 85, 247, 0.3)',
        soft: '0 10px 40px -10px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}

module.exports = config
