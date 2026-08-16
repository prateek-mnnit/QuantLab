/** @type {import('tailwindcss').Config} */

/**
 * QuantLab design system — zinc foundation, restrained green accent.
 *
 * Philosophy:
 * - The page is near-black zinc-950. Surfaces are distinctly lighter so
 *   cards/panels read as elevated without needing drop-shadows.
 * - Green is used ONLY where it carries semantic weight: active nav,
 *   primary action buttons, profit values, positive market movement.
 *   It should never become decoration.
 * - Red is used ONLY for loss, errors, and destructive actions.
 * - Every shade is monochromatic zinc; no blue, purple, or orange in the
 *   interactive palette.
 */

// QuantLab's single accent/brand color — a purposeful emerald green.
// Kept restrained: used for primary CTAs, active nav indicator, profit
// values. NOT used for borders, backgrounds, secondary UI chrome.
const accent = {
  50:  '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e',  // primary interactive green
  600: '#16a34a',  // hover
  700: '#15803d',  // pressed
  800: '#166534',
  900: '#14532d',
};

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Page & surface hierarchy ──────────────────────────────────────
        // Three clearly distinct elevation levels. Difference between each
        // tier is ~7-8 lightness points — enough to read as "different
        // surface" on any calibrated display without feeling garish.
        background: '#09090b',   // zinc-950  — page background

        surface: {
          DEFAULT: '#09090b',    // alias for bg-surface = page background
          raised:  '#111113',    // cards, panels, table containers
          elevated:'#1a1a1d',    // modals, dropdowns, tooltips (floats above cards)
          hover:   '#1f1f23',    // row hover, interactive card hover
          border:  '#27272a',    // zinc-800  — default border
          divider: '#1e1e22',    // subtle internal dividers (lighter than bg)
        },

        // ── Brand / accent ────────────────────────────────────────────────
        accent,
        brand: accent,           // alias — existing `bg-brand-*` classes continue to work

        // ── Financial semantics ───────────────────────────────────────────
        // Brighter, more saturated than the old values — needs to read
        // clearly against zinc-950 in compact table cells.
        profit:  '#22c55e',      // green-500  — positive returns, gains, up moves
        loss:    '#ef4444',      // red-500    — negative returns, losses, down moves
        warning: '#eab308',      // yellow-500 — pending, caution, incomplete states

        // ── Interactive border ─────────────────────────────────────────────
        // Used for focus rings, hover borders — one step lighter than
        // surface.border to create visible interactive feedback.
        'border-interactive': '#3f3f46',   // zinc-700
      },

      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        // Trading-terminal scale: data-dense but legible
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],    // 11px — chart axis
        'xs':  ['0.75rem',   { lineHeight: '1rem' }],    // 12px — metadata, badges
        'sm':  ['0.8125rem', { lineHeight: '1.25rem' }], // 13px — table cells, labels
        'base':['0.875rem',  { lineHeight: '1.375rem' }],// 14px — body default
        'md':  ['0.9375rem', { lineHeight: '1.5rem' }],  // 15px — slightly above body
        'lg':  ['1rem',      { lineHeight: '1.5rem' }],  // 16px — section titles
        'xl':  ['1.125rem',  { lineHeight: '1.75rem' }], // 18px — page subtitles
        '2xl': ['1.25rem',   { lineHeight: '1.75rem' }], // 20px — page titles
        '3xl': ['1.5rem',    { lineHeight: '2rem' }],    // 24px — hero titles
        '4xl': ['1.875rem',  { lineHeight: '2.25rem' }], // 30px — display numbers
        '5xl': ['2.25rem',   { lineHeight: '2.5rem' }],  // 36px — hero metrics
      },

      borderRadius: {
        // Tighter, more professional than the previous rounded-xl defaults.
        // rounded-xl (12px) felt bubbly — rounded-lg (8px) is the new max.
        'sm':  '4px',
        DEFAULT: '6px',
        'md':  '6px',
        'lg':  '8px',
        'xl':  '8px',   // Intentionally same as lg — prevents accidental bubbly cards
        'full': '9999px',
      },

      boxShadow: {
        // Crisp, very subtle — used on modals/dropdowns for z-depth feel
        'surface': '0 0 0 1px rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.4)',
        'dropdown':'0 0 0 1px #27272a, 0 8px 24px rgba(0,0,0,0.5)',
        'none': 'none',
      },

      // Compact spacing for data-dense UI
      spacing: {
        '0.5': '2px',
        '1':   '4px',
        '1.5': '6px',
        '2':   '8px',
        '2.5': '10px',
        '3':   '12px',
        '3.5': '14px',
        '4':   '16px',
        '5':   '20px',
        '6':   '24px',
        '7':   '28px',
        '8':   '32px',
        '9':   '36px',
        '10':  '40px',
        '11':  '44px',
        '12':  '48px',
        '14':  '56px',
        '16':  '64px',
        '20':  '80px',
        '24':  '96px',
        '28':  '112px',
        '32':  '128px',
        '36':  '144px',
        '40':  '160px',
        '44':  '176px',
        '48':  '192px',
        '52':  '208px',
        '56':  '224px',
        '60':  '240px',
        '64':  '256px',
        '72':  '288px',
        '80':  '320px',
        '96':  '384px',
      },

      transitionDuration: {
        DEFAULT: '150ms',
        '75':    '75ms',
        '100':   '100ms',
        '150':   '150ms',
        '200':   '200ms',
        '300':   '300ms',
      },

      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
