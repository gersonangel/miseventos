import { api } from '../lib/axios';
import { User, UserCreateAdmin, UserUpdate, UserListResponse } from '../types';

export const userService = {
  async getUsers(page = 1, size = 10, role?: string): Promise<UserListResponse> {
    const params = { page, size, role };
    const response = await api.get<UserListResponse | User[]>('/users', { params });
    
    // Handle potential differences in response format (List vs Paginated)
    if (Array.isArray(response.data)) {
      return {
        items: response.data,
        total: response.data.length,
        page: 1,
        size: response.data.length
      };
    }
    return response.data;
  },

  async getUser(id: string): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  async createUser(user: UserCreateAdmin): Promise<User> {
    const response = await api.post<User>('/users', user);
    return response.data;
  },
  
  async updateUser(id: string, user: UserUpdate): Promise<User> {
    const response = await api.put<User>(`/users/${id}`, user);
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  }
};
