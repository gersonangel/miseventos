import { api } from '../lib/axios';
import { Event, EventCreate, EventUpdate, EventListResponse, EventFilters } from '../types/event';

export const eventService = {
  async getEvents(params: EventFilters = {}): Promise<EventListResponse> {
    const { page = 1, size = 10, ...filters } = params;
    const response = await api.get<EventListResponse>('/events/', {
      params: {
        page,
        size,
        ...filters,
        skip: (page - 1) * size,
        limit: size
      }
    });
    return response.data;
  },

  async getEvent(id: string): Promise<Event> {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },

  async createEvent(event: EventCreate): Promise<Event> {
    const response = await api.post<Event>('/events/', event);
    return response.data;
  },
  
  async updateEvent(id: string, event: EventUpdate): Promise<Event> {
    const response = await api.put<Event>(`/events/${id}`, event);
    return response.data;
  },

  async deleteEvent(id: string): Promise<void> {
    await api.delete(`/events/${id}`);
  },

  async registerForEvent(id: string): Promise<void> {
    await api.post(`/events/${id}/register`);
  },

  async cancelRegistration(id: string): Promise<void> {
    await api.delete(`/events/${id}/register`);
  },

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/events/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  }
};
