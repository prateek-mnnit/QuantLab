import { describe, expect, it } from 'vitest';
// @ts-expect-error - tailwind.config.js has no type declarations, and the
// project intentionally doesn't add any just for this one test import.
import tailwindConfig from '../tailwind.config.js';

/**
 * QuantLab's accent color must remain green (not blue/purple) so that
 * interactive primary actions, active nav, and profit semantics all stay
 * visually consistent. These tests guard against accidental color regressions.
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
    // roughly 190-260deg. Asserting a range keeps this test from breaking
    // on minor shade tweaks while still failing loudly on a drift to blue.
    expect(hue).toBeGreaterThanOrEqual(90);
    expect(hue).toBeLessThanOrEqual(170);
  });

  it('keeps `brand` as an alias of `accent`, not a separate color', () => {
    expect(tailwindConfig.theme.extend.colors.brand).toEqual(
      tailwindConfig.theme.extend.colors.accent,
    );
  });

  it('profit is green-hued and loss is red-hued', () => {
    const colors = tailwindConfig.theme.extend.colors;
    // In the redesign, profit and the primary accent share the same green
    // (both #22c55e) — intentional, since "positive performance" and
    // "primary action" carry the same semantic weight. The important
    // constraint is that profit is GREEN and loss is RED.
    const profitHue = hexToHue(colors.profit);
    expect(profitHue).toBeGreaterThanOrEqual(90);
    expect(profitHue).toBeLessThanOrEqual(170);
    // loss must be in the red hue range (≥340° or ≤10° — red wraps at 360°)
    const lossHue = hexToHue(colors.loss);
    const isRedHue = lossHue >= 340 || lossHue <= 10;
    expect(isRedHue).toBe(true);
  });

  it('surface hierarchy has three distinct levels', () => {
    const { surface } = tailwindConfig.theme.extend.colors;
    // All three surface tiers must exist and be distinct hex values
    expect(surface.DEFAULT).toBeDefined();
    expect(surface.raised).toBeDefined();
    expect(surface.elevated).toBeDefined();
    expect(surface.raised).not.toEqual(surface.DEFAULT);
    expect(surface.elevated).not.toEqual(surface.raised);
  });

  it('has a near-black page background', () => {
    const bg = tailwindConfig.theme.extend.colors.background;
    // Background must be very dark — luminance check via the R channel
    const r = parseInt(bg.replace('#', '').slice(0, 2), 16);
    expect(r).toBeLessThan(20); // effectively black
  });
});
