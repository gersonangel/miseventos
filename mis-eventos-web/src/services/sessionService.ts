import { Session, SessionCreate } from '../types/session';
import { api } from '../lib/axios';

export const sessionService = {
  async getEventSessions(eventId: string): Promise<Session[]> {
    const response = await api.get<Session[]>(`/sessions/events/${eventId}/sessions`);
    return response.data;
  },

  async createSession(eventId: string, session: SessionCreate): Promise<Session> {
    const response = await api.post<Session>(`/sessions/events/${eventId}/sessions`, session);
    return response.data;
  }
};
