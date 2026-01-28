/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#1a1d2e',
          darker: '#13161f',
          accent: '#6366f1',
          accentLight: '#8b5cf6',
        },
        success: {
          light: '#86efac',
          DEFAULT: '#22c55e',
        },
        warning: {
          light: '#fef3c7',
          DEFAULT: '#fbbf24',
        },
        neutral: {
          background: '#fafafa',
          border: '#e5e7eb',
          white: '#ffffff',
          text: '#111827',
          textSecondary: '#6b7280',
          textTertiary: '#9ca3af',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          "'Segoe UI'",
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        cardHover:
          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        dropdown:
          '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};

