import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEventSessions, useSession, useCreateSession, useUpdateSession, useDeleteSession, useAssignSpeakers, useJoinSession } from './useSessions';
import { sessionService } from '../services/sessionService';
import { ReactNode } from 'react';

// Mock sessionService
vi.mock('../services/sessionService', () => ({
  sessionService: {
    getEventSessions: vi.fn(),
    getSession: vi.fn(),
    createSession: vi.fn(),
    updateSession: vi.fn(),
    deleteSession: vi.fn(),
    assignSpeakers: vi.fn(),
    joinSession: vi.fn(),
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

describe('useSessions Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useEventSessions', () => {
    it('fetches event sessions successfully', async () => {
      const mockSessions = [{ id: '1', title: 'Session 1' }];
      (sessionService.getEventSessions as any).mockResolvedValue(mockSessions);

      const { result } = renderHook(() => useEventSessions('event-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSessions);
      expect(sessionService.getEventSessions).toHaveBeenCalledWith('event-1');
    });
  });

  describe('useSession', () => {
    it('fetches a single session successfully', async () => {
      const mockSession = { id: '1', title: 'Session 1' };
      (sessionService.getSession as any).mockResolvedValue(mockSession);

      const { result } = renderHook(() => useSession('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSession);
      expect(sessionService.getSession).toHaveBeenCalledWith('1');
    });
  });

  describe('useCreateSession', () => {
    it('creates a session successfully', async () => {
      const mockNewSession = { title: 'New Session' };
      const mockCreatedSession = { id: '1', ...mockNewSession };
      (sessionService.createSession as any).mockResolvedValue(mockCreatedSession);

      const { result } = renderHook(() => useCreateSession(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ eventId: 'event-1', session: mockNewSession as any });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockCreatedSession);
      expect(sessionService.createSession).toHaveBeenCalledWith('event-1', mockNewSession);
    });
  });

  describe('useUpdateSession', () => {
    it('updates a session successfully', async () => {
      const mockUpdateData = { title: 'Updated Session' };
      const mockUpdatedSession = { id: '1', event_id: 'event-1', ...mockUpdateData };
      (sessionService.updateSession as any).mockResolvedValue(mockUpdatedSession);

      const { result } = renderHook(() => useUpdateSession(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: '1', session: mockUpdateData as any });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockUpdatedSession);
      expect(sessionService.updateSession).toHaveBeenCalledWith('1', mockUpdateData);
    });
  });

  describe('useDeleteSession', () => {
    it('deletes a session successfully', async () => {
      (sessionService.deleteSession as any).mockResolvedValue({});

      const { result } = renderHook(() => useDeleteSession(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(sessionService.deleteSession).toHaveBeenCalledWith('1');
    });
  });

  describe('useAssignSpeakers', () => {
    it('assigns speakers successfully', async () => {
      (sessionService.assignSpeakers as any).mockResolvedValue({});

      const { result } = renderHook(() => useAssignSpeakers(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: '1', speakerIds: ['speaker-1'] });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(sessionService.assignSpeakers).toHaveBeenCalledWith('1', ['speaker-1']);
    });
  });

  describe('useJoinSession', () => {
    it('joins a session successfully', async () => {
      (sessionService.joinSession as any).mockResolvedValue({});

      const { result } = renderHook(() => useJoinSession(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(sessionService.joinSession).toHaveBeenCalledWith('1');
    });
  });
});
