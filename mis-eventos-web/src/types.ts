export enum UserRole {
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  SPEAKER = 'speaker',
  ATTENDEE = 'attendee',
}

export interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  role?: UserRole; // Optional initially to avoid breaking if backend doesn't send it yet, but goal is to use it
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
