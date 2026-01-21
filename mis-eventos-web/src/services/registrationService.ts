import { Event } from '../types/event';

const API_URL = 'http://localhost:8000';

export const registrationService = {
  async registerForEvent(eventId: number, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/registrations/${eventId}/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to register');
    }
  },

  async getMyRegistrations(token: string): Promise<Event[]> {
    const response = await fetch(`${API_URL}/registrations/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch registrations');
    return response.json();
  },

  async cancelRegistration(eventId: number, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/registrations/${eventId}/register`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to cancel registration');
  }
};
