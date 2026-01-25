import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage, SearchPage, SearchResultsPage } from './pages';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/search/results" element={<SearchResultsPage />} />
          {/* Future routes */}
          <Route path="/login" element={<LoginPlaceholder />} />
          <Route path="/apply" element={<ApplyPlaceholder />} />
          <Route path="/search/refine" element={<RefinePlaceholder />} />
          <Route path="*" element={<NotFoundPlaceholder />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

// Placeholder components for future implementation
function LoginPlaceholder() {
  return (
    <div className="placeholder-page">
      <h1>Login Page</h1>
      <p>Authentication with Azure AD, Google, Facebook coming soon...</p>
      <a href="/">← Back to Home</a>
    </div>
  );
}

function ApplyPlaceholder() {
  return (
    <div className="placeholder-page">
      <h1>Application Page</h1>
      <p>Loan application form coming soon...</p>
      <a href="/search/results">← Back to Results</a>
    </div>
  );
}

function RefinePlaceholder() {
  return (
    <div className="placeholder-page">
      <h1>Refine Your Search</h1>
      <p>Add income details for personalized rates coming soon...</p>
      <a href="/search/results">← Back to Results</a>
    </div>
  );
}

function NotFoundPlaceholder() {
  return (
    <div className="placeholder-page">
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/">← Back to Home</a>
    </div>
  );
}

export default App;
