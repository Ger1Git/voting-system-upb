import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { isAdmin } from '../../utils/jwt';

type AuthRouteProps = {
    element: React.ComponentType;
    requireAuth: boolean;
    requireAdmin?: boolean;
}

const AuthRoute: React.FC<AuthRouteProps> = ({ element: Component, requireAuth, requireAdmin = false }) => {
    const token = Cookies.get('token');

    if (requireAuth) {
        if (!token) {
            return <Navigate to='/login' />;
        }
        if (requireAdmin && !isAdmin()) {
            return <Navigate to='/account' />;
        }
        return <Component />;
    } else {
        // For non-auth routes (like login, register)
        // If register requires admin, allow authenticated admins
        if (requireAdmin) {
            if (!token) {
                // No token - redirect to login
                return <Navigate to='/login' />;
            }
            // Has token - check if admin
            if (isAdmin()) {
                return <Component />;
            } else {
                // Not admin - redirect to account
                return <Navigate to='/account' />;
            }
        }
        // Regular non-auth route (like login)
        return token ? <Navigate to='/account' /> : <Component />;
    }
};

export default AuthRoute;
