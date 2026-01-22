import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from './Header';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserRole } from '../types';

// Mock user data
const adminUser = {
  id: 1,
  email: 'admin@example.com',
  full_name: 'Admin User',
  role: UserRole.ADMIN,
  is_active: true,
  is_superuser: true
};

const attendeeUser = {
  id: 2,
  email: 'user@example.com',
  full_name: 'Normal User',
  role: UserRole.ATTENDEE,
  is_active: true,
  is_superuser: false
};

const renderWithAuth = (user: any, logout = vi.fn()) => {
  return render(
    <AuthContext.Provider value={{ 
      user, 
      logout, 
      isAuthenticated: !!user, 
      login: vi.fn(), 
      isLoading: false
    }}>
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('Header', () => {
  it('renders logo', () => {
    renderWithAuth(attendeeUser);
    expect(screen.getByAltText('Mis Eventos')).toBeInTheDocument();
  });

  it('renders admin links for admin user', () => {
    renderWithAuth(adminUser);
    expect(screen.getByText('Eventos')).toBeInTheDocument();
    expect(screen.getByText('Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Sesiones')).toBeInTheDocument();
  });

  it('does not render admin links for attendee user', () => {
    renderWithAuth(attendeeUser);
    expect(screen.queryByText('Eventos')).not.toBeInTheDocument();
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
    // Attendee sees 'Mis Inscripciones'
    expect(screen.getByText('Mis Inscripciones')).toBeInTheDocument();
  });

  it('calls logout when button clicked', () => {
    const logout = vi.fn();
    renderWithAuth(attendeeUser, logout);
    
    const logoutBtn = screen.getByText('Cerrar Sesión');
    fireEvent.click(logoutBtn);
    
    expect(logout).toHaveBeenCalled();
  });

  it('toggles mobile menu', () => {
    renderWithAuth(attendeeUser);
    
    const buttons = screen.getAllByRole('button');
    const menuBtn = buttons.find(btn => btn.querySelector('svg'));
    if (!menuBtn) throw new Error('Menu button not found');
    
    // Initial state: menu closed. Only desktop link exists.
    const linksInitial = screen.getAllByText('Mis Inscripciones');
    expect(linksInitial.length).toBe(1);
    
    // Click to open
    fireEvent.click(menuBtn);
    
    // Menu open: desktop + mobile links exist.
    const linksOpen = screen.getAllByText('Mis Inscripciones');
    expect(linksOpen.length).toBe(2);
    
    // Click to close
    fireEvent.click(menuBtn);
    
    // Menu closed: only desktop link exists.
    const linksClosed = screen.getAllByText('Mis Inscripciones');
    expect(linksClosed.length).toBe(1);
  });

  it('closes mobile menu when link is clicked', () => {
    renderWithAuth(adminUser);
    
    // Find mobile menu button
    const buttons = screen.getAllByRole('button');
    const menuBtn = buttons.find(btn => btn.querySelector('svg'));
    if (!menuBtn) throw new Error('Menu button not found');
    
    // Open menu
    fireEvent.click(menuBtn);
    
    // Find mobile link 'Eventos'. There are two 'Eventos' links now (desktop and mobile)
    const links = screen.getAllByText('Eventos');
    const mobileLink = links[1]; // Assuming second one is mobile as it appears later in DOM
    
    fireEvent.click(mobileLink);
    
    // Check if menu closed (we can check if only 1 'Eventos' link remains visible or exists)
    // Note: If menu is hidden via CSS (md:hidden), testing-library might still see it in DOM unless conditionally rendered.
    // In Header.tsx: {isMenuOpen && ( <div className="md:hidden ..."> ... )}
    // So it is conditionally rendered.
    
    const linksAfter = screen.getAllByText('Eventos');
    expect(linksAfter.length).toBe(1);
  });

  it('closes mobile menu when other links are clicked', () => {
    renderWithAuth(adminUser);
    
    // Helper to open menu and click link
    const clickMobileLink = (linkText: string) => {
      // Find mobile menu button and click it
      const buttons = screen.getAllByRole('button');
      const menuBtn = buttons.find(btn => btn.querySelector('svg'));
      if (!menuBtn) throw new Error('Menu button not found');
      fireEvent.click(menuBtn);

      // Find mobile link (assuming it's the second one if desktop one exists)
      const links = screen.getAllByText(linkText);
      // If only mobile link exists (e.g. if desktop hidden? no, desktop always there for admin)
      // Actually 'Mis Inscripciones' is always there. 'Usuarios'/'Sesiones' too for admin.
      const mobileLink = links.length > 1 ? links[1] : links[0];
      fireEvent.click(mobileLink);

      // Verify menu closed (only 1 link remains)
      expect(screen.getAllByText(linkText).length).toBe(1);
    };

    clickMobileLink('Usuarios');
    clickMobileLink('Sesiones');
    clickMobileLink('Mis Inscripciones');
  });

  it('calls logout from mobile menu', () => {
    const logout = vi.fn();
    renderWithAuth(attendeeUser, logout);
    
    const buttons = screen.getAllByRole('button');
    const menuBtn = buttons.find(btn => btn.querySelector('svg'));
    if (!menuBtn) throw new Error('Menu button not found');
    
    fireEvent.click(menuBtn);
    
    const logoutBtns = screen.getAllByText('Cerrar Sesión');
    const mobileLogout = logoutBtns[1];
    
    fireEvent.click(mobileLogout);
    
    expect(logout).toHaveBeenCalled();
    const logoutBtnsAfter = screen.getAllByText('Cerrar Sesión');
    expect(logoutBtnsAfter.length).toBe(1);
  });
});
