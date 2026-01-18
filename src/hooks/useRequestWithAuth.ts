import { useCallback } from 'react';
import { apiClient } from '../utils/axiosConfig';
import Cookies from 'js-cookie';
import { isTokenExpired } from '../utils/jwt';

const useRequestWithAuth = () => {
    const token = Cookies.get('token');

    const request = useCallback(async <T>(url: string, method: string = 'GET', data: any = null, skipAuth: boolean = false): Promise<T> => {
        if (!skipAuth && !token) {
            throw new Error('No token found');
        }

        // Check if token is expired before making request
        if (!skipAuth && token && isTokenExpired()) {
            Cookies.remove('token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
            throw new Error('Your session has expired. Please log in again.');
        }

        try {
            const config: any = {
                method,
                url,
            };

            if (data) {
                config.data = data;
            }

            const response = await apiClient.request<T>(config);
            return response.data;
        } catch (error: any) {
            // 401 errors are handled by axios interceptor
            if (error.response?.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            }
            throw new Error(error.response?.data?.message || error.message || 'An error occurred');
        }
    }, [token]);

    return { request };
};

export default useRequestWithAuth;
