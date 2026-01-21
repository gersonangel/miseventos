import { Session, SessionCreate } from '../types/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const sessionService = {
  async getEventSessions(eventId: number, token: string): Promise<Session[]> {
    const response = await fetch(`${API_URL}/sessions/${eventId}/sessions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch sessions');
    return response.json();
  },

  async createSession(eventId: number, session: SessionCreate, token: string): Promise<Session> {
    const response = await fetch(`${API_URL}/sessions/${eventId}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(session)
    });
    if (!response.ok) throw new Error('Failed to create session');
    return response.json();
  }
};
