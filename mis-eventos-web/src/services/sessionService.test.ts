import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sessionService } from './sessionService';
import { api } from '../lib/axios';

vi.mock('../lib/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('sessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getEventSessions calls api.get', async () => {
    const mockSessions = [{ id: 1, title: 'Session 1' }];
    (api.get as any).mockResolvedValue({ data: mockSessions });
    const result = await sessionService.getEventSessions('1');
    expect(api.get).toHaveBeenCalledWith('/sessions/events/1/sessions');
    expect(result).toEqual(mockSessions);
  });

  it('getSession calls api.get', async () => {
    const mockSession = { id: 1, title: 'Session 1' };
    (api.get as any).mockResolvedValue({ data: mockSession });
    const result = await sessionService.getSession('1');
    expect(api.get).toHaveBeenCalledWith('/sessions/sessions/1');
    expect(result).toEqual(mockSession);
  });

  it('createSession calls api.post', async () => {
    const newSession = { title: 'New Session' } as any;
    (api.post as any).mockResolvedValue({ data: { id: 1, ...newSession } });
    const result = await sessionService.createSession('1', newSession);
    expect(api.post).toHaveBeenCalledWith('/sessions/events/1/sessions', newSession);
    expect(result).toEqual({ id: 1, ...newSession });
  });

  it('updateSession calls api.put', async () => {
    const updateData = { title: 'Updated' } as any;
    (api.put as any).mockResolvedValue({ data: { id: 1, ...updateData } });
    const result = await sessionService.updateSession('1', updateData);
    expect(api.put).toHaveBeenCalledWith('/sessions/sessions/1', updateData);
    expect(result).toEqual({ id: 1, ...updateData });
  });

  it('deleteSession calls api.delete', async () => {
    (api.delete as any).mockResolvedValue({});
    await sessionService.deleteSession('1');
    expect(api.delete).toHaveBeenCalledWith('/sessions/sessions/1');
  });

  it('assignSpeakers calls api.post', async () => {
    (api.post as any).mockResolvedValue({});
    await sessionService.assignSpeakers('1', ['2', '3']);
    expect(api.post).toHaveBeenCalledWith('/sessions/sessions/1/speakers', { speaker_ids: ['2', '3'] });
  });

  it('joinSession calls api.post', async () => {
    (api.post as any).mockResolvedValue({});
    await sessionService.joinSession('1');
    expect(api.post).toHaveBeenCalledWith('/sessions/sessions/1/join');
  });
});
