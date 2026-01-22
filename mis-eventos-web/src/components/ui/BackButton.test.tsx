import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BackButton } from './BackButton';
import { BrowserRouter } from 'react-router-dom';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('BackButton', () => {
  it('renders as a link when "to" prop is provided', () => {
    render(
      <BrowserRouter>
        <BackButton to="/home" />
      </BrowserRouter>
    );
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/home');
  });

  it('renders as a button when "to" prop is missing', () => {
    render(
      <BrowserRouter>
        <BackButton />
      </BrowserRouter>
    );
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls navigate(-1) when clicked as button', () => {
    render(
      <BrowserRouter>
        <BackButton />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('accepts custom className', () => {
    render(
      <BrowserRouter>
        <BackButton className="custom-class" />
      </BrowserRouter>
    );
    
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });
});
