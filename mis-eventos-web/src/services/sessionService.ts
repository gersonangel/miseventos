import { Session, SessionCreate, SessionUpdate } from '../types/session';
import { api } from '../lib/axios';

export const sessionService = {
  async getEventSessions(eventId: string): Promise<Session[]> {
    const response = await api.get<Session[]>(`/sessions/events/${eventId}/sessions`);
    return response.data;
  },

  async getSession(id: string): Promise<Session> {
    const response = await api.get<Session>(`/sessions/sessions/${id}`);
    return response.data;
  },

  async createSession(eventId: string, session: SessionCreate): Promise<Session> {
    const response = await api.post<Session>(`/sessions/events/${eventId}/sessions`, session);
    return response.data;
  },

  async updateSession(id: string, session: SessionUpdate): Promise<Session> {
    const response = await api.put<Session>(`/sessions/sessions/${id}`, session);
    return response.data;
  },

  async deleteSession(id: string): Promise<void> {
    await api.delete(`/sessions/sessions/${id}`);
  },

  async assignSpeakers(id: string, speakerIds: string[]): Promise<void> {
    await api.post(`/sessions/sessions/${id}/speakers`, { speaker_ids: speakerIds });
  },

  async joinSession(id: string): Promise<void> {
    await api.post(`/sessions/sessions/${id}/join`);
  }
};
