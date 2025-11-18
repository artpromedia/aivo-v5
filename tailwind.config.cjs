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
        coral: {
          DEFAULT: "#FF7B5C"
        },
        salmon: {
          DEFAULT: "#FF636F"
        },
        "ai-gradient-start": "#FF7B5C",
        "ai-gradient-end": "#8B5CF6"
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem",
        pill: "999px"
      },
      boxShadow: {
        "soft-coral": "0 18px 40px rgba(255, 123, 92, 0.25)"
      }
    }
  },
  plugins: []
};
