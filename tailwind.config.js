/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#54D75A',
        'primary-light': 'rgba(84, 215, 90, 0.1)',
        'primary-border': 'rgba(84, 215, 90, 0.5)',
        secondary: '#009BA3',
        'secondary-light': 'rgba(0, 155, 163, 0.1)',
        accent: '#005377',
        'accent-light': 'rgba(0, 83, 119, 0.1)',
        'text-primary': '#1e293b', // slate-800
        'text-secondary': '#64748b', // slate-500
        'bg-light': '#f8fafc', // slate-50
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'Consolas', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'base': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '500' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        '5xl': ['3rem', { lineHeight: '1', fontWeight: '700' }],
        '6xl': ['3.75rem', { lineHeight: '1', fontWeight: '700' }],
      },
      spacing: {
        '0': '0',
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
      },
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',
        'base': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        'full': '9999px',
      },
      boxShadow: {
        'soft': 'rgba(0, 0, 0, 0.1) 0 10px 15px -3px, rgba(0, 0, 0, 0.05) 0 4px 6px -2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
