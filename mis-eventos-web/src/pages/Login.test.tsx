import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Login } from './Login';
import { MemoryRouter } from 'react-router-dom';
import * as AuthContextModule from '../context/AuthContext';
import { api } from '../lib/axios';

// Mock imports
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../lib/axios', () => ({
  api: {
    post: vi.fn(),
  }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Page', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (AuthContextModule.useAuth as any).mockReturnValue({ 
      login: mockLogin 
    });
  });

  const renderLogin = () => {
    return render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
  };

  it('renders login form', () => {
    renderLogin();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderLogin();
    
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));
    
    expect(await screen.findByText('Todos los campos son requeridos')).toBeInTheDocument();
    
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));
    expect(await screen.findByText('La contraseña es requerida')).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    renderLogin();
    
    (api.post as any).mockResolvedValue({ data: { access_token: 'fake-token' } });
    
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', expect.any(URLSearchParams), expect.any(Object));
      expect(mockLogin).toHaveBeenCalledWith('fake-token');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('handles login error', async () => {
    renderLogin();
    
    const errorResponse = { 
      response: { 
        data: { detail: 'Credenciales inválidas' } 
      } 
    };
    (api.post as any).mockRejectedValue(errorResponse);
    
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'wrongpass' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));
    
    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument();
  });
});
