import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, HeroSection, HowItWorks, Footer } from '../../components';
import { clearAuthSession, getAuthSession } from '../../api/apiConfig';

export function LandingPage() {
  const navigate = useNavigate();
  
  // Simulated counter - in production, this would come from an API
  const [successCount, setSuccessCount] = useState(12847);
  const [authSession, setAuthSession] = useState(getAuthSession());

  // Simulate counter incrementing occasionally for a dynamic feel
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setSuccessCount((prev) => prev + 1);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setAuthSession(getAuthSession());
  }, []);

  const adminUser = useMemo(() => {
    if (!authSession) return undefined;
    const displayName =
      `${authSession.firstName ?? ''} ${authSession.lastName ?? ''}`.trim() || authSession.email;
    return {
      name: displayName,
      email: authSession.email,
      role: authSession.role,
    };
  }, [authSession]);

  const handleQuickSearch = (amount: number, duration: number) => {
    // Navigate to search results with query parameters
    navigate(`/search/results?amount=${amount}&duration=${duration}`);
  };

  const handleLoginClick = () => {
    // TODO: Implement login modal or navigate to login page
    navigate('/login');
  };

  const handleSearchClick = () => {
    // Navigate to full search engine page
    navigate('/search');
  };

  const handleLogout = () => {
    clearAuthSession();
    setAuthSession(null);
    navigate('/login');
  };

  return (
    <>
      <Header
        onLoginClick={handleLoginClick}
        onSearchClick={handleSearchClick}
        adminUser={adminUser}
        onLogout={handleLogout}
      />
      <main>
        <HeroSection onQuickSearch={handleQuickSearch} successCount={successCount} />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}
