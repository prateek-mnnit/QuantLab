import { describe, expect, it } from 'vitest';
// @ts-expect-error - tailwind.config.js has no type declarations, and the
// project intentionally doesn't add any just for this one test import.
import tailwindConfig from '../tailwind.config.js';

/**
 * QuantLab's accent was originally a muted steel/cobalt BLUE, then
 * deliberately revised to a restrained GREEN so blue would stop being the
 * app's primary interactive color (see tailwind.config.js). This test
 * exists purely to catch an accidental revert back to a blue-hued accent
 * scale in the future - it doesn't assert an exact hex (that's an
 * implementation detail), just that the accent's hue is green, not blue.
 */
function hexToHue(hex: string): number {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;
  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue *= 60;
  return hue < 0 ? hue + 360 : hue;
}

describe('design tokens', () => {
  it('uses a green, not blue, accent color', () => {
    const accent500: string = tailwindConfig.theme.extend.colors.accent[500];
    const hue = hexToHue(accent500);
    // Green sits roughly 90-160deg on the hue wheel; blue/indigo sits
    // roughly 190-260deg. Asserting a range (not one exact hex) keeps this
    // test from breaking on every minor shade tweak while still failing
    // loudly if the accent drifts back toward blue.
    expect(hue).toBeGreaterThanOrEqual(90);
    expect(hue).toBeLessThanOrEqual(170);
  });

  it('keeps `brand` as an alias of `accent`, not a separate color', () => {
    expect(tailwindConfig.theme.extend.colors.brand).toEqual(tailwindConfig.theme.extend.colors.accent);
  });

  it('keeps profit green and loss red distinct from the accent color', () => {
    const colors = tailwindConfig.theme.extend.colors;
    expect(colors.profit).not.toBe(colors.accent[500]);
    expect(hexToHue(colors.loss)).toBeGreaterThanOrEqual(340);
  });
});
