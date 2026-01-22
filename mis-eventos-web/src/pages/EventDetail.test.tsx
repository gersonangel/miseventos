import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventDetail } from './EventDetail';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as AuthContextModule from '../context/AuthContext';
import { UserRole } from '../types';
import { EventStatus, EventType } from '../types/event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { eventService } from '../services/eventService';
import { sessionService } from '../services/sessionService';
import { AxiosError } from 'axios';

// Mock dependencies
vi.mock('../services/eventService', () => ({
  eventService: {
    getEvent: vi.fn(),
    registerForEvent: vi.fn(),
    cancelRegistration: vi.fn(),
    updateEvent: vi.fn(),
  }
}));

vi.mock('../services/sessionService', () => ({
  sessionService: {
    getEventSessions: vi.fn(),
  }
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../components/ui/Select', () => ({
  Select: ({ value, onChange, options }: any) => (
    <select data-testid="status-select" value={value} onChange={e => onChange(e.target.value)}>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  ),
}));

describe('EventDetail Page', () => {
  const mockUseAuth = AuthContextModule.useAuth as any;
  let queryClient: QueryClient;

  const mockEvent = {
    id: '1',
    title: 'Test Event',
    description: 'Description',
    start_date: new Date().toISOString(),
    end_date: new Date().toISOString(),
    location: 'Location',
    status: EventStatus.PUBLISHED,
    type: EventType.CONFERENCE,
    max_capacity: 100,
    available_spots: 50,
    image_desktop: 'test.jpg',
    is_registered: false,
  };

  const mockSessions = [
    {
      id: 's1',
      title: 'Session 1',
      description: 'Desc 1',
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      speakers: [
        { id: 'sp1', full_name: 'Speaker Name', biography: 'Bio' }
      ]
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { role: UserRole.ATTENDEE },
      isAuthenticated: true,
    });
    
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    // Default mocks
    (eventService.getEvent as any).mockResolvedValue(mockEvent);
    (sessionService.getEventSessions as any).mockResolvedValue(mockSessions);
  });

  const renderEventDetail = (path = '/events/1') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/my-events/:id" element={<EventDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders loading state', () => {
    // To test loading state with real QueryClient is tricky because it resolves fast.
    // We can delay the resolution.
    (eventService.getEvent as any).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderEventDetail();
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('renders error state', async () => {
    (eventService.getEvent as any).mockRejectedValue(new Error('Err'));
    
    renderEventDetail();
    await waitFor(() => {
        expect(screen.getByText('Evento no encontrado')).toBeInTheDocument();
    });
  });

  it('renders event details with sessions and speakers', async () => {
    renderEventDetail();
    await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Session 1')).toBeInTheDocument();
        expect(screen.getByText('Speaker Name')).toBeInTheDocument();
    });
  });

  it('shows register button when not registered and on events path', async () => {
    renderEventDetail('/events/1');
    await waitFor(() => {
        expect(screen.getByRole('button', { name: /Inscribirse/i })).toBeInTheDocument();
    });
  });

  it('handles registration flow', async () => {
    (eventService.registerForEvent as any).mockResolvedValue({});

    renderEventDetail('/events/1');
    await waitFor(() => expect(screen.getByRole('button', { name: /Inscribirse/i })).toBeInTheDocument());
    
    const registerBtn = screen.getByRole('button', { name: /Inscribirse/i });
    fireEvent.click(registerBtn);

    await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Confirmar inscripción/i })).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: 'Confirmar Inscripción' });
    fireEvent.click(confirmBtn);
    
    await waitFor(() => {
        expect(eventService.registerForEvent).toHaveBeenCalledWith('1');
    });
  });

  it('cancels registration modal', async () => {
    renderEventDetail('/events/1');
    await waitFor(() => expect(screen.getByRole('button', { name: /Inscribirse/i })).toBeInTheDocument());
    
    const registerBtn = screen.getByRole('button', { name: /Inscribirse/i });
    fireEvent.click(registerBtn);

    await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Confirmar inscripción/i })).toBeInTheDocument();
    });

    const cancelBtn = screen.getByText('Cancelar');
    fireEvent.click(cancelBtn);

    await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /Confirmar inscripción/i })).not.toBeInTheDocument();
    });
  });

  it('cancels withdrawal modal', async () => {
    const registeredEvent = { ...mockEvent, is_registered: true };
    (eventService.getEvent as any).mockResolvedValue(registeredEvent);

    renderEventDetail('/my-events/1');
    await waitFor(() => expect(screen.getByRole('button', { name: /Retirarse/i })).toBeInTheDocument());
    
    const withdrawBtn = screen.getByRole('button', { name: /Retirarse/i });
    fireEvent.click(withdrawBtn);

    await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Confirmar Retiro' })).toBeInTheDocument();
    });

    const cancelBtn = screen.getByText('Cancelar');
    fireEvent.click(cancelBtn);

    await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Confirmar Retiro' })).not.toBeInTheDocument();
    });
  });

  it('successfully updates status', async () => {
    mockUseAuth.mockReturnValue({
      user: { role: UserRole.ADMIN },
      isAuthenticated: true,
    });
    
    (eventService.updateEvent as any).mockResolvedValue({ ...mockEvent, status: EventStatus.CANCELLED });

    renderEventDetail();
    await waitFor(() => expect(screen.getByTestId('status-select')).toBeInTheDocument());
    
    const select = screen.getByTestId('status-select');
    fireEvent.change(select, { target: { value: EventStatus.CANCELLED } });
    
    await waitFor(() => {
        expect(screen.getByText('Cambiar Estado del Evento')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Confirmar'));
    
    await waitFor(() => {
        expect(screen.queryByText('Cambiar Estado del Evento')).not.toBeInTheDocument();
        expect(eventService.updateEvent).toHaveBeenCalledWith('1', { status: EventStatus.CANCELLED });
    });
  });

  it('handles status update error with Axios details', async () => {
    mockUseAuth.mockReturnValue({
      user: { role: UserRole.ADMIN },
      isAuthenticated: true,
    });
    
    const axiosError = new AxiosError('API Error');
    axiosError.response = {
        data: { detail: 'Custom API Error Message' },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
    };
    (eventService.updateEvent as any).mockRejectedValue(axiosError);

    renderEventDetail();
    await waitFor(() => expect(screen.getByTestId('status-select')).toBeInTheDocument());
    
    const select = screen.getByTestId('status-select');
    fireEvent.change(select, { target: { value: EventStatus.CANCELLED } });
    
    await waitFor(() => expect(screen.getByText('Cambiar Estado del Evento')).toBeInTheDocument());
    
    fireEvent.click(screen.getByText('Confirmar'));
    
    await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Custom API Error Message')).toBeInTheDocument();
    });
    
    // Close the error modal (covers closeResponseModal)
    fireEvent.click(screen.getByText('Cerrar'));
    await waitFor(() => {
        expect(screen.queryByText('Error')).not.toBeInTheDocument();
    });
  });

  it('shows withdraw button when registered and on my-events path', async () => {
    const registeredEvent = { ...mockEvent, is_registered: true };
    (eventService.getEvent as any).mockResolvedValue(registeredEvent);

    renderEventDetail('/my-events/1');
    await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retirarse/i })).toBeInTheDocument();
    });
  });

  it('handles withdrawal flow', async () => {
    const registeredEvent = { ...mockEvent, is_registered: true };
    (eventService.getEvent as any).mockResolvedValue(registeredEvent);
    (eventService.cancelRegistration as any).mockResolvedValue({});

    renderEventDetail('/my-events/1');
    await waitFor(() => expect(screen.getByRole('button', { name: /Retirarse/i })).toBeInTheDocument());
    
    const withdrawBtn = screen.getByRole('button', { name: /Retirarse/i });
    fireEvent.click(withdrawBtn);

    await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Confirmar Retiro' })).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: 'Confirmar Retiro' });
    fireEvent.click(confirmBtn);
    
    await waitFor(() => {
        expect(eventService.cancelRegistration).toHaveBeenCalledWith('1');
    });
  });

  it('shows admin status control and handles change', async () => {
    mockUseAuth.mockReturnValue({
      user: { role: UserRole.ADMIN },
      isAuthenticated: true,
    });
    
    (eventService.updateEvent as any).mockResolvedValue({ ...mockEvent, status: EventStatus.CANCELLED });

    renderEventDetail();
    await waitFor(() => expect(screen.getByTestId('status-select')).toBeInTheDocument());
    
    const select = screen.getByTestId('status-select');
    fireEvent.change(select, { target: { value: EventStatus.CANCELLED } });
    
    await waitFor(() => {
        expect(screen.getByText('Cambiar Estado del Evento')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Confirmar'));
    
    await waitFor(() => {
        expect(eventService.updateEvent).toHaveBeenCalledWith('1', { status: EventStatus.CANCELLED });
    });
  });

  it('handles registration error', async () => {
    (eventService.registerForEvent as any).mockRejectedValue(new Error('Failed to register'));

    renderEventDetail('/events/1');
    await waitFor(() => expect(screen.getByRole('button', { name: /Inscribirse/i })).toBeInTheDocument());
    
    const registerBtn = screen.getByRole('button', { name: /Inscribirse/i });
    fireEvent.click(registerBtn);

    await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Confirmar inscripción/i })).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: 'Confirmar Inscripción' });
    fireEvent.click(confirmBtn);
    
    await waitFor(() => {
        expect(screen.getByText('Error de Inscripción')).toBeInTheDocument();
        expect(screen.getByText('Failed to register')).toBeInTheDocument();
    });
  });

  it('handles withdrawal error', async () => {
    const registeredEvent = { ...mockEvent, is_registered: true };
    (eventService.getEvent as any).mockResolvedValue(registeredEvent);
    (eventService.cancelRegistration as any).mockRejectedValue(new Error('Cannot withdraw'));

    renderEventDetail('/my-events/1');
    await waitFor(() => expect(screen.getByRole('button', { name: /Retirarse/i })).toBeInTheDocument());
    
    const withdrawBtn = screen.getByRole('button', { name: /Retirarse/i });
    fireEvent.click(withdrawBtn);

    await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Confirmar Retiro' })).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: 'Confirmar Retiro' });
    fireEvent.click(confirmBtn);
    
    await waitFor(() => {
        expect(screen.getByText('Error de Cancelación')).toBeInTheDocument();
        expect(screen.getByText('Cannot withdraw')).toBeInTheDocument();
    });
  });

  it('handles status change error', async () => {
    mockUseAuth.mockReturnValue({
      user: { role: UserRole.ADMIN },
      isAuthenticated: true,
    });
    
    (eventService.updateEvent as any).mockRejectedValue(new Error('Update failed'));

    renderEventDetail();
    await waitFor(() => expect(screen.getByTestId('status-select')).toBeInTheDocument());
    
    const select = screen.getByTestId('status-select');
    fireEvent.change(select, { target: { value: EventStatus.CANCELLED } });
    
    await waitFor(() => expect(screen.getByText('Cambiar Estado del Evento')).toBeInTheDocument());
    
    fireEvent.click(screen.getByText('Confirmar'));
    
    await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Error al actualizar el estado')).toBeInTheDocument();
    });
  });

  it('handles status change cancellation', async () => {
    mockUseAuth.mockReturnValue({
      user: { role: UserRole.ADMIN },
      isAuthenticated: true,
    });

    renderEventDetail();
    await waitFor(() => expect(screen.getByTestId('status-select')).toBeInTheDocument());
    
    const select = screen.getByTestId('status-select');
    fireEvent.change(select, { target: { value: EventStatus.CANCELLED } });
    
    await waitFor(() => {
        expect(screen.getByText('Cambiar Estado del Evento')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Cancelar'));
    
    await waitFor(() => {
        expect(screen.queryByText('Cambiar Estado del Evento')).not.toBeInTheDocument();
    });
    
    expect(eventService.updateEvent).not.toHaveBeenCalled();
  });
});