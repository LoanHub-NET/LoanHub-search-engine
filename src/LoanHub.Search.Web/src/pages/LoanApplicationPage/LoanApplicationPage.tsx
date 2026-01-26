import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { createApplication, createApplicationForCurrentUser } from '../../api/applicationsApi';
import {
  ApiError,
  clearAuthSession,
  getAuthSession,
  storePendingProfile,
} from '../../api/apiConfig';
import { updateUserProfile } from '../../api/userApi';
import type { 
  ApplicationStep, 
  ApplicationFormData,
  ApplicationOffer,
  PersonalInfoData,
  EmploymentData,
  DocumentData,
  PersonalizationData 
} from '../../types/application.types';
import { 
  APPLICATION_STEPS, 
  INITIAL_APPLICATION_DATA
} from '../../types/application.types';
import './LoanApplicationPage.css';

const parseAddress = (address?: string | null) => {
  if (!address) {
    return null;
  }
  const parts = address.split(',').map(part => part.trim()).filter(Boolean);
  if (parts.length === 0) {
    return null;
  }

  const hasApartment = parts[1]?.toLowerCase().startsWith('apt ');
  const street = parts[0] ?? '';
  const apartment = hasApartment ? parts[1].replace(/^apt\s+/i, '').trim() : '';
  const cityPostal = hasApartment ? parts[2] : parts[1];
  const country = parts[parts.length - 1];

  let postalCode = '';
  let city = '';
  if (cityPostal) {
    const match = cityPostal.match(/(\d{2}-\d{3})\s*(.*)/);
    if (match) {
      postalCode = match[1];
      city = match[2]?.trim() ?? '';
    } else {
      city = cityPostal.trim();
    }
  }

  return {
    street,
    apartment,
    city,
    postalCode,
    country,
  };
};

