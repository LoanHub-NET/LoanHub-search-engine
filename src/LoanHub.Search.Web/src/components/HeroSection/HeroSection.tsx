import { useState, type FormEvent } from 'react';
import './HeroSection.css';

interface HeroSectionProps {
  onQuickSearch: (amount: number, duration: number) => void;
  successCount: number;
}

export function HeroSection({ onQuickSearch, successCount }: HeroSectionProps) {
  const [amount, setAmount] = useState<string>('10000');
  const [duration, setDuration] = useState<string>('12');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    const parsedDuration = parseInt(duration);
    
    if (parsedAmount > 0 && parsedDuration > 0) {
      onQuickSearch(parsedAmount, parsedDuration);
    }
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  return (
    <section className="hero">
      <div className="hero-background">
        <div className="hero-shape hero-shape-1"></div>
        <div className="hero-shape hero-shape-2"></div>
        <div className="hero-shape hero-shape-3"></div>
      </div>
      
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            Find Your Perfect <span className="highlight">Loan</span> in Seconds
          </h1>
          <p className="hero-subtitle">
            Compare offers from multiple banks instantly. No registration needed for 
            quick search – just enter the amount you need and see your options.
          </p>
          
          <div className="success-counter">
            <div className="counter-icon">🎉</div>
            <div className="counter-text">
              <span className="counter-number">{formatNumber(successCount)}</span>
              <span className="counter-label">people have already found their best loan</span>
            </div>
          </div>
        </div>

        <div className="hero-form-container">
          <div className="quick-search-card">
            <h2 className="form-title">Quick Anonymous Search</h2>
            <p className="form-subtitle">See offers in seconds – no account required</p>
            
            <form onSubmit={handleSubmit} className="quick-search-form">
              <div className="form-group">
                <label htmlFor="amount" className="form-label">
                  Loan Amount
                </label>
                <div className="input-wrapper">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="100"
                    max="1000000"
                    step="100"
                    className="form-input"
                    placeholder="10,000"
                    required
                  />
                </div>
                <div className="amount-presets">
                  {[5000, 10000, 25000, 50000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`preset-btn ${amount === preset.toString() ? 'active' : ''}`}
                      onClick={() => setAmount(preset.toString())}
                    >
                      ${formatNumber(preset)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="duration" className="form-label">
                  Duration (months)
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="1"
                    max="360"
                    className="form-input"
                    placeholder="12"
                    required
                  />
                  <span className="input-suffix">months</span>
                </div>
                <div className="duration-presets">
                  {[6, 12, 24, 36, 60].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`preset-btn ${duration === preset.toString() ? 'active' : ''}`}
                      onClick={() => setDuration(preset.toString())}
                    >
                      {preset}m
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="search-btn">
                <span>Find Best Offers</span>
                <svg 
                  className="search-icon" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </form>

            <p className="form-disclaimer">
              🔒 Your search is anonymous. We don't store any personal data.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
