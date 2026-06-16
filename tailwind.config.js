/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        brand: {
          50:  '#e8f0fe',
          100: '#c5d8fc',
          200: '#93b8fa',
          300: '#5a90f6',
          400: '#2d6ef2',
          500: '#1a56db',
          600: '#1443b8',
          700: '#0e3194',
          800: '#092070',
          900: '#051249',
          950: '#020a2e'
        },
        dark: {
          900: '#020c1b',
          800: '#0a1628',
          700: '#0d1f3c',
          600: '#112850',
          500: '#163264',
          400: '#1e4080'
        }
      }
    }
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        edtek: {
          'primary':         '#1a56db',
          'primary-content': '#ffffff',
          'secondary':       '#0e3194',
          'secondary-content': '#ffffff',
          'accent':          '#4a9eff',
          'neutral':         '#0a1628',
          'base-100':        '#f1f5f9',
          'base-200':        '#e2e8f0',
          'base-300':        '#cbd5e1',
          'base-content':    '#0f172a',
          'info':            '#3b82f6',
          'success':         '#16a34a',
          'warning':         '#d97706',
          'error':           '#dc2626'
        }
      }
    ]
  }
}
