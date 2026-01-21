import { api } from '../lib/axios';
import { Event, EventCreate } from '../types/event';

export const eventService = {
  async getEvents(): Promise<Event[]> {
    const response = await api.get<Event[]>('/events/');
    return response.data;
  },

  async getEvent(id: number): Promise<Event> {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },

  async createEvent(event: EventCreate): Promise<Event> {
    const response = await api.post<Event>('/events/', event);
    return response.data;
  },
  
  async updateEvent(id: number, event: Partial<EventCreate>): Promise<Event> {
    const response = await api.put<Event>(`/events/${id}`, event);
    return response.data;
  },

  async deleteEvent(id: number): Promise<void> {
    await api.delete(`/events/${id}`);
  }
};
