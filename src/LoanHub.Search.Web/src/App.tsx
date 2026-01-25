import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  LandingPage,
  SearchPage,
  SearchResultsPage,
  CareersPage,
  AboutPage,
  ContactPage,
  PartnersPage,
  PrivacyPage,
  TermsPage,
  CookiesPage,
  GdprPage,
  LoginPage,
} from './pages';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/search/results" element={<SearchResultsPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="/gdpr" element={<GdprPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/apply" element={<ApplyPlaceholder />} />
          <Route path="/search/refine" element={<RefinePlaceholder />} />
          <Route path="*" element={<NotFoundPlaceholder />} />
        </Routes>
      </div>
    </BrowserRouter>
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
