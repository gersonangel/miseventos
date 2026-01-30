import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyRegistrations } from './MyRegistrations';
import { registrationService } from '../services/registrationService';
import { MemoryRouter } from 'react-router-dom';
import { EventStatus, EventType } from '../types/event';

// Mock dependencies
vi.mock('../services/registrationService', () => ({
  registrationService: {
    getMyRegistrations: vi.fn(),
  }
}));

vi.mock('../components/EventCard', () => ({
  EventCard: ({ event }: any) => <div data-testid="event-card">{event.title}</div>
}));

describe('MyRegistrations Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderMyRegistrations = () => {
    return render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MyRegistrations />
      </MemoryRouter>
    );
  };

  it('renders loading state', () => {
    localStorage.setItem('token', 'fake-token');
    (registrationService.getMyRegistrations as any).mockImplementation(() => new Promise(() => {}));
    renderMyRegistrations();
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('renders error state', async () => {
    (registrationService.getMyRegistrations as any).mockRejectedValue(new Error('Failed'));
    localStorage.setItem('token', 'fake-token');
    
    renderMyRegistrations();
    
    await waitFor(() => {
      expect(screen.getByText('Error al cargar inscripciones')).toBeInTheDocument();
    });
  });

  it('renders empty state', async () => {
    (registrationService.getMyRegistrations as any).mockResolvedValue([]);
    localStorage.setItem('token', 'fake-token');
    
    renderMyRegistrations();
    
    await waitFor(() => {
      expect(screen.getByText('No te has inscrito a ningún evento aún.')).toBeInTheDocument();
    });
  });

  it('renders list of events', async () => {
    const mockEvents = [
      { id: '1', title: 'Event 1', status: EventStatus.PUBLISHED, type: EventType.CONFERENCE },
      { id: '2', title: 'Event 2', status: EventStatus.PUBLISHED, type: EventType.WORKSHOP },
    ];
    (registrationService.getMyRegistrations as any).mockResolvedValue(mockEvents);
    localStorage.setItem('token', 'fake-token');
    
    renderMyRegistrations();
    
    await waitFor(() => {
      expect(screen.getAllByTestId('event-card')).toHaveLength(2);
      expect(screen.getByText('Event 1')).toBeInTheDocument();
      expect(screen.getByText('Event 2')).toBeInTheDocument();
    });
  });

  it('does not fetch if no token', async () => {
    renderMyRegistrations();
    // Should default to empty list if no token logic is triggered (or maybe stay loading? logic says if token)
    // Actually the logic is: if (token) fetch. So if no token, it might just stay empty or loading?
    // Let's check implementation:
    // const [loading, setLoading] = useState(true);
    // ... if (token) await ... else? Logic doesn't handle else for setLoading(false) unless it falls through?
    // Wait, try-catch-finally handles setLoading(false).
    
    await waitFor(() => {
        expect(registrationService.getMyRegistrations).not.toHaveBeenCalled();
    });
    // And it should show empty state eventually
    await waitFor(() => {
        expect(screen.getByText('No te has inscrito a ningún evento aún.')).toBeInTheDocument();
    });
  });
});
