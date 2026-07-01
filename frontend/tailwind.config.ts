import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#16201B',
        paper: '#F6F5F1',
        surface: '#FFFFFF',
        line: '#E3E0D4',
        primary: {
          DEFAULT: '#0B6E4F',
          dark: '#074B36',
          light: '#E4F2EB',
        },
        marigold: {
          DEFAULT: '#E8A33D',
          dark: '#B9791C',
          light: '#FBEBD2',
        },
        danger: {
          DEFAULT: '#C0432F',
          light: '#F8E4DF',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-plex)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(22, 32, 27, 0.04), 0 8px 24px -12px rgba(22, 32, 27, 0.08)',
      },
      borderRadius: {
        md: '10px',
        lg: '14px',
      },
    },
  },
  plugins: [],
};

export default config;