// Mock generate offer function (same as SearchResultsPage)
const generateMockOffer = (amount: number, duration: number, provider: { name: string; logo: string }): ApplicationOffer => {
  const baseRate = 7.5 + Math.random() * 5;
  const rate = parseFloat(baseRate.toFixed(2));
  const monthlyRate = rate / 100 / 12;
  const installment = amount * (monthlyRate * Math.pow(1 + monthlyRate, duration)) / (Math.pow(1 + monthlyRate, duration) - 1);
  const totalPayment = installment * duration;
  const totalInterest = totalPayment - amount;

  return {
    id: `${provider.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
    providerName: provider.name,
    providerLogo: provider.logo,
    amount,
    duration,
    interestRate: rate,
    apr: parseFloat((rate + 0.5 + Math.random() * 0.5).toFixed(2)),
    monthlyInstallment: parseFloat(installment.toFixed(2)),
    totalRepayment: parseFloat(totalPayment.toFixed(2)),
    totalInterest: parseFloat(totalInterest.toFixed(2)),
    processingTime: `${Math.floor(Math.random() * 3) + 1} business days`,
  };
};

const MOCK_PROVIDERS = [
  { name: 'First National Bank', logo: '🏦' },
  { name: 'Metro Credit Union', logo: '🏛️' },
  { name: 'Digital Finance Co.', logo: '💳' },
  { name: 'Summit Trust', logo: '🏔️' },
  { name: 'Harborline Bank', logo: '⚓' },
];

export function LoanApplicationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get initial offer from location state
  const initialOffer = (location.state?.offer as ApplicationOffer | undefined) || null;
  
  const [authSession, setAuthSession] = useState(getAuthSession());
  const isLoggedIn = Boolean(authSession?.token);
  
  // Current step
  const [currentStep, setCurrentStep] = useState<ApplicationStep>('offer-details');
  const [completedSteps, setCompletedSteps] = useState<Set<ApplicationStep>>(new Set());
  
  // Form data - initialize with offer from location state
  const [formData, setFormData] = useState<ApplicationFormData>(() => ({
    ...INITIAL_APPLICATION_DATA,
    offer: initialOffer,
  }));
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    referenceNumber: string;
    message: string;
  } | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  // Load offer from URL params if not from location state
  useEffect(() => {
    // Skip if we already have an offer from location state
    if (initialOffer) {
      return;
    }
    
    // Otherwise generate from URL params
    const amountParam = searchParams.get('amount');
    const durationParam = searchParams.get('duration');
    const providerParam = searchParams.get('provider');
    
    if (amountParam && durationParam) {
      const amount = parseInt(amountParam, 10);
      const duration = parseInt(durationParam, 10);
      const provider = MOCK_PROVIDERS.find(p => p.name === providerParam) || MOCK_PROVIDERS[0];
      
      const offer = generateMockOffer(amount, duration, provider);
      setFormData(prev => ({ ...prev, offer }));
    }
  }, [initialOffer, searchParams]);
  
  // Auto-fill user data if logged in
  useEffect(() => {
    if (isLoggedIn) {
      const firstName = authSession?.firstName ?? '';
      const lastName = authSession?.lastName ?? '';
      const email = authSession?.email ?? '';
      const jobTitle = authSession?.jobTitle ?? '';
      const monthlyIncome = authSession?.monthlyIncome ?? null;
      const livingCosts = authSession?.livingCosts ?? null;
      const dependents = authSession?.dependents ?? null;
      setFormData(prev => ({
        ...prev,
        authMode: 'logged-in',
        personalInfo: {
          ...prev.personalInfo,
          firstName,
          lastName,
          email,
          phone: authSession?.phone ?? prev.personalInfo.phone,
          dateOfBirth: authSession?.dateOfBirth ?? prev.personalInfo.dateOfBirth,
        },
        employment: {
          ...prev.employment,
          position: jobTitle || prev.employment.position,
          monthlyIncome: monthlyIncome !== null ? String(monthlyIncome) : prev.employment.monthlyIncome,
          livingCosts: livingCosts !== null ? String(livingCosts) : prev.employment.livingCosts,
          dependents: dependents !== null ? String(dependents) : prev.employment.dependents,
        },
        documents: {
          ...prev.documents,
          idFrontFile: undefined,
          idBackFile: undefined,
          additionalDocs: undefined,
          idNumber: authSession?.idDocumentNumber ?? prev.documents.idNumber,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        authMode: 'guest',
      }));
    }
  }, [authSession, isLoggedIn]);

  useEffect(() => {
    setAuthSession(getAuthSession());
  }, []);
  
  // Get current step index
  const currentStepIndex = APPLICATION_STEPS.findIndex(s => s.id === currentStep);
  
  // Navigate to next step
  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < APPLICATION_STEPS.length) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(APPLICATION_STEPS[nextIndex].id);
      window.scrollTo(0, 0);
    }
  };
  
  // Navigate to previous step
  const goToPrevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(APPLICATION_STEPS[prevIndex].id);
      window.scrollTo(0, 0);
    }
  };
  
  // Go to specific step
  const goToStep = (step: ApplicationStep) => {
    const stepIndex = APPLICATION_STEPS.findIndex(s => s.id === step);
    // Can only go to completed steps or current step
    if (stepIndex <= currentStepIndex || completedSteps.has(step)) {
      setCurrentStep(step);
      window.scrollTo(0, 0);
    }
  };
  
  // Update form data
  const updatePersonalInfo = (data: Partial<PersonalInfoData>) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...data },
    }));
  };
  
  const updateEmployment = (data: Partial<EmploymentData>) => {
    setFormData(prev => ({
      ...prev,
      employment: { ...prev.employment, ...data },
    }));
  };
  
  const updateDocuments = (data: Partial<DocumentData>) => {
    setFormData(prev => ({
      ...prev,
      documents: { ...prev.documents, ...data },
    }));
  };
  
  const updatePersonalization = (data: Partial<PersonalizationData>) => {
    setFormData(prev => ({
      ...prev,
      personalization: { ...prev.personalization, ...data },
    }));
  };
  
  const updateConsents = (key: keyof ApplicationFormData['consents'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      consents: { ...prev.consents, [key]: value },
    }));
  };
  
  // Apply personalization to get better rate
  const applyPersonalization = () => {
    if (!formData.offer) return;
    
    const { monthlyIncome, livingCosts, dependents } = formData.personalization;
    if (!monthlyIncome || !livingCosts) return;
    
    // Calculate DTI (Debt-to-Income ratio)
    const income = parseFloat(monthlyIncome);
    const costs = parseFloat(livingCosts);
    const depsCount = parseInt(dependents, 10);
    
    const disposableIncome = income - costs - (depsCount * 500);
    const dti = formData.offer.monthlyInstallment / income;
    
    // Better DTI = better rate discount
    let rateDiscount = 0;
    if (dti < 0.2) rateDiscount = 1.5;
    else if (dti < 0.3) rateDiscount = 1.0;
    else if (dti < 0.4) rateDiscount = 0.5;
    
    if (disposableIncome > 5000) rateDiscount += 0.5;
    if (disposableIncome > 10000) rateDiscount += 0.5;
    
    // Update offer with personalized rate
    const newRate = Math.max(formData.offer.interestRate - rateDiscount, 5);
    const monthlyRate = newRate / 100 / 12;
    const amount = formData.offer.amount;
    const duration = formData.offer.duration;
    const newInstallment = amount * (monthlyRate * Math.pow(1 + monthlyRate, duration)) / (Math.pow(1 + monthlyRate, duration) - 1);
    const newTotalPayment = newInstallment * duration;
    const newTotalInterest = newTotalPayment - amount;
    
    setFormData(prev => ({
      ...prev,
      isPersonalized: true,
      offer: prev.offer ? {
        ...prev.offer,
        interestRate: parseFloat(newRate.toFixed(2)),
        apr: parseFloat((newRate + 0.5).toFixed(2)),
        monthlyInstallment: parseFloat(newInstallment.toFixed(2)),
        totalRepayment: parseFloat(newTotalPayment.toFixed(2)),
        totalInterest: parseFloat(newTotalInterest.toFixed(2)),
      } : null,
    }));
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.offer) {
      setSubmissionError('Missing offer data. Please select an offer again.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    const submitAsGuest = async () => {
      const personalInfo = formData.personalInfo;
      const employment = formData.employment;
      const documents = formData.documents;

      const dateOfBirth = personalInfo.dateOfBirth ? new Date(personalInfo.dateOfBirth) : null;
      const age = dateOfBirth && !Number.isNaN(dateOfBirth.getTime())
        ? Math.max(0, new Date().getFullYear() - dateOfBirth.getFullYear())
        : null;

      const addressParts = [
        personalInfo.address.street,
        personalInfo.address.apartment ? `Apt ${personalInfo.address.apartment}` : '',
        personalInfo.address.postalCode && personalInfo.address.city
          ? `${personalInfo.address.postalCode} ${personalInfo.address.city}`
          : personalInfo.address.city,
        personalInfo.address.country,
      ].filter(Boolean);
      const address = addressParts.join(', ');

      if (!personalInfo.email || !personalInfo.firstName || !personalInfo.lastName) {
        throw new Error('Please provide your name and email before submitting.');
      }

      if (!age || age <= 0) {
        throw new Error('Please provide a valid date of birth.');
      }

      if (!employment.position && !employment.employerName) {
        throw new Error('Please provide your job title or employer.');
      }

      if (!documents.idNumber) {
        throw new Error('Please provide your ID document number.');
      }

      const offer = formData.offer!;
      const validUntil = offer.validUntil ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const response = await createApplication({
        applicantEmail: personalInfo.email,
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        age,
        jobTitle: employment.position || employment.employerName || 'Applicant',
        address,
        idDocumentNumber: documents.idNumber,
        phone: personalInfo.phone || undefined,
        dateOfBirth: personalInfo.dateOfBirth || undefined,
        monthlyIncome: employment.monthlyIncome ? Number(employment.monthlyIncome) : undefined,
        livingCosts: employment.livingCosts ? Number(employment.livingCosts) : undefined,
        dependents: employment.dependents ? Number(employment.dependents) : undefined,
        provider: offer.providerName,
        providerOfferId: offer.id,
        installment: offer.monthlyInstallment,
        apr: offer.apr,
        totalCost: offer.totalRepayment,
        amount: offer.amount,
        durationMonths: offer.duration,
        validUntil: validUntil.toISOString(),
      });

      storePendingProfile({
        email: personalInfo.email,
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        phone: personalInfo.phone,
        dateOfBirth: personalInfo.dateOfBirth,
        address,
        jobTitle: employment.position || employment.employerName || undefined,
        monthlyIncome: employment.monthlyIncome ? Number(employment.monthlyIncome) : undefined,
        livingCosts: employment.livingCosts ? Number(employment.livingCosts) : undefined,
        dependents: employment.dependents ? Number(employment.dependents) : undefined,
        idDocumentNumber: documents.idNumber || undefined,
      });

      return response.id;
    };

    try {
      const personalInfo = formData.personalInfo;
      const employment = formData.employment;
      const documents = formData.documents;

      const dateOfBirth = personalInfo.dateOfBirth ? new Date(personalInfo.dateOfBirth) : null;
      const age = dateOfBirth && !Number.isNaN(dateOfBirth.getTime())
        ? Math.max(0, new Date().getFullYear() - dateOfBirth.getFullYear())
        : null;

      const addressParts = [
        personalInfo.address.street,
        personalInfo.address.apartment ? `Apt ${personalInfo.address.apartment}` : '',
        personalInfo.address.postalCode && personalInfo.address.city
          ? `${personalInfo.address.postalCode} ${personalInfo.address.city}`
          : personalInfo.address.city,
        personalInfo.address.country,
      ].filter(Boolean);
      const address = addressParts.join(', ');

      const offer = formData.offer;
      const validUntil = offer.validUntil ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      let referenceId: string;

      if (authSession?.id && isLoggedIn) {
        try {
          const updatedProfile = await updateUserProfile(authSession.id, {
            firstName: personalInfo.firstName,
            lastName: personalInfo.lastName,
            age: age ?? null,
            jobTitle: employment.position || employment.employerName || null,
            address,
            phone: personalInfo.phone || null,
            dateOfBirth: personalInfo.dateOfBirth || null,
            monthlyIncome: employment.monthlyIncome ? Number(employment.monthlyIncome) : null,
            livingCosts: employment.livingCosts ? Number(employment.livingCosts) : null,
            dependents: employment.dependents ? Number(employment.dependents) : null,
            idDocumentNumber: documents.idNumber || null,
          });
          setAuthSession({
            id: updatedProfile.id,
            email: updatedProfile.email,
            role: updatedProfile.role,
            firstName: updatedProfile.firstName,
            lastName: updatedProfile.lastName,
            phone: updatedProfile.phone,
            dateOfBirth: updatedProfile.dateOfBirth,
            address: updatedProfile.address,
            jobTitle: updatedProfile.jobTitle,
            monthlyIncome: updatedProfile.monthlyIncome,
            livingCosts: updatedProfile.livingCosts,
            dependents: updatedProfile.dependents,
            idDocumentNumber: updatedProfile.idDocumentNumber,
            token: updatedProfile.token,
          });

          const response = await createApplicationForCurrentUser({
            provider: offer.providerName,
            providerOfferId: offer.id,
            installment: offer.monthlyInstallment,
            apr: offer.apr,
            totalCost: offer.totalRepayment,
            amount: offer.amount,
            durationMonths: offer.duration,
            validUntil: validUntil.toISOString(),
          });

          referenceId = response.id;
        } catch (err: unknown) {
          if (err instanceof ApiError && err.status === 401) {
            clearAuthSession();
            setAuthSession(null);
            referenceId = await submitAsGuest();
          } else {
            throw err;
          }
        }
      } else {
        referenceId = await submitAsGuest();
      }

      setSubmissionResult({
        success: true,
        referenceNumber: referenceId,
        message: 'Your application has been submitted successfully!',
      });

      setCompletedSteps(prev => new Set([...prev, 'review']));
      setCurrentStep('submitted');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'We could not submit your application.';
      setSubmissionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // No offer selected
  if (!formData.offer && currentStep === 'offer-details') {
    return (
      <div className="application-page-wrapper">
        <Header onLoginClick={() => navigate('/login')} onSearchClick={() => navigate('/search')} />
        <div className="application-page">
          <div className="application-container">
            <div className="no-offer-card">
              <div className="no-offer-icon">🔍</div>
              <h2>No Offer Selected</h2>
              <p>Please search for loans and select an offer to continue with your application.</p>
              <button className="btn-primary" onClick={() => navigate('/search')}>
                Search for Loans
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Submission complete
  if (currentStep === 'submitted' && submissionResult) {
    return (
      <div className="application-page-wrapper">
        <Header onLoginClick={() => navigate('/login')} onSearchClick={() => navigate('/search')} />
        <div className="application-page">
          <div className="application-container">
            <div className="submission-success-card">
              <div className="success-icon">✅</div>
              <h2>Application Submitted!</h2>
              <p className="success-message">{submissionResult.message}</p>
              
              <div className="reference-number">
                <span className="reference-label">Reference Number</span>
                <span className="reference-value">{submissionResult.referenceNumber}</span>
              </div>
              
              <div className="next-steps">
                <h3>What happens next?</h3>
                <ol>
                  <li>Your application is now being reviewed by {formData.offer?.providerName}</li>
                  <li>You'll receive an email confirmation shortly</li>
                  <li>The lender will contact you within {formData.offer?.processingTime || '1-3 business days'}</li>
                  <li>Once approved, you'll be able to sign your contract digitally</li>
                </ol>
              </div>
              
              <div className="submission-actions">
                {isLoggedIn ? (
                  <button className="btn-primary" onClick={() => navigate('/dashboard')}>
                    View in Dashboard
                  </button>
                ) : (
                  <>
                    <button
                      className="btn-primary"
                      onClick={() =>
                        navigate('/login?mode=register', {
                          state: {
                            prefill: {
                              firstName: formData.personalInfo.firstName,
                              lastName: formData.personalInfo.lastName,
                              email: formData.personalInfo.email,
                              phone: formData.personalInfo.phone,
                            },
                          },
                        })
                      }
                    >
                      Create Account to Track
                    </button>
                    <button className="btn-secondary" onClick={() => navigate('/')}>
                      Return Home
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="application-page-wrapper">
      <Header onLoginClick={() => navigate('/login')} onSearchClick={() => navigate('/search')} />
      <div className="application-page">
        <div className="application-container">
          {/* Progress Steps */}
          <div className="steps-progress">
            {APPLICATION_STEPS.map((step, index) => {
              const isCompleted = completedSteps.has(step.id);
              const isCurrent = currentStep === step.id;
              const isClickable = isCompleted || isCurrent;
            
            return (
              <div 
                key={step.id}
                className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isClickable ? 'clickable' : ''}`}
                onClick={() => isClickable && goToStep(step.id)}
              >
                <div className="step-indicator">
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div className="step-info">
                  <span className="step-title">{step.title}</span>
                  <span className="step-description">{step.description}</span>
                </div>
                {index < APPLICATION_STEPS.length - 1 && <div className="step-connector" />}
              </div>
            );
          })}
        </div>
        
        {/* Step Content */}
        <div className="step-content">
          {/* Step 1: Offer Details */}
          {currentStep === 'offer-details' && formData.offer && (
            <OfferDetailsStep 
              offer={formData.offer}
              isPersonalized={formData.isPersonalized}
              onChangeOffer={() => navigate('/search/results')}
              onNext={goToNextStep}
            />
          )}
          
          {/* Step 2: Personalization */}
          {currentStep === 'personalize' && formData.offer && (
            <PersonalizeStep
              offer={formData.offer}
              data={formData.personalization}
              isPersonalized={formData.isPersonalized}
              onChange={updatePersonalization}
              onApply={applyPersonalization}
              onNext={goToNextStep}
              onBack={goToPrevStep}
            />
          )}
          
          {/* Step 3: Personal Info */}
          {currentStep === 'personal-info' && (
            <PersonalInfoStep
              data={formData.personalInfo}
              isLoggedIn={isLoggedIn}
              onChange={updatePersonalInfo}
              onNext={goToNextStep}
              onBack={goToPrevStep}
            />
          )}
          
          {/* Step 4: Employment */}
          {currentStep === 'employment' && (
            <EmploymentStep
              data={formData.employment}
              onChange={updateEmployment}
              onNext={goToNextStep}
              onBack={goToPrevStep}
            />
          )}
          
          {/* Step 5: Documents */}
          {currentStep === 'documents' && (
            <DocumentsStep
              data={formData.documents}
              onChange={updateDocuments}
              onNext={goToNextStep}
              onBack={goToPrevStep}
            />
          )}
          
          {/* Step 6: Review */}
          {currentStep === 'review' && formData.offer && (
            <ReviewStep
              formData={formData}
              consents={formData.consents}
              submissionError={submissionError}
              onUpdateConsents={updateConsents}
              onSubmit={handleSubmit}
              onBack={goToPrevStep}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}

// ============ Step Components ============

interface OfferDetailsStepProps {
  offer: ApplicationOffer;
  isPersonalized: boolean;
  onChangeOffer: () => void;
  onNext: () => void;
}

function OfferDetailsStep({ offer, isPersonalized, onChangeOffer, onNext }: OfferDetailsStepProps) {
  // Defensive: ensure all numeric fields have values
  const amount = offer.amount ?? 0;
  const duration = offer.duration ?? 0;
  const interestRate = offer.interestRate ?? 0;
  const apr = offer.apr ?? 0;
  const monthlyInstallment = offer.monthlyInstallment ?? 0;
  const totalRepayment = offer.totalRepayment ?? 0;
  const totalInterest = offer.totalInterest ?? (totalRepayment - amount);

  return (
    <div className="step-card">
      <div className="step-header">
        <h2>Review Your Selected Offer</h2>
        <p>Please review the loan details below before proceeding</p>
      </div>
      
      <div className="offer-review-card">
        <div className="offer-provider">
          <span className="provider-logo">{offer.providerLogo}</span>
          <span className="provider-name">{offer.providerName}</span>
          {isPersonalized && <span className="personalized-badge">Personalized</span>}
        </div>
        
        <div className="offer-details-grid">
          <div className="offer-detail">
            <span className="detail-label">Loan Amount</span>
            <span className="detail-value amount">{amount.toLocaleString()} PLN</span>
          </div>
          <div className="offer-detail">
            <span className="detail-label">Duration</span>
            <span className="detail-value">{duration} months</span>
          </div>
          <div className="offer-detail">
            <span className="detail-label">Interest Rate</span>
            <span className="detail-value rate">{interestRate}%</span>
          </div>
          <div className="offer-detail">
            <span className="detail-label">APR</span>
            <span className="detail-value">{apr}%</span>
          </div>
          <div className="offer-detail highlight">
            <span className="detail-label">Monthly Payment</span>
            <span className="detail-value">{monthlyInstallment.toLocaleString(undefined, { minimumFractionDigits: 2 })} PLN</span>
          </div>
          <div className="offer-detail">
            <span className="detail-label">Total Payment</span>
            <span className="detail-value">{totalRepayment.toLocaleString(undefined, { minimumFractionDigits: 2 })} PLN</span>
          </div>
          <div className="offer-detail">
            <span className="detail-label">Total Interest</span>
            <span className="detail-value">{totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })} PLN</span>
          </div>
          <div className="offer-detail">
            <span className="detail-label">Processing Time</span>
            <span className="detail-value">{offer.processingTime || '1-3 business days'}</span>
          </div>
        </div>
        
        <button className="btn-link change-offer-btn" onClick={onChangeOffer}>
          ← Change offer
        </button>
      </div>
      
      <div className="step-actions">
        <button className="btn-primary btn-lg" onClick={onNext}>
          Continue to Personalize Rate →
        </button>
      </div>
    </div>
  );
}

