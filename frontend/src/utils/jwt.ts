import Cookies from 'js-cookie';
import { AUTH_COOKIE_KEY } from './constants';

export const getTokenPayload = (): Record<string, any> | null => {
    const token = Cookies.get(AUTH_COOKIE_KEY);
    if (!token) return null;

    try {
        const payload = token.split('.')[1];
        if (!payload) return null;
        let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        return JSON.parse(atob(base64));
    } catch (error) {
        console.error('Error decoding token payload:', error);
        return null;
    }
};

export const isTokenExpired = (): boolean => {
    const decoded = getTokenPayload();
    if (!decoded) return true;
    try {
        const exp = decoded.exp;
        if (!exp) return true;
        // exp is in seconds, Date.now() is in milliseconds
        const expirationTime = exp * 1000;
        const currentTime = Date.now();
        return currentTime >= expirationTime;
    } catch (error) {
        console.error('Error checking token expiration:', error);
        return true;
    }
};

export const isAdmin = (): boolean => {
    const decoded = getTokenPayload();
    if (!decoded) {
        return false;
    }

    try {
        const role = String(decoded.role ?? '').toLowerCase();
        if (role === 'admin' || role === 'organizer') {
            return true;
        }

        // JWT claims are stored at the top level of the payload
        // Check for "admin" claim (what backend sets)
        let isAdminClaim = decoded.admin;
        
        // Fallback to "isAdmin" for backwards compatibility
        if (isAdminClaim === undefined) {
            isAdminClaim = decoded.isAdmin;
        }
        
        const result = isAdminClaim === true || 
                      isAdminClaim === 'true' || 
                      isAdminClaim === 'True' ||
                      String(isAdminClaim).toLowerCase() === 'true';
        return result;
    } catch (error) {
        console.error('Error decoding token:', error);
        return false;
    }
};
