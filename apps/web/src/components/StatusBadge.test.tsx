import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './StatusBadge.js';

describe('StatusBadge', () => {
  it('renders the connected label', () => {
    render(<StatusBadge status="connected" />);
    expect(screen.getByText('API Connected')).toBeInTheDocument();
  });

  it('renders the disconnected label', () => {
    render(<StatusBadge status="disconnected" />);
    expect(screen.getByText('API Unreachable')).toBeInTheDocument();
  });

  it('renders the checking label', () => {
    render(<StatusBadge status="checking" />);
    expect(screen.getByText('Checking...')).toBeInTheDocument();
  });
});
