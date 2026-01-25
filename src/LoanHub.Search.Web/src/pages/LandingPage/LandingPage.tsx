import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { HeroSection } from '../../components/HeroSection';
import { HowItWorks } from '../../components/HowItWorks';
import { Footer } from '../../components/Footer';

export function LandingPage() {
  const navigate = useNavigate();
  
  // Simulated counter - in production, this would come from an API
  const [successCount, setSuccessCount] = useState(12847);

  // Simulate counter incrementing occasionally for a dynamic feel
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setSuccessCount((prev) => prev + 1);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <>
      <Header onLoginClick={handleLoginClick} onSearchClick={handleSearchClick} />
      <main>
        <HeroSection onQuickSearch={handleQuickSearch} successCount={successCount} />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}
