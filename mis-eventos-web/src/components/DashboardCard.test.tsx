import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DashboardCard } from './DashboardCard';
import { MemoryRouter } from 'react-router-dom';

describe('DashboardCard', () => {
  const defaultProps = {
    title: 'Events',
    description: 'Manage all events',
    to: '/events',
  };

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{ui}</MemoryRouter>);
  };

  it('renders title and description', () => {
    renderWithRouter(<DashboardCard {...defaultProps} />);
    
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Manage all events')).toBeInTheDocument();
  });

  it('renders as a link with correct path', () => {
    renderWithRouter(<DashboardCard {...defaultProps} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/events');
  });

  it('renders custom icon', () => {
    renderWithRouter(
      <DashboardCard 
        {...defaultProps} 
        icon={<span data-testid="icon">Icon</span>} 
      />
    );
    
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies custom color class', () => {
    renderWithRouter(
      <DashboardCard 
        {...defaultProps} 
        color="bg-blue-50" 
      />
    );
    
    const link = screen.getByRole('link');
    expect(link).toHaveClass('bg-blue-50');
  });
});
