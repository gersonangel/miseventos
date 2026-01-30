import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEvents, useEvent, useCreateEvent } from './useEvents';
import { eventService } from '../services/eventService';
import { ReactNode } from 'react';

// Mock eventService
vi.mock('../services/eventService', () => ({
  eventService: {
    getEvents: vi.fn(),
    getEvent: vi.fn(),
    createEvent: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useEvents Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useEvents', () => {
    it('fetches events successfully', async () => {
      const mockEvents = { items: [{ id: '1', title: 'Event 1' }], total: 1, page: 1, size: 10, pages: 1 };
      (eventService.getEvents as any).mockResolvedValue(mockEvents);

      const { result } = renderHook(() => useEvents({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockEvents);
      expect(eventService.getEvents).toHaveBeenCalledWith({});
    });
  });

  describe('useEvent', () => {
    it('fetches a single event successfully', async () => {
      const mockEvent = { id: '1', title: 'Event 1' };
      (eventService.getEvent as any).mockResolvedValue(mockEvent);

      const { result } = renderHook(() => useEvent('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockEvent);
      expect(eventService.getEvent).toHaveBeenCalledWith('1');
    });

    it('does not fetch when id is not provided', async () => {
      const { result } = renderHook(() => useEvent(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false); // Should not start loading
      expect(result.current.fetchStatus).toBe('idle'); // Should be idle
      expect(eventService.getEvent).not.toHaveBeenCalled();
    });
  });

  describe('useCreateEvent', () => {
    it('creates an event successfully', async () => {
      const mockNewEvent = { title: 'New Event' };
      const mockCreatedEvent = { id: '1', ...mockNewEvent };
      (eventService.createEvent as any).mockResolvedValue(mockCreatedEvent);

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockNewEvent as any);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockCreatedEvent);
      expect(eventService.createEvent).toHaveBeenCalledWith(mockNewEvent);
    });
  });
});
