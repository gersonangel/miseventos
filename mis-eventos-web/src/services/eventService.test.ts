import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventService } from './eventService';
import { api } from '../lib/axios';

vi.mock('../lib/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('eventService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getEvents calls api.get with correct params', async () => {
    (api.get as any).mockResolvedValue({ data: { items: [], total: 0 } });
    await eventService.getEvents({ page: 2, size: 20, search: 'test' });
    expect(api.get).toHaveBeenCalledWith('/events/', {
      params: {
        page: 2,
        size: 20,
        search: 'test',
        skip: 20,
        limit: 20
      }
    });
  });

  it('getEvent calls api.get with id', async () => {
    const mockEvent = { id: 1, title: 'Test' };
    (api.get as any).mockResolvedValue({ data: mockEvent });
    const result = await eventService.getEvent('1');
    expect(api.get).toHaveBeenCalledWith('/events/1');
    expect(result).toEqual(mockEvent);
  });

  it('createEvent calls api.post', async () => {
    const newEvent = { title: 'Test' } as any;
    (api.post as any).mockResolvedValue({ data: { id: 1, ...newEvent } });
    const result = await eventService.createEvent(newEvent);
    expect(api.post).toHaveBeenCalledWith('/events/', newEvent);
    expect(result).toEqual({ id: 1, ...newEvent });
  });

  it('updateEvent calls api.put', async () => {
    const updateData = { title: 'Updated' } as any;
    (api.put as any).mockResolvedValue({ data: { id: 1, ...updateData } });
    const result = await eventService.updateEvent('1', updateData);
    expect(api.put).toHaveBeenCalledWith('/events/1', updateData);
    expect(result).toEqual({ id: 1, ...updateData });
  });

  it('deleteEvent calls api.delete', async () => {
    (api.delete as any).mockResolvedValue({});
    await eventService.deleteEvent('1');
    expect(api.delete).toHaveBeenCalledWith('/events/1');
  });

  it('registerForEvent calls api.post', async () => {
    (api.post as any).mockResolvedValue({});
    await eventService.registerForEvent('1');
    expect(api.post).toHaveBeenCalledWith('/events/1/register');
  });

  it('cancelRegistration calls api.delete', async () => {
    (api.delete as any).mockResolvedValue({});
    await eventService.cancelRegistration('1');
    expect(api.delete).toHaveBeenCalledWith('/events/1/register');
  });

  it('uploadImage calls api.post with formData', async () => {
    const file = new File(['content'], 'test.png', { type: 'image/png' });
    (api.post as any).mockResolvedValue({ data: { url: 'http://example.com/test.png' } });
    
    const result = await eventService.uploadImage(file);
    
    expect(api.post).toHaveBeenCalledWith(
      '/events/upload-image', 
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    expect(result).toBe('http://example.com/test.png');
  });
});
