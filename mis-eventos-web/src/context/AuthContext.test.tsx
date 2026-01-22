import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { api } from '../lib/axios';

// Mock api
vi.mock('../lib/axios', () => ({
  api: {
    get: vi.fn(),
  }
}));

// Test component to consume context
const TestComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user-name">{user?.full_name}</div>
      <button onClick={() => login('fake-token')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('provides initial state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
  });

  it('restores session if token exists in localStorage', async () => {
    localStorage.setItem('token', 'valid-token');
    (api.get as any).mockResolvedValue({ data: { id: 1, full_name: 'Test User' } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    expect(api.get).toHaveBeenCalledWith('/auth/me');
  });

  it('logs out if token is invalid', async () => {
    localStorage.setItem('token', 'invalid-token');
    (api.get as any).mockRejectedValue(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('login function sets token and fetches user', async () => {
    (api.get as any).mockResolvedValue({ data: { id: 1, full_name: 'New User' } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = screen.getByText('Login');
    fireEvent.click(loginBtn);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    expect(screen.getByTestId('user-name')).toHaveTextContent('New User');
    expect(localStorage.getItem('token')).toBe('fake-token');
  });

  it('logout function clears session', async () => {
    localStorage.setItem('token', 'valid-token');
    (api.get as any).mockResolvedValue({ data: { id: 1, full_name: 'Test User' } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial login
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });

    const logoutBtn = screen.getByText('Logout');
    fireEvent.click(logoutBtn);

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
