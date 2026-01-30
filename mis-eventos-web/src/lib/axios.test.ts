import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from './axios';

describe('axios instance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('request interceptor adds token if present', () => {
        localStorage.setItem('token', 'fake-token');
        // @ts-ignore - Accessing internal handlers
        const requestInterceptor = api.interceptors.request.handlers[0];
        const config = { headers: {} };
        
        const result = requestInterceptor.fulfilled(config);
        expect(result.headers.Authorization).toBe('Bearer fake-token');
    });

    it('request interceptor does not add token if missing', () => {
        // @ts-ignore
        const requestInterceptor = api.interceptors.request.handlers[0];
        const config = { headers: {} };
        
        const result = requestInterceptor.fulfilled(config);
        expect(result.headers.Authorization).toBeUndefined();
    });

    it('request interceptor handles error', async () => {
         // @ts-ignore
        const requestInterceptor = api.interceptors.request.handlers[0];
        const error = new Error('Request failed');
        
        await expect(requestInterceptor.rejected(error)).rejects.toThrow('Request failed');
    });

    it('response interceptor returns response', () => {
        // @ts-ignore
        const responseInterceptor = api.interceptors.response.handlers[0];
        const response = { data: 'test' };
        
        const result = responseInterceptor.fulfilled(response);
        expect(result).toEqual(response);
    });

    it('response interceptor handles 401/403 errors', async () => {
        // @ts-ignore
        const responseInterceptor = api.interceptors.response.handlers[0];
        localStorage.setItem('token', 'fake-token');
        
        const error = {
            response: { status: 401 }
        };
        
        await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);
        expect(localStorage.getItem('token')).toBeNull();

        // Test 403
        localStorage.setItem('token', 'fake-token');
        const error403 = {
            response: { status: 403 }
        };
        await expect(responseInterceptor.rejected(error403)).rejects.toEqual(error403);
        expect(localStorage.getItem('token')).toBeNull();
    });

    it('response interceptor handles other errors', async () => {
        // @ts-ignore
        const responseInterceptor = api.interceptors.response.handlers[0];
        localStorage.setItem('token', 'fake-token');
        
        const error = {
            response: { status: 500 }
        };
        
        await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);
        expect(localStorage.getItem('token')).toBe('fake-token'); // Should remain
    });
});
