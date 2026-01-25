import { useState } from 'react';
import './Header.css';

interface HeaderProps {
  onLoginClick: () => void;
  onSearchClick: () => void;
}

export function Header({ onLoginClick, onSearchClick }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-container">
        <a href="/" className="logo">
          <span className="logo-icon">💰</span>
          <span className="logo-text">LoanHub</span>
        </a>

        <button 
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${menuOpen ? 'open' : ''}`}></span>
        </button>

        <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
          <ul className="nav-list">
            <li>
              <a href="#how-it-works" className="nav-link">How it works</a>
            </li>
            <li>
              <button onClick={onSearchClick} className="nav-link nav-button">
                Search Engine
              </button>
            </li>
            <li>
              <button onClick={onLoginClick} className="nav-link nav-button login-btn">
                Login
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
