import Cookies from 'js-cookie';

export const isTokenExpired = (): boolean => {
    const token = Cookies.get('token');
    if (!token) return true;

    try {
        const payload = token.split('.')[1];
        if (!payload) return true;

        let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        
        const decoded = JSON.parse(atob(base64));
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
    const token = Cookies.get('token');
    if (!token) {
        console.log('No token found');
        return false;
    }

    try {
        // JWT tokens have 3 parts separated by dots: header.payload.signature
        const payload = token.split('.')[1];
        if (!payload) {
            console.log('No payload found in token');
            return false;
        }

        // Decode base64 URL - need to add padding if needed
        let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding
        while (base64.length % 4) {
            base64 += '=';
        }
        
        const decoded = JSON.parse(atob(base64));
        console.log('Decoded token payload:', decoded);
        console.log('All claims in token:', Object.keys(decoded));
        
        // JWT claims are stored at the top level of the payload
        // Check for "admin" claim (what backend sets)
        let isAdminClaim = decoded.admin;
        
        // Fallback to "isAdmin" for backwards compatibility
        if (isAdminClaim === undefined) {
            isAdminClaim = decoded.isAdmin;
        }
        
        console.log('Admin claim value:', isAdminClaim, 'type:', typeof isAdminClaim);
        
        const result = isAdminClaim === true || 
                      isAdminClaim === 'true' || 
                      isAdminClaim === 'True' ||
                      String(isAdminClaim).toLowerCase() === 'true';
        
        console.log('Admin result:', result);
        return result;
    } catch (error) {
        console.error('Error decoding token:', error);
        return false;
    }
};
