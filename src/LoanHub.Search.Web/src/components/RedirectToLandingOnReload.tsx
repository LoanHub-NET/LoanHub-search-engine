import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuthSession } from '../api/apiConfig';

const REDIRECT_FLAG_KEY = 'loanhub_redirected_on_reload';

const isReloadNavigation = (): boolean => {
  if (typeof window === 'undefined') return false;
  const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (entry) {
    return entry.type === 'reload';
  }

  const legacy = (performance as Performance & { navigation?: { type: number } }).navigation;
  return legacy?.type === 1;
};

export function RedirectToLandingOnReload() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const session = getAuthSession();
    if (!session) return;

    if (window.sessionStorage.getItem(REDIRECT_FLAG_KEY) === '1') return;

    const shouldRedirect = isReloadNavigation() && location.pathname !== '/';
    window.sessionStorage.setItem(REDIRECT_FLAG_KEY, '1');

    if (shouldRedirect) {
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
}
