export enum UserRole {
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  SPEAKER = 'speaker',
  ATTENDEE = 'attendee',
}

export interface User {
  id: string; // Changed to string (UUID)
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  role?: UserRole;
  created_at?: string;
  updated_at?: string;
  biography?: string;
  organization?: string;
  position?: string;
  profile_picture?: string;
}

export interface UserCreateAdmin {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  is_active?: boolean;
  biography?: string;
  organization?: string;
  position?: string;
  profile_picture?: string;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
  password?: string;
  biography?: string;
  organization?: string;
  position?: string;
  profile_picture?: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  size: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
