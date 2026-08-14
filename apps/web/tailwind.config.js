/** @type {import('tailwindcss').Config} */

// QuantLab's restrained accent - a muted green, in the same hue family as
// `profit` below (a stock-platform's "positive/go" color) but less
// saturated and tuned for larger-area use - button fills, active-nav
// indicators - rather than small ticker text. This is a deliberate revision
// away from an earlier blue accent: the brief was explicit that blue should
// not be QuantLab's primary interactive color, and that green should stay
// meaningful (primary actions, active nav, success/positive states) rather
// than blue being swapped for green everywhere - see how sparingly `accent`
// actually gets used below.
const accent = {
  50: '#E7F8F2',
  100: '#C8EFE0',
  200: '#98E1C5',
  300: '#69D3AB',
  400: '#35B684',
  500: '#26825F',
  600: '#1E674B',
  700: '#18533C',
  800: '#123F2E',
  900: '#0D2B20',
};

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // The app's true charcoal-black page background - distinct from
        // `surface` below, which is one tier lighter (cards/panels).
        background: '#0E0E0E',

        surface: {
          // Same value as `background` - kept as its own key because the
          // whole app already styles the page wrapper with `bg-surface`
          // (see src/styles/index.css); this alias means every existing
          // `bg-surface` reference stays correct in *meaning* while only
          // its color value moves from the old blue-tinted near-black to
          // a true neutral charcoal.
          DEFAULT: '#0E0E0E',
          // Cards, panels, table rows, inputs - one visible step lighter
          // than the page background.
          raised: '#141313',
          // Modals, dropdown menus, popovers - one step lighter again, for
          // content that floats above the normal card layer.
          elevated: '#1D1C1B',
          border: '#31302F',
        },

        // QuantLab's single restrained accent/brand color (see `accent`
        // above). `brand` is kept as an alias of the exact same scale so
        // every existing `bg-brand-500` / `text-brand-400` / etc. class
        // already used throughout the app picks up the current accent
        // color automatically - new code should prefer `accent`.
        accent,
        brand: accent,

        profit: '#16c784',
        loss: '#ea3943',
        // Caution/pending states (e.g. a backtest still running, a data
        // feed delay) - not yet wired into any component, established here
        // for later UI groups to adopt rather than each inventing its own.
        warning: '#E09D29',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
