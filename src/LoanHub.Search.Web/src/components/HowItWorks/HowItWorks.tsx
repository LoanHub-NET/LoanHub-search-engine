import './HowItWorks.css';

interface Step {
  number: number;
  icon: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: '🔍',
    title: 'Enter Your Requirements',
    description: 'Start with a quick anonymous search by entering just the loan amount and duration. No registration needed for initial results.',
  },
  {
    number: 2,
    icon: '📊',
    title: 'Compare Offers Instantly',
    description: 'We query multiple banks simultaneously and show you the best offers within seconds. Compare installments from at least 3 different providers.',
  },
  {
    number: 3,
    icon: '🎯',
    title: 'Refine Your Search',
    description: 'Select an offer to see personalized rates. Provide additional details like income, expenses, and dependents for more accurate calculations.',
  },
  {
    number: 4,
    icon: '✅',
    title: 'Apply & Get Approved',
    description: 'Complete your application with personal details. Track your status, receive notifications, and finalize your loan – all in one place.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="how-it-works">
      <div className="how-it-works-container">
        <div className="section-header">
          <span className="section-badge">Simple Process</span>
          <h2 className="section-title">How LoanHub Works</h2>
          <p className="section-subtitle">
            Finding the best loan has never been easier. Follow these simple steps 
            to compare offers and get the financing you need.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((step, index) => (
            <div key={step.number} className="step-card">
              <div className="step-connector">
                {index < steps.length - 1 && <div className="connector-line"></div>}
              </div>
              <div className="step-icon">{step.icon}</div>
              <div className="step-number">Step {step.number}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h4 className="feature-title">Lightning Fast</h4>
            <p className="feature-description">
              Results in under 15 seconds from multiple providers
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h4 className="feature-title">Secure & Private</h4>
            <p className="feature-description">
              Anonymous search, no credit score impact for initial queries
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏦</div>
            <h4 className="feature-title">Multiple Banks</h4>
            <p className="feature-description">
              Compare offers from 3+ trusted financial institutions
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h4 className="feature-title">Track Anytime</h4>
            <p className="feature-description">
              Monitor your applications and get real-time updates
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
