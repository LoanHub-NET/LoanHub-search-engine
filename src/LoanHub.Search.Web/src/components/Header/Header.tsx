import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/LoanHub_logo.png';
import './Header.css';

export interface AdminUser {
  name: string;
  email: string;
  role: string | number;
  avatar?: string;
}

/**
 * Converts role to human-readable display string
 */
const getRoleDisplayName = (role: string | number): string => {
  if (role === 1 || role === '1' || role === 'Admin' || role === 'Administrator') {
    return 'Administrator';
  }
  return 'User';
};

/**
 * Checks if role represents an admin
 */
const isAdminRole = (role: string | number): boolean => {
  return role === 1 || role === '1' || role === 'Admin' || role === 'Administrator';
};

interface HeaderProps {
  onLoginClick: () => void;
  onSearchClick: () => void;
  adminUser?: AdminUser;
  onLogout?: () => void;
}

export function Header({ onLoginClick, onSearchClick, adminUser, onLogout }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLLIElement>(null);
  const navigate = useNavigate();

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHowItWorksClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const target = document.getElementById('how-it-works');
    if (window.location.pathname === '/' && target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    navigate('/#how-it-works');
  };

  return (
    <header className="header">
      <div className="header-container">
        <a
          className="logo"
          href="/"
          aria-label="LoanHub home"
          title="LoanHub home"
          style={{ backgroundImage: `url(${logo})` }}
        />

        <button 
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${menuOpen ? 'open' : ''}`}></span>
        </button>

        <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
          <ul className="nav-list">
            {/* Hide How it works and Search for admin users */}
            {(!adminUser || !isAdminRole(adminUser.role)) && (
              <>
                <li>
                  <a
                    href="/#how-it-works"
                    className="nav-link"
                    onClick={handleHowItWorksClick}
                  >
                    How it works
                  </a>
                </li>
                <li>
                  <button onClick={onSearchClick} className="nav-link nav-button">
                    Search Engine
                  </button>
                </li>
              </>
            )}
            {adminUser ? (
              <li className="user-menu-container" ref={userMenuRef}>
                <button 
                  className="user-menu-trigger"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                >
                  <div className="user-avatar">
                    {adminUser.avatar ? (
                      <img src={adminUser.avatar} alt={adminUser.name} />
                    ) : (
                      <span>{adminUser.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{adminUser.name}</span>
                    <span className="user-role">{getRoleDisplayName(adminUser.role)}</span>
                  </div>
                  <span className={`dropdown-arrow ${userMenuOpen ? 'open' : ''}`}>▼</span>
                </button>
                
                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <div className="dropdown-avatar">
                        {adminUser.avatar ? (
                          <img src={adminUser.avatar} alt={adminUser.name} />
                        ) : (
                          <span>{adminUser.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="dropdown-user-info">
                        <span className="dropdown-name">{adminUser.name}</span>
                        <span className="dropdown-email">{adminUser.email}</span>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <ul className="dropdown-menu">
                      <li>
                        <button onClick={() => { 
                          setUserMenuOpen(false); 
                          const role = adminUser.role;
                          const isAdmin = role === 'Administrator' || role === 'Admin' || role === 1 || role === '1';
                          navigate(isAdmin ? '/admin' : '/dashboard'); 
                        }}>
                          📋 Dashboard
                        </button>
                      </li>
                    </ul>
                    <div className="dropdown-divider"></div>
                    <button className="logout-btn" onClick={() => { setUserMenuOpen(false); onLogout?.(); }}>
                      🚪 Logout
                    </button>
                  </div>
                )}
              </li>
            ) : (
              <li>
                <button onClick={onLoginClick} className="nav-link nav-button login-btn">
                  Login
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