interface PersonalizeStepProps {
  offer: ApplicationOffer;
  data: PersonalizationData;
  isPersonalized: boolean;
  onChange: (data: Partial<PersonalizationData>) => void;
  onApply: () => void;
  onNext: () => void;
  onBack: () => void;
}

function PersonalizeStep({ offer, data, isPersonalized, onChange, onApply, onNext, onBack }: PersonalizeStepProps) {
  const canApply = data.monthlyIncome && data.livingCosts;
  
  return (
    <div className="step-card">
      <div className="step-header">
        <h2>Personalize Your Rate ✨</h2>
        <p>Provide some financial details to potentially get a better interest rate</p>
      </div>
      
      {isPersonalized && (
        <div className="personalized-success">
          <div className="success-icon-small">🎉</div>
          <div className="success-text">
            <strong>Rate personalized!</strong> Based on your financial profile, you qualify for a better rate.
          </div>
        </div>
      )}
      
      <div className="personalize-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="monthlyIncome">Monthly Net Income</label>
            <div className="input-with-prefix">
              <span className="input-prefix">PLN</span>
              <input
                id="monthlyIncome"
                type="number"
                className="form-input"
                placeholder="e.g., 8000"
                value={data.monthlyIncome}
                onChange={(e) => onChange({ monthlyIncome: e.target.value })}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="livingCosts">Monthly Living Costs</label>
            <div className="input-with-prefix">
              <span className="input-prefix">PLN</span>
              <input
                id="livingCosts"
                type="number"
                className="form-input"
                placeholder="e.g., 3500"
                value={data.livingCosts}
                onChange={(e) => onChange({ livingCosts: e.target.value })}
              />
            </div>
            <span className="input-hint">Rent, utilities, food, other regular expenses</span>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="dependents">Number of Dependents</label>
          <select
            id="dependents"
            className="form-select"
            value={data.dependents}
            onChange={(e) => onChange({ dependents: e.target.value })}
          >
            <option value="0">0 - No dependents</option>
            <option value="1">1 dependent</option>
            <option value="2">2 dependents</option>
            <option value="3">3 dependents</option>
            <option value="4">4+ dependents</option>
          </select>
        </div>
        
        {!isPersonalized && canApply && (
          <button className="btn-secondary personalize-btn" onClick={onApply}>
            ✨ Get Personalized Rate
          </button>
        )}
        
        {isPersonalized && (
          <div className="rate-comparison">
            <div className="comparison-item original">
              <span className="comparison-label">Original Rate</span>
              <span className="comparison-value">{(offer.interestRate + 1.5).toFixed(2)}%</span>
            </div>
            <div className="comparison-arrow">→</div>
            <div className="comparison-item new">
              <span className="comparison-label">Your Rate</span>
              <span className="comparison-value">{offer.interestRate}%</span>
            </div>
            <div className="savings-badge">
              Save up to {((offer.interestRate + 1.5 - offer.interestRate) * offer.amount / 100 * offer.duration / 12).toFixed(0)} PLN
            </div>
          </div>
        )}
      </div>
      
      <div className="step-actions">
        <button className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button className="btn-primary btn-lg" onClick={onNext}>
          Continue to Personal Info →
        </button>
      </div>
      
      <p className="step-skip-note">
        You can skip this step and continue with the standard rate.
      </p>
    </div>
  );
}

