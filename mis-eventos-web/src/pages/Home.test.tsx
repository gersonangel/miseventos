import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Home } from './Home';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { MemoryRouter } from 'react-router-dom';

// Mock useAuth
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock DashboardCard
vi.mock('../components/DashboardCard', () => ({
  DashboardCard: ({ title, to }: { title: string; to: string }) => (
    <div data-testid="dashboard-card">
      <h3>{title}</h3>
      <a href={to}>Link</a>
    </div>
  ),
}));

describe('Home Page', () => {
  const renderHome = () => {
    return render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Home />
      </MemoryRouter>
    );
  };

  it('renders welcome message for authenticated user', () => {
    (useAuth as any).mockReturnValue({
      user: { full_name: 'Test User', role: UserRole.ATTENDEE },
    });

    renderHome();
    expect(screen.getByText('Bienvenido, Test User')).toBeInTheDocument();
  });

  it('renders admin dashboard cards', () => {
    (useAuth as any).mockReturnValue({
      user: { full_name: 'Admin User', role: UserRole.ADMIN },
    });

    renderHome();
    expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Gestión de Eventos')).toBeInTheDocument();
    expect(screen.getByText('Gestión de Sesiones')).toBeInTheDocument();
    expect(screen.getByText('Mis Inscripciones')).toBeInTheDocument();
  });

  it('renders organizer dashboard cards', () => {
    (useAuth as any).mockReturnValue({
      user: { full_name: 'Organizer User', role: UserRole.ORGANIZER },
    });

    renderHome();
    expect(screen.queryByText('Gestión de Usuarios')).not.toBeInTheDocument();
    expect(screen.getByText('Gestión de Eventos')).toBeInTheDocument();
    expect(screen.getByText('Gestión de Sesiones')).toBeInTheDocument();
    expect(screen.getByText('Mis Inscripciones')).toBeInTheDocument();
  });

  it('renders speaker dashboard cards', () => {
    (useAuth as any).mockReturnValue({
      user: { full_name: 'Speaker User', role: UserRole.SPEAKER },
    });

    renderHome();
    expect(screen.queryByText('Gestión de Usuarios')).not.toBeInTheDocument();
    expect(screen.queryByText('Gestión de Eventos')).not.toBeInTheDocument();
    expect(screen.getByText('Gestión de Sesiones')).toBeInTheDocument();
    expect(screen.getByText('Mis Inscripciones')).toBeInTheDocument();
  });

  it('renders attendee dashboard cards', () => {
    (useAuth as any).mockReturnValue({
      user: { full_name: 'Attendee User', role: UserRole.ATTENDEE },
    });

    renderHome();
    expect(screen.queryByText('Gestión de Usuarios')).not.toBeInTheDocument();
    expect(screen.queryByText('Gestión de Eventos')).not.toBeInTheDocument();
    expect(screen.queryByText('Gestión de Sesiones')).not.toBeInTheDocument();
    expect(screen.getByText('Mis Inscripciones')).toBeInTheDocument();
  });
});
