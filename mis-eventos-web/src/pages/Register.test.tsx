import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Register } from './Register';
import { MemoryRouter } from 'react-router-dom';
import { api } from '../lib/axios';

// Mock imports
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

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderRegister = () => {
    return render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
  };

  it('renders register form', () => {
    renderRegister();
    expect(screen.getByLabelText(/Nombre Completo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Registrarse/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderRegister();
    
    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));
    
    expect(await screen.findByText('Todos los campos son requeridos')).toBeInTheDocument();
    
    fireEvent.change(screen.getByLabelText(/Nombre Completo/), { target: { value: 'Test User' } });
    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));
    expect(await screen.findByText('El email es requerido')).toBeInTheDocument();
  });

  it('handles successful registration', async () => {
    renderRegister();
    
    (api.post as any).mockResolvedValue({ data: { message: 'Success' } });
    
    fireEvent.change(screen.getByLabelText(/Nombre Completo/), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('handles registration error', async () => {
    renderRegister();
    
    const errorResponse = { 
      response: { 
        data: { detail: 'El email ya está registrado' } 
      } 
    };
    (api.post as any).mockRejectedValue(errorResponse);
    
    fireEvent.change(screen.getByLabelText(/Nombre Completo/), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));
    
    expect(await screen.findByText('El email ya está registrado')).toBeInTheDocument();
  });
});
