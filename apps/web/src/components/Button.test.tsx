import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button, buttonClassName, secondaryButtonClassName } from './Button.js';

describe('Button', () => {
  it('renders the primary variant using the accent token by default', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' }).className).toContain('bg-accent-500');
  });

  it('renders the secondary variant using a neutral outline, not the accent color', () => {
    render(<Button variant="secondary">Cancel</Button>);
    const button = screen.getByRole('button', { name: 'Cancel' });
    expect(button.className).not.toContain('bg-accent');
    expect(button.className).toContain('border-surface-border');
  });

  it('shows "Please wait..." and disables the button while isLoading', () => {
    render(<Button isLoading>Save</Button>);
    const button = screen.getByRole('button', { name: 'Please wait...' });
    expect(button).toBeDisabled();
  });
});

describe('secondaryButtonClassName', () => {
  // UI-4 regression guard: the secondary button is reused inside cards
  // (surface-raised) AND inside modals (surface-elevated, see
  // ConfirmDialog) as well as directly on the page background. A hover
  // treatment that jumps to one specific surface tier would go invisible
  // in whichever context already uses that exact color - so hover must
  // stay a relative overlay tint, not an absolute surface-* background.
  it('uses a relative overlay tint for hover, not a fixed surface tier', () => {
    expect(secondaryButtonClassName).toContain('hover:bg-white/5');
    expect(secondaryButtonClassName).not.toMatch(/hover:bg-surface/);
  });
});

describe('buttonClassName', () => {
  it('uses the accent token rather than the legacy brand-* classes', () => {
    expect(buttonClassName).toContain('bg-accent-500');
    expect(buttonClassName).not.toMatch(/brand-/);
  });
});