interface PersonalInfoStepProps {
  data: PersonalInfoData;
  isLoggedIn: boolean;
  onChange: (data: Partial<PersonalInfoData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function PersonalInfoStep({ data, isLoggedIn, onChange, onNext, onBack }: PersonalInfoStepProps) {
  const isValid = data.firstName && data.lastName && data.email && data.phone && data.dateOfBirth &&
    data.address.street && data.address.city && data.address.postalCode;
  
  return (
    <div className="step-card">
      <div className="step-header">
        <h2>Personal Information</h2>
        <p>Please provide your personal details for the loan application</p>
        {isLoggedIn && (
          <div className="autofill-notice">
            ✓ Information auto-filled from your account
          </div>
        )}
      </div>
      
      <div className="personal-info-form">
        <div className="form-section">
          <h3>Basic Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                id="firstName"
                type="text"
                className="form-input"
                value={data.firstName}
                onChange={(e) => onChange({ firstName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                id="lastName"
                type="text"
                className="form-input"
                value={data.lastName}
                onChange={(e) => onChange({ lastName: e.target.value })}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={data.email}
                onChange={(e) => onChange({ email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                id="phone"
                type="tel"
                className="form-input"
                value={data.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="dateOfBirth">Date of Birth *</label>
            <input
              id="dateOfBirth"
              type="date"
              className="form-input"
              value={data.dateOfBirth}
              onChange={(e) => onChange({ dateOfBirth: e.target.value })}
            />
          </div>
        </div>
        
        <div className="form-section">
          <h3>Address</h3>
          <div className="form-group">
            <label htmlFor="street">Street Address *</label>
            <input
              id="street"
              type="text"
              className="form-input"
              value={data.address.street}
              onChange={(e) => onChange({ address: { ...data.address, street: e.target.value } })}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="apartment">Apartment/Unit</label>
              <input
                id="apartment"
                type="text"
                className="form-input"
                value={data.address.apartment || ''}
                onChange={(e) => onChange({ address: { ...data.address, apartment: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="postalCode">Postal Code *</label>
              <input
                id="postalCode"
                type="text"
                className="form-input"
                value={data.address.postalCode}
                onChange={(e) => onChange({ address: { ...data.address, postalCode: e.target.value } })}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input
                id="city"
                type="text"
                className="form-input"
                value={data.address.city}
                onChange={(e) => onChange({ address: { ...data.address, city: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="country">Country</label>
              <input
                id="country"
                type="text"
                className="form-input"
                value={data.address.country}
                onChange={(e) => onChange({ address: { ...data.address, country: e.target.value } })}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="step-actions">
        <button className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button className="btn-primary btn-lg" onClick={onNext} disabled={!isValid}>
          Continue to Employment →
        </button>
      </div>
    </div>
  );
}

interface EmploymentStepProps {
  data: EmploymentData;
  onChange: (data: Partial<EmploymentData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function EmploymentStep({ data, onChange, onNext, onBack }: EmploymentStepProps) {
  const isValid = data.status && data.monthlyIncome && data.livingCosts;
  const showEmployerFields = data.status === 'employed' || data.status === 'self_employed';
  
  return (
    <div className="step-card">
      <div className="step-header">
        <h2>Employment & Financial Details</h2>
        <p>This information helps us verify your ability to repay the loan</p>
      </div>
      
      <div className="employment-form">
        <div className="form-section">
          <h3>Employment Status</h3>
          <div className="form-group">
            <label htmlFor="employmentStatus">Current Status *</label>
            <select
              id="employmentStatus"
              className="form-select"
              value={data.status}
              onChange={(e) => onChange({ status: e.target.value as EmploymentData['status'] })}
            >
              <option value="">Select your status</option>
              <option value="employed">Employed</option>
              <option value="self_employed">Self-employed</option>
              <option value="unemployed">Unemployed</option>
              <option value="retired">Retired</option>
              <option value="student">Student</option>
            </select>
          </div>
          
          {showEmployerFields && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="employerName">Employer / Company Name</label>
                  <input
                    id="employerName"
                    type="text"
                    className="form-input"
                    value={data.employerName || ''}
                    onChange={(e) => onChange({ employerName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="position">Position / Title</label>
                  <input
                    id="position"
                    type="text"
                    className="form-input"
                    value={data.position || ''}
                    onChange={(e) => onChange({ position: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="employedSince">Employed Since</label>
                  <input
                    id="employedSince"
                    type="date"
                    className="form-input"
                    value={data.employedSince || ''}
                    onChange={(e) => onChange({ employedSince: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contractType">Contract Type</label>
                  <select
                    id="contractType"
                    className="form-select"
                    value={data.contractType || ''}
                    onChange={(e) => onChange({ contractType: e.target.value as EmploymentData['contractType'] })}
                  >
                    <option value="">Select type</option>
                    <option value="permanent">Permanent</option>
                    <option value="temporary">Temporary</option>
                    <option value="contract">Contract/Freelance</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="form-section">
          <h3>Income & Expenses</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="monthlyIncomeEmp">Monthly Net Income *</label>
              <div className="input-with-prefix">
                <span className="input-prefix">PLN</span>
                <input
                  id="monthlyIncomeEmp"
                  type="number"
                  className="form-input"
                  value={data.monthlyIncome}
                  onChange={(e) => onChange({ monthlyIncome: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="additionalIncome">Additional Income</label>
              <div className="input-with-prefix">
                <span className="input-prefix">PLN</span>
                <input
                  id="additionalIncome"
                  type="number"
                  className="form-input"
                  placeholder="e.g., rental income"
                  value={data.additionalIncome || ''}
                  onChange={(e) => onChange({ additionalIncome: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="livingCostsEmp">Monthly Living Costs *</label>
              <div className="input-with-prefix">
                <span className="input-prefix">PLN</span>
                <input
                  id="livingCostsEmp"
                  type="number"
                  className="form-input"
                  value={data.livingCosts}
                  onChange={(e) => onChange({ livingCosts: e.target.value })}
                />
              </div>
              <span className="input-hint">Include rent, utilities, food, other regular expenses</span>
            </div>
            <div className="form-group">
              <label htmlFor="dependentsEmp">Number of Dependents</label>
              <select
                id="dependentsEmp"
                className="form-select"
                value={data.dependents}
                onChange={(e) => onChange({ dependents: e.target.value })}
              >
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4+</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="step-actions">
        <button className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button className="btn-primary btn-lg" onClick={onNext} disabled={!isValid}>
          Continue to Documents →
        </button>
      </div>
    </div>
  );
}

interface DocumentsStepProps {
  data: DocumentData;
  onChange: (data: Partial<DocumentData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function DocumentsStep({ data, onChange, onNext, onBack }: DocumentsStepProps) {
  const isValid = data.idType && data.idNumber;
  
  const handleFileChange = (field: 'idFrontFile' | 'idBackFile', file: File | undefined) => {
    onChange({ [field]: file });
  };
  
  return (
    <div className="step-card">
      <div className="step-header">
        <h2>Identity Documents</h2>
        <p>We need to verify your identity to process your application</p>
      </div>
      
      <div className="documents-form">
        <div className="form-section">
          <h3>ID Document</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="idType">Document Type *</label>
              <select
                id="idType"
                className="form-select"
                value={data.idType}
                onChange={(e) => onChange({ idType: e.target.value as DocumentData['idType'] })}
              >
                <option value="">Select document type</option>
                <option value="national_id">National ID Card</option>
                <option value="passport">Passport</option>
                <option value="drivers_license">Driver's License</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="idNumber">Document Number *</label>
              <input
                id="idNumber"
                type="text"
                className="form-input"
                value={data.idNumber}
                onChange={(e) => onChange({ idNumber: e.target.value })}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="idExpiry">Expiry Date</label>
            <input
              id="idExpiry"
              type="date"
              className="form-input"
              value={data.idExpiry || ''}
              onChange={(e) => onChange({ idExpiry: e.target.value })}
            />
          </div>
        </div>
        
        <div className="form-section">
          <h3>Upload Documents</h3>
          <p className="section-note">Please upload clear photos or scans of your ID document</p>
          
          <div className="upload-grid">
            <div className="upload-card">
              <div className="upload-icon">📄</div>
              <span className="upload-label">Front Side</span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange('idFrontFile', e.target.files?.[0])}
                className="upload-input"
                id="idFront"
              />
              <label htmlFor="idFront" className="upload-btn">
                {data.idFrontFile ? `✓ ${data.idFrontFile.name}` : 'Choose File'}
              </label>
            </div>
            
            <div className="upload-card">
              <div className="upload-icon">📄</div>
              <span className="upload-label">Back Side</span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange('idBackFile', e.target.files?.[0])}
                className="upload-input"
                id="idBack"
              />
              <label htmlFor="idBack" className="upload-btn">
                {data.idBackFile ? `✓ ${data.idBackFile.name}` : 'Choose File'}
              </label>
            </div>
          </div>
          
          <div className="upload-tips">
            <h4>Tips for good quality uploads:</h4>
            <ul>
              <li>Ensure the document is clearly visible and not blurry</li>
              <li>All corners of the document should be visible</li>
              <li>Avoid glare or shadows on the document</li>
              <li>Maximum file size: 10MB per file</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="step-actions">
        <button className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button className="btn-primary btn-lg" onClick={onNext} disabled={!isValid}>
          Continue to Review →
        </button>
      </div>
    </div>
  );
}

interface ReviewStepProps {
  formData: ApplicationFormData;
  consents: ApplicationFormData['consents'];
  submissionError: string | null;
  onUpdateConsents: (key: keyof ApplicationFormData['consents'], value: boolean) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

function ReviewStep({
  formData,
  consents,
  submissionError,
  onUpdateConsents,
  onSubmit,
  onBack,
  isSubmitting,
}: ReviewStepProps) {
  const canSubmit = consents.termsAccepted && consents.privacyAccepted && consents.creditCheckAuthorized;
  
  return (
    <div className="step-card">
      <div className="step-header">
        <h2>Review & Submit</h2>
        <p>Please review all information before submitting your application</p>
      </div>
      
      <div className="review-sections">
        {/* Offer Summary */}
        <div className="review-section">
          <h3>📋 Loan Details</h3>
          {formData.offer && (
            <div className="review-grid">
              <div className="review-item">
                <span className="review-label">Provider</span>
                <span className="review-value">{formData.offer.providerLogo} {formData.offer.providerName}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Amount</span>
                <span className="review-value">{formData.offer.amount.toLocaleString()} PLN</span>
              </div>
              <div className="review-item">
                <span className="review-label">Duration</span>
                <span className="review-value">{formData.offer.duration} months</span>
              </div>
              <div className="review-item">
                <span className="review-label">Interest Rate</span>
                <span className="review-value">{formData.offer.interestRate}%</span>
              </div>
              <div className="review-item">
                <span className="review-label">Monthly Payment</span>
                <span className="review-value">{formData.offer.monthlyInstallment.toLocaleString(undefined, { minimumFractionDigits: 2 })} PLN</span>
              </div>
              <div className="review-item">
                <span className="review-label">Total Payment</span>
                <span className="review-value">{formData.offer.totalRepayment.toLocaleString(undefined, { minimumFractionDigits: 2 })} PLN</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Personal Info */}
        <div className="review-section">
          <h3>👤 Personal Information</h3>
          <div className="review-grid">
            <div className="review-item">
              <span className="review-label">Name</span>
              <span className="review-value">{formData.personalInfo.firstName} {formData.personalInfo.lastName}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Email</span>
              <span className="review-value">{formData.personalInfo.email}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Phone</span>
              <span className="review-value">{formData.personalInfo.phone}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Date of Birth</span>
              <span className="review-value">{formData.personalInfo.dateOfBirth}</span>
            </div>
            <div className="review-item full-width">
              <span className="review-label">Address</span>
              <span className="review-value">
                {formData.personalInfo.address.street}
                {formData.personalInfo.address.apartment ? `, ${formData.personalInfo.address.apartment}` : ''},
                {' '}{formData.personalInfo.address.postalCode} {formData.personalInfo.address.city},
                {' '}{formData.personalInfo.address.country}
              </span>
            </div>
          </div>
        </div>
        
        {/* Employment */}
        <div className="review-section">
          <h3>💼 Employment</h3>
          <div className="review-grid">
            <div className="review-item">
              <span className="review-label">Status</span>
              <span className="review-value">{formData.employment.status?.replace('_', ' ')}</span>
            </div>
            {formData.employment.employerName && (
              <div className="review-item">
                <span className="review-label">Employer</span>
                <span className="review-value">{formData.employment.employerName}</span>
              </div>
            )}
            <div className="review-item">
              <span className="review-label">Monthly Income</span>
              <span className="review-value">{parseInt(formData.employment.monthlyIncome).toLocaleString()} PLN</span>
            </div>
            <div className="review-item">
              <span className="review-label">Monthly Costs</span>
              <span className="review-value">{parseInt(formData.employment.livingCosts).toLocaleString()} PLN</span>
            </div>
          </div>
        </div>
        
        {/* Documents */}
        <div className="review-section">
          <h3>📄 Documents</h3>
          <div className="review-grid">
            <div className="review-item">
              <span className="review-label">ID Type</span>
              <span className="review-value">{formData.documents.idType?.replace('_', ' ')}</span>
            </div>
            <div className="review-item">
              <span className="review-label">ID Number</span>
              <span className="review-value">{formData.documents.idNumber}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Files Uploaded</span>
              <span className="review-value">
                {formData.documents.idFrontFile ? '✓ Front' : '○ Front'}
                {' / '}
                {formData.documents.idBackFile ? '✓ Back' : '○ Back'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Consents */}
      <div className="consents-section">
        <h3>Agreements & Consents</h3>
        
        <label className="consent-checkbox required">
          <input
            type="checkbox"
            checked={consents.termsAccepted}
            onChange={(e) => onUpdateConsents('termsAccepted', e.target.checked)}
          />
          <span className="checkbox-custom"></span>
          <span className="consent-text">
            I have read and agree to the <a href="/terms" target="_blank">Terms and Conditions</a> *
          </span>
        </label>
        
        <label className="consent-checkbox required">
          <input
            type="checkbox"
            checked={consents.privacyAccepted}
            onChange={(e) => onUpdateConsents('privacyAccepted', e.target.checked)}
          />
          <span className="checkbox-custom"></span>
          <span className="consent-text">
            I have read and agree to the <a href="/privacy" target="_blank">Privacy Policy</a> *
          </span>
        </label>
        
        <label className="consent-checkbox required">
          <input
            type="checkbox"
            checked={consents.creditCheckAuthorized}
            onChange={(e) => onUpdateConsents('creditCheckAuthorized', e.target.checked)}
          />
          <span className="checkbox-custom"></span>
          <span className="consent-text">
            I authorize the lender to perform a credit check as part of this application *
          </span>
        </label>
        
        <label className="consent-checkbox">
          <input
            type="checkbox"
            checked={consents.marketingOptIn}
            onChange={(e) => onUpdateConsents('marketingOptIn', e.target.checked)}
          />
          <span className="checkbox-custom"></span>
          <span className="consent-text">
            I would like to receive personalized offers and updates (optional)
          </span>
        </label>
      </div>

      {submissionError && (
        <div className="form-error">
          {submissionError}
        </div>
      )}
      
      <div className="step-actions">
        <button className="btn-secondary" onClick={onBack} disabled={isSubmitting}>
          ← Back
        </button>
        <button 
          className="btn-primary btn-lg submit-btn" 
          onClick={onSubmit} 
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner"></span>
              Submitting...
            </>
          ) : (
            'Submit Application ✓'
          )}
        </button>
      </div>
    </div>
  );
}

export default LoanApplicationPage;
