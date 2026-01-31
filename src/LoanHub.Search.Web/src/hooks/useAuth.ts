import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAuthSession, 
  clearAuthSession, 
  type AuthSession 
} from '../api/apiConfig';

export type UserRole = 'User' | 'Admin' | 'PlatformAdmin' | 'Unknown';

interface UseAuthReturn {
  /** Current auth session */
  session: AuthSession | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Normalized user role */
  role: UserRole;
  /** Whether user is admin */
  isAdmin: boolean;
  /** Whether user is platform admin */
  isPlatformAdmin: boolean;
  /** Whether user is regular user (not admin) */
  isUser: boolean;
  /** Log out and redirect to login */
  logout: () => void;
  /** Refresh auth session from storage */
  refresh: () => void;
  /** Redirect to appropriate dashboard based on role */
  redirectToDashboard: () => void;
}

/**
 * Determines if a role string or number represents an admin
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

const isPlatformAdminRole = (role: string | number): boolean => {
  if (typeof role === 'number') {
    return role === 2;
  }
  const normalizedRole = String(role).toLowerCase();
  return normalizedRole === 'platformadmin' || normalizedRole === 'platform_admin' || normalizedRole === '2';
};

/**
 * Hook for managing authentication state and role-based access
 */
export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const [session, setSession] = useState<AuthSession | null>(() => getAuthSession());

  const refresh = useCallback(() => {
    setSession(getAuthSession());
  }, []);

  // Refresh session when localStorage changes (e.g., from another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'loanhub_auth') {
        refresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refresh]);

  const isAuthenticated = session !== null;

  const role = useMemo((): UserRole => {
    if (!session) return 'Unknown';
    if (isPlatformAdminRole(session.role)) return 'PlatformAdmin';
    return isAdminRole(session.role) ? 'Admin' : 'User';
  }, [session]);

  const isAdmin = role === 'Admin';
  const isPlatformAdmin = role === 'PlatformAdmin';
  const isUser = role === 'User';

  const logout = useCallback(() => {
    clearAuthSession();
    setSession(null);
    navigate('/login');
  }, [navigate]);

  const redirectToDashboard = useCallback(() => {
    if (!session) {
      navigate('/login');
      return;
    }
    if (isPlatformAdmin) {
      navigate('/platform-admin');
      return;
    }
    navigate(isAdmin ? '/admin' : '/dashboard');
  }, [session, isAdmin, isPlatformAdmin, navigate]);

  return {
    session,
    isAuthenticated,
    role,
    isAdmin,
    isPlatformAdmin,
    isUser,
    logout,
    refresh,
    redirectToDashboard,
  };
}
