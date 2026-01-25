import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/LoanHub_logo.png';
import './Header.css';

interface HeaderProps {
  onLoginClick: () => void;
  onSearchClick: () => void;
}

export function Header({ onLoginClick, onSearchClick }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

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
