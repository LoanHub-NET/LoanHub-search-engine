import { Navigate, useLocation } from 'react-router-dom';
import { getAuthSession } from '../../api/apiConfig';

export type AllowedRole = 'User' | 'Admin' | 'any' | 'notAdmin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: AllowedRole;
  redirectTo?: string;
}

/**
 * Determines if a role string represents an admin
 */
const isAdminRole = (role: string | number): boolean => {
  // Handle numeric role (enum value from backend)
  if (typeof role === 'number') {
    return role === 1;
  }
  
  const normalizedRole = String(role).toLowerCase();
  return (
    normalizedRole === 'admin' ||
    normalizedRole === 'administrator' ||
    normalizedRole === '1'
  );
};

/**
 * Protected route component that checks authentication and authorization
 * 
 * Usage:
 * - allowedRole="Admin" - only admins can access
 * - allowedRole="User" - only regular users can access (must be logged in)
 * - allowedRole="notAdmin" - anyone except admins (guests and users allowed)
 * - allowedRole="any" - any authenticated user can access
 */
export function ProtectedRoute({ 
  children, 
  allowedRole, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const location = useLocation();
  const session = getAuthSession();

  // For 'notAdmin' role - allow guests and users, block only admins
  if (allowedRole === 'notAdmin') {
    if (session && isAdminRole(session.role)) {
      // Admin trying to access - redirect to admin dashboard
      return <Navigate to="/admin" replace />;
    }
    // Guest or regular user - allow access
    return <>{children}</>;
  }

  // Not authenticated - redirect to login (for other role types)
  if (!session) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  const userRole = session.role;

  // Check role-based access
  if (allowedRole === 'any') {
    // Any authenticated user can access
    return <>{children}</>;
  }

  if (allowedRole === 'Admin') {
    if (!isAdminRole(userRole)) {
      // User trying to access admin area - redirect to user dashboard
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  if (allowedRole === 'User') {
    if (isAdminRole(userRole)) {
      // Admin trying to access user area - redirect to admin dashboard
      return <Navigate to="/admin" replace />;
    }
    return <>{children}</>;
  }

  // Fallback - allow access
  return <>{children}</>;
}
