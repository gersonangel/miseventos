import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from './userService';
import { api } from '../lib/axios';

vi.mock('../lib/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getUsers handles paginated response', async () => {
    const mockResponse = { 
      items: [{ id: 1, full_name: 'User 1' }], 
      total: 1, 
      page: 1, 
      size: 10 
    };
    (api.get as any).mockResolvedValue({ data: mockResponse });
    
    const result = await userService.getUsers(1, 10, 'admin');
    
    expect(api.get).toHaveBeenCalledWith('/users', { params: { page: 1, size: 10, role: 'admin' } });
    expect(result).toEqual(mockResponse);
  });

  it('getUsers handles array response', async () => {
    const mockArray = [{ id: 1, full_name: 'User 1' }];
    (api.get as any).mockResolvedValue({ data: mockArray });
    
    const result = await userService.getUsers();
    
    expect(api.get).toHaveBeenCalledWith('/users', { params: { page: 1, size: 10, role: undefined } });
    expect(result).toEqual({
      items: mockArray,
      total: 1,
      page: 1,
      size: 1
    });
  });

  it('getUser calls api.get', async () => {
    const mockUser = { id: 1, full_name: 'User 1' };
    (api.get as any).mockResolvedValue({ data: mockUser });
    const result = await userService.getUser('1');
    expect(api.get).toHaveBeenCalledWith('/users/1');
    expect(result).toEqual(mockUser);
  });

  it('createUser calls api.post', async () => {
    const newUser = { email: 'test@example.com' } as any;
    (api.post as any).mockResolvedValue({ data: { id: 1, ...newUser } });
    const result = await userService.createUser(newUser);
    expect(api.post).toHaveBeenCalledWith('/users', newUser);
    expect(result).toEqual({ id: 1, ...newUser });
  });

  it('updateUser calls api.put', async () => {
    const updateData = { full_name: 'Updated' } as any;
    (api.put as any).mockResolvedValue({ data: { id: 1, ...updateData } });
    const result = await userService.updateUser('1', updateData);
    expect(api.put).toHaveBeenCalledWith('/users/1', updateData);
    expect(result).toEqual({ id: 1, ...updateData });
  });

  it('deleteUser calls api.delete', async () => {
    (api.delete as any).mockResolvedValue({});
    await userService.deleteUser('1');
    expect(api.delete).toHaveBeenCalledWith('/users/1');
  });
});
