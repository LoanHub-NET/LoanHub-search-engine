import { useState } from 'react';
import type { DecisionPayload } from '../../types/admin.types';
import './DecisionModal.css';

interface DecisionModalProps {
  applicationId: string;
  referenceNumber: string;
  applicantName: string;
  decisionType: 'accept' | 'reject';
  onClose: () => void;
  onSubmit: (decision: DecisionPayload) => void;
}

export function DecisionModal({
  applicationId,
  referenceNumber,
  applicantName,
  decisionType,
  onClose,
  onSubmit,
}: DecisionModalProps) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAccept = decisionType === 'accept';
  
  const predefinedReasons = isAccept
    ? [
        'All documents verified and requirements met',
        'Credit score and income verified',
        'Provider approved application',
        'Meets all eligibility criteria',
      ]
    : [
        'Insufficient income for requested amount',
        'Credit score below minimum threshold',
        'Incomplete documentation',
        'Employment history too short',
        'Debt-to-income ratio exceeds limit',
        'Failed identity verification',
        'Application expired',
      ];

  const handleSubmit = async () => {
    if (!reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onSubmit({
      applicationId,
      decision: decisionType,
      reason: reason.trim(),
      notes: notes.trim() || undefined,
      sendEmail,
    });
    
    setIsSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-content decision-modal ${isAccept ? 'accept' : 'reject'}`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="decision-icon">
            {isAccept ? '✅' : '❌'}
          </div>
          <div className="modal-header-info">
            <h2>{isAccept ? 'Accept' : 'Reject'} Application</h2>
            <p className="modal-subtitle">
              {referenceNumber} • {applicantName}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Warning for reject */}
          {!isAccept && (
            <div className="warning-box">
              <span className="warning-icon">⚠️</span>
              <div className="warning-text">
                <strong>This action cannot be undone.</strong>
                <p>The applicant will be notified of this decision.</p>
              </div>
            </div>
          )}

          {/* Reason Selection */}
          <div className="form-group">
            <label className="form-label required">
              Reason for {isAccept ? 'Acceptance' : 'Rejection'}
            </label>
            <div className="predefined-reasons">
              {predefinedReasons.map((predefined, index) => (
                <button
                  key={index}
                  type="button"
                  className={`reason-chip ${reason === predefined ? 'selected' : ''}`}
                  onClick={() => setReason(predefined)}
                >
                  {predefined}
                </button>
              ))}
            </div>
            <textarea
              className="form-textarea"
              placeholder="Or enter a custom reason..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Additional Notes */}
          <div className="form-group">
            <label className="form-label">
              Internal Notes (optional)
            </label>
            <textarea
              className="form-textarea"
              placeholder="Add any internal notes for the audit trail..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
            />
            <p className="form-hint">
              These notes will only be visible to admin staff, not the applicant.
            </p>
          </div>

          {/* Email Notification */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={e => setSendEmail(e.target.checked)}
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-text">
                Send email notification to applicant
                {sendEmail && (
                  <span className="email-preview">
                    An automated {isAccept ? 'approval' : 'rejection'} email will be sent to the applicant
                  </span>
                )}
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className={`btn ${isAccept ? 'btn-success' : 'btn-danger'}`}
            onClick={handleSubmit}
            disabled={!reason.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              <>
                {isAccept ? '✅ Accept Application' : '❌ Reject Application'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
