import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders correctly', () => {
    render(<Spinner />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies size classes', () => {
    const { rerender } = render(<Spinner size="lg" />);
    expect(screen.getByTestId('spinner')).toHaveClass('h-12 w-12');

    rerender(<Spinner size="lg" />);
    expect(screen.getByTestId('spinner')).toHaveClass('h-12 w-12');
  });

  it('allows custom className', () => {
    render(<Spinner className="text-red-500" />);
    expect(screen.getByTestId('spinner')).toHaveClass('text-red-500');
  });
});
