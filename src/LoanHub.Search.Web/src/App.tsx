import { useState, useEffect } from 'react';
import { Header, HeroSection, HowItWorks, Footer } from './components';
import './App.css';

function App() {
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
    // TODO: Navigate to search results page with these parameters
    console.log('Quick search:', { amount, duration });
    alert(`Searching for loans: $${amount.toLocaleString()} over ${duration} months\n\nThis will navigate to the search results page.`);
  };

  const handleLoginClick = () => {
    // TODO: Implement login modal or navigate to login page
    console.log('Login clicked');
    alert('Login functionality will open authentication options:\n- Azure AD\n- Google\n- Facebook\n- Custom registration');
  };

  const handleSearchClick = () => {
    // TODO: Navigate to full search engine page
    console.log('Search engine clicked');
    alert('This will navigate to the full search engine with additional fields:\n- Monthly income\n- Living costs\n- Number of dependents');
  };

  return (
    <div className="app">
      <Header onLoginClick={handleLoginClick} onSearchClick={handleSearchClick} />
      <main>
        <HeroSection onQuickSearch={handleQuickSearch} successCount={successCount} />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}

export default App;
