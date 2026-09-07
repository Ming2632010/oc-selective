/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2D5A4A',
          light: '#4A7A64',
          dark: '#1E3F33',
        },
        terracotta: {
          DEFAULT: '#C49B7A',
          hover: '#B0886A',
        },
        warm: {
          page: '#F7F5F0',
          card: '#FFFFFF',
          ink: '#3D352E',
          muted: '#6B5F55',
          subtle: '#9A8E82',
          border: '#EBE5D9',
          divider: '#F0EBE3',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Georgia', '"Times New Roman"', 'serif'],
      },
      boxShadow: {
        card: '0 8px 24px -18px rgba(61, 53, 46, 0.35)',
        float: '0 16px 38px -24px rgba(45, 90, 74, 0.38)',
      },
    },
  },
  plugins: [],
};

export default config;
