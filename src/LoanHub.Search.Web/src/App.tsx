import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  LandingPage,
  SearchPage,
  SearchResultsPage,
  LoanApplicationPage,
  CareersPage,
  AboutPage,
  ContactPage,
  PartnersPage,
  PrivacyPage,
  TermsPage,
  CookiesPage,
  GdprPage,
  LoginPage,
  AdminDashboardPage,
  UserDashboardPage,
} from './pages';
import { ProtectedRoute } from './components';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Search routes - guests and users allowed, admins blocked */}
          <Route 
            path="/search" 
            element={
              <ProtectedRoute allowedRole="notAdmin">
                <SearchPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/search/results" 
            element={
              <ProtectedRoute allowedRole="notAdmin">
                <SearchResultsPage />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="/gdpr" element={<GdprPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Admin-only routes - regular users cannot access */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRole="Admin">
                <AdminDashboardPage />
              </ProtectedRoute>
            } 
          />
          
          {/* User-only routes - admins cannot access */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRole="User">
                <UserDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/apply" 
            element={
              <ProtectedRoute allowedRole="User">
                <LoanApplicationPage />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/search/refine" element={<RefinePlaceholder />} />
          <Route path="*" element={<NotFoundPlaceholder />} />
        </Routes>
      </div>
    </BrowserRouter>
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
