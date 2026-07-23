/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // A dedicated "brand" palette rather than styling directly with
        // Tailwind's default blues/grays everywhere - this is what lets the
        // whole app's look change later by editing one place instead of
        // hunting through every component.
        brand: {
          50: '#eef4ff',
          100: '#dae6ff',
          200: '#bccdff',
          300: '#8ea7ff',
          400: '#5b76ff',
          500: '#3a4dfa',
          600: '#2830e0',
          700: '#2224b5',
          800: '#1e208f',
          900: '#1c2071',
        },
        surface: {
          DEFAULT: '#0b0e14',
          raised: '#11151d',
          border: '#1f2530',
        },
        profit: '#16c784',
        loss: '#ea3943',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
