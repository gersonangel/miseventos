import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventList } from './EventList';
import { MemoryRouter } from 'react-router-dom';
import * as useEventsModule from '../hooks/useEvents';
import * as AuthContextModule from '../context/AuthContext';
import { UserRole } from '../types';
import { EventStatus, EventType } from '../types/event';

// Mock hooks
vi.mock('../hooks/useEvents', () => ({
  useEvents: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock child components to simplify testing
vi.mock('../components/EventCard', () => ({
  EventCard: ({ event }: { event: any }) => <div data-testid="event-card">{event.title}</div>,
}));

describe('EventList Page', () => {
  const mockUseEvents = useEventsModule.useEvents as any;
  const mockUseAuth = AuthContextModule.useAuth as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { role: UserRole.ATTENDEE },
      isAuthenticated: true,
    });
  });

  const renderEventList = (props = {}) => {
    return render(
      <MemoryRouter>
        <EventList {...props} />
      </MemoryRouter>
    );
  };

  it('renders loading state', () => {
    mockUseEvents.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    const { container } = renderEventList();
    // Look for spinner by class since it doesn't have role="status"
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseEvents.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch'),
    });

    renderEventList();
    expect(screen.getByText(/Error al cargar los eventos/)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    mockUseEvents.mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
    });

    renderEventList();
    expect(screen.getByText('No se encontraron eventos')).toBeInTheDocument();
  });

  it('renders event list', () => {
    const mockEvents = [
      { id: 1, title: 'Event 1' },
      { id: 2, title: 'Event 2' },
    ];

    mockUseEvents.mockReturnValue({
      data: { items: mockEvents, total: 2 },
      isLoading: false,
      error: null,
    });

    renderEventList();
    expect(screen.getAllByTestId('event-card')).toHaveLength(2);
    expect(screen.getByText('Event 1')).toBeInTheDocument();
    expect(screen.getByText('Event 2')).toBeInTheDocument();
  });

  it('shows create button for admin', () => {
    mockUseAuth.mockReturnValue({
      user: { role: UserRole.ADMIN },
      isAuthenticated: true,
    });
    mockUseEvents.mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
    });

    renderEventList();
    expect(screen.getByText('Crear Evento')).toBeInTheDocument();
  });

  it('shows create button for organizer', () => {
    mockUseAuth.mockReturnValue({
      user: { role: UserRole.ORGANIZER },
      isAuthenticated: true,
    });
    mockUseEvents.mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
    });

    renderEventList();
    expect(screen.getByText('Crear Evento')).toBeInTheDocument();
  });

  it('hides create button for attendee', () => {
    mockUseAuth.mockReturnValue({
      user: { role: UserRole.ATTENDEE },
      isAuthenticated: true,
    });
    mockUseEvents.mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
    });

    renderEventList();
    expect(screen.queryByText('Crear Evento')).not.toBeInTheDocument();
  });

  it('handles search input', () => {
    mockUseEvents.mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
    });

    renderEventList();
    const searchInput = screen.getByPlaceholderText('Buscar eventos...');
    fireEvent.change(searchInput, { target: { value: 'New Search' } });
    
    expect(searchInput).toHaveValue('New Search');
    // useEvents is called with new search value on re-render (which happens due to state change)
    expect(mockUseEvents).toHaveBeenCalledWith(expect.objectContaining({
      search: 'New Search',
      page: 1
    }));
  });

  it('handles pagination', () => {
    mockUseEvents.mockReturnValue({
      data: { items: [], total: 20 },
      isLoading: false,
      error: null,
    });

    renderEventList();
    // Assuming Pagination component renders buttons with page numbers
    // Need to find "Siguiente" or page 2 button. 
    // Since Pagination is mocked or complex, we can trust it renders.
    // Let's assume standard Pagination behavior or mock it if needed.
    // The real Pagination component is used here.
    
    const nextButtons = screen.getAllByText('Siguiente');
    fireEvent.click(nextButtons[0]); // Click desktop next button
    
    expect(mockUseEvents).toHaveBeenCalledWith(expect.objectContaining({
      page: 2
    }));
  });

  it('handles status filter change', () => {
    mockUseEvents.mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
    });

    renderEventList();
    
    // Find status trigger by default text
    const statusTrigger = screen.getByText('Todos los estados');
    fireEvent.click(statusTrigger);
    
    // Find option 'PUBLICADO' (matching STATUS_LABELS)
    const option = screen.getByText('PUBLICADO');
    fireEvent.click(option);
    
    expect(mockUseEvents).toHaveBeenCalledWith(expect.objectContaining({
      status: EventStatus.PUBLISHED,
      page: 1
    }));
  });

  it('handles type filter change', () => {
    mockUseEvents.mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
    });

    renderEventList();
    
    // Find type trigger
    const typeTrigger = screen.getByText('Todos los tipos');
    fireEvent.click(typeTrigger);
    
    // Find option 'CONFERENCIA'
    const option = screen.getByText('CONFERENCIA');
    fireEvent.click(option);
    
    expect(mockUseEvents).toHaveBeenCalledWith(expect.objectContaining({
      event_type: EventType.CONFERENCE,
      page: 1
    }));
  });

  it('handles page size change', () => {
    mockUseEvents.mockReturnValue({
      data: { items: [], total: 100 },
      isLoading: false,
      error: null,
    });

    renderEventList();
    

    
    const pageSizeBtn = screen.getByRole('button', { name: /6/i });
    fireEvent.click(pageSizeBtn);
    
    const option12 = screen.getByText('12');
    fireEvent.click(option12);
    
    expect(mockUseEvents).toHaveBeenCalledWith(expect.objectContaining({
      size: 12
    }));
    
    expect(localStorage.getItem('eventsPageSize')).toBe('12');
  });
});
