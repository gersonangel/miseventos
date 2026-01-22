import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUsers, useUser, useCreateUser, useUpdateUser, useDeleteUser } from './useUsers';
import { userService } from '../services/userService';
import { ReactNode } from 'react';

// Mock userService
vi.mock('../services/userService', () => ({
  userService: {
    getUsers: vi.fn(),
    getUser: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useUsers Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useUsers', () => {
    it('fetches users successfully', async () => {
      const mockUsers = { items: [{ id: '1', name: 'User 1' }], total: 1, page: 1, size: 10, pages: 1 };
      (userService.getUsers as any).mockResolvedValue(mockUsers);

      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockUsers);
      expect(userService.getUsers).toHaveBeenCalledWith(1, 10, undefined);
    });
  });

  describe('useUser', () => {
    it('fetches a single user successfully', async () => {
      const mockUser = { id: '1', name: 'User 1' };
      (userService.getUser as any).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useUser('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockUser);
      expect(userService.getUser).toHaveBeenCalledWith('1');
    });
  });

  describe('useCreateUser', () => {
    it('creates a user successfully', async () => {
      const mockNewUser = { email: 'test@test.com', password: 'password', full_name: 'Test User' };
      const mockCreatedUser = { id: '1', ...mockNewUser };
      (userService.createUser as any).mockResolvedValue(mockCreatedUser);

      const { result } = renderHook(() => useCreateUser(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockNewUser as any);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockCreatedUser);
      expect(userService.createUser).toHaveBeenCalledWith(mockNewUser);
    });
  });

  describe('useUpdateUser', () => {
    it('updates a user successfully', async () => {
      const mockUpdateData = { full_name: 'Updated User' };
      const mockUpdatedUser = { id: '1', ...mockUpdateData };
      (userService.updateUser as any).mockResolvedValue(mockUpdatedUser);

      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: '1', data: mockUpdateData as any });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockUpdatedUser);
      expect(userService.updateUser).toHaveBeenCalledWith('1', mockUpdateData);
    });
  });

  describe('useDeleteUser', () => {
    it('deletes a user successfully', async () => {
      (userService.deleteUser as any).mockResolvedValue({});

      const { result } = renderHook(() => useDeleteUser(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(userService.deleteUser).toHaveBeenCalledWith('1');
    });
  });
});
