import { useState, useEffect, useRef } from 'react';
import { Smartphone } from 'lucide-react';
import { supabase, type PlanType } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface PaymentModalProps {
  open: boolean;
  amount: number;
  planType: PlanType;
  propertyId?: string;
  durationDays?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  shortName: string;
  color: string;
  textColor: string;
  letter: string;
  type: 'mobile_money' | 'bank' | 'card';
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'mtn_momo', name: 'MTN MOMO', shortName: 'MTN', color: '#FFCB05', textColor: '#1B2B4B', letter: 'M', type: 'mobile_money' },
  { id: 'airtel_money', name: 'AIRTEL MONEY', shortName: 'Airtel', color: '#E40000', textColor: '#FFFFFF', letter: 'A', type: 'mobile_money' },
  { id: 'stanbic_bank', name: 'STANBIC BANK', shortName: 'Stanbic', color: '#0033A0', textColor: '#FFFFFF', letter: 'S', type: 'bank' },
  { id: 'centenary_bank', name: 'CENTENARY BANK', shortName: 'Centenary', color: '#D4002A', textColor: '#FFFFFF', letter: 'C', type: 'bank' },
  { id: 'dfcu_bank', name: 'DFCU BANK', shortName: 'DFCU', color: '#0066B3', textColor: '#FFFFFF', letter: 'D', type: 'bank' },
  { id: 'equity_bank', name: 'EQUITY BANK', shortName: 'Equity', color: '#E30613', textColor: '#FFFFFF', letter: 'E', type: 'bank' },
  { id: 'postbank_uganda', name: 'POSTBANK UGANDA', shortName: 'PostBank', color: '#0066B3', textColor: '#FFFFFF', letter: 'P', type: 'bank' },
  { id: 'visa_card', name: 'VISA CARD', shortName: 'Visa', color: '#1A1F71', textColor: '#FFFFFF', letter: 'V', type: 'card' },
];

type Step = 'method' | 'details' | 'processing' | 'success' | 'failed' | 'pending';

export default function PaymentModal({ open, amount, planType, propertyId, durationDays, onClose, onSuccess }: PaymentModalProps) {
  const { profile } = useAuth();
  const [step, setStep] = useState<Step>('method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [error, setError] = useState('');

  // Mobile money fields — phone only, NO PIN on website
  const [mmPhone, setMmPhone] = useState(profile?.whatsapp || '');

  // Bank fields
  const [bankAccount, setBankAccount] = useState('');
  const [bankPhone, setBankPhone] = useState(profile?.whatsapp || '');

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState(profile?.full_name || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Dev toggle for simulating approval vs rejection
  const [devToggle, setDevToggle] = useState<'approve' | 'reject'>('approve');
  const [showDevToggle, setShowDevToggle] = useState(false);

  // Polling state
  const [pollSeconds, setPollSeconds] = useState(0);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!open) return null;

  const planDuration =
    planType === 'monthly' ? 30 :
    planType === 'six_month' || planType === 'premium_6mo' ? 180 :
    planType === 'annual' || planType === 'premium_1yr' ? 365 :
    durationDays || 0;
  const isFeatured = (planType === 'free' || planType === 'monthly' || planType === 'six_month' || planType === 'annual') && !!propertyId;

  function pickMethod(m: PaymentMethod) {
    setSelectedMethod(m);
    setStep('details');
    setError('');
  }

  function backToMethod() {
    setStep('method');
    setError('');
    setCardNumber('');
    setCardCvv('');
  }

  // Clear timers on unmount or step change away from processing
  useEffect(() => {
    if (step !== 'processing') {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      setPollSeconds(0);
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [step]);

  async function submitPayment() {
    if (!profile || !selectedMethod) return;
    setError('');

    // Validate based on method type
    if (selectedMethod.type === 'mobile_money') {
      if (!mmPhone.trim()) { setError('Enter your mobile money phone number.'); return; }
    } else if (selectedMethod.type === 'bank') {
      if (!bankAccount.trim()) { setError('Enter your bank account number.'); return; }
      if (!bankPhone.trim()) { setError('Enter your registered phone number.'); return; }
    } else if (selectedMethod.type === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) { setError('Enter a valid card number.'); return; }
      if (!cardName.trim()) { setError('Enter the name on the card.'); return; }
      if (!cardExpiry.trim() || !cardExpiry.includes('/')) { setError('Enter card expiry (MM/YY).'); return; }
      if (cardCvv.length < 3) { setError('Enter the CVV.'); return; }
    }

    setStep('processing');
    setPollSeconds(0);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token || '';

      // Submit to edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/da-dreamtech-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          amount,
          plan_type: planType,
          property_id: propertyId || null,
          duration_days: durationDays || null,
          user_id: profile.id,
          user_email: profile.email,
          user_name: profile.full_name,
          type: isFeatured ? 'featured' : 'subscription',
          payment_method: selectedMethod.id,
          phone: selectedMethod.type === 'mobile_money' ? mmPhone : bankPhone,
          account: bankAccount,
          card_last4: cardNumber.replace(/\s/g, '').slice(-4),
          dev_simulate: devToggle,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment processing failed');
      }

      // Start polling — simulate waiting for USSD push approval
      pollTimerRef.current = setInterval(() => {
        setPollSeconds((s) => s + 1);
      }, 1000);

      // Simulate the network response after a realistic delay
      // In production, this would poll the DA DREAM-TECH API for status
      pollTimeoutRef.current = setTimeout(() => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);

        if (result.status === 'completed') {
          setStep('success');
          onSuccess?.();
        } else if (result.status === 'failed' || result.status === 'rejected') {
          setStep('failed');
        } else if (result.status === 'pending') {
          setStep('pending');
        } else {
          // Dev toggle simulation
          if (devToggle === 'approve') {
            setStep('success');
            onSuccess?.();
          } else {
            setStep('failed');
          }
        }
      }, 8000); // 8 second simulated USSD approval wait
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed.');
      setStep('details');
    }
  }

  function handleClose() {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    setStep('method');
    setSelectedMethod(null);
    setError('');
    setCardNumber('');
    setCardCvv('');
    setBankAccount('');
    setPollSeconds(0);
    onClose();
  }

  function retryPayment() {
    setStep('details');
    setError('');
    setPollSeconds(0);
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-box" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}></button>

        {/* Dev toggle — hidden behind a small gear icon */}
        <button
          onClick={() => setShowDevToggle(!showDevToggle)}
          style={{ position: 'absolute', top: '14px', left: '16px', background: 'none', border: 'none', fontSize: '16px', color: 'var(--text-muted)', cursor: 'pointer' }}
          title="Dev simulation toggle"
        >
          
        </button>
        {showDevToggle && (
          <div className="dev-toggle-box">
            <div className="dev-toggle-label">Dev: Simulate payment result</div>
            <div className="dev-toggle-row">
              <button
                className={`dev-toggle-btn ${devToggle === 'approve' ? 'on-green' : ''}`}
                onClick={() => setDevToggle('approve')}
              >
                Approve
              </button>
              <button
                className={`dev-toggle-btn ${devToggle === 'reject' ? 'on-red' : ''}`}
                onClick={() => setDevToggle('reject')}
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Choose payment method */}
        {step === 'method' && (
          <>
            <h3>{isFeatured ? 'Feature This Listing' : 'Subscribe'}</h3>
            <div className="modal-sub">
              {planType === 'monthly' ? '30 days of unlimited listings' :
               planType === 'six_month' || planType === 'premium_6mo' ? '6 months of unlimited listings' :
               planType === 'annual' || planType === 'premium_1yr' ? '1 year of unlimited listings — best value' :
               `${durationDays || 7} days featured at the top`}
            </div>
            <div className="sub-amount-badge">
              <span className="amt">{amount.toLocaleString()}</span>
              <span className="per">UGX / {planDuration} days</span>
            </div>

            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '12px' }}>
              Choose a Payment Method
            </div>

            <div className="network-pay-options">
              {PAYMENT_METHODS.map((method) => (
                <div
                  key={method.id}
                  className="network-pay-card"
                  style={selectedMethod?.id === method.id ? { borderColor: 'var(--navy)', background: 'var(--gray-bg)' } : {}}
                  onClick={() => pickMethod(method)}
                >
                  <div className="network-logo" style={{ background: method.color, color: method.textColor }}>
                    {method.letter}
                  </div>
                  <div className="network-pay-info">
                    <div className="network-pay-name">{method.name}</div>
                    <div className="network-pay-number">
                      {method.type === 'mobile_money' ? 'Mobile Money' : method.type === 'bank' ? 'Bank Transfer' : 'Card Payment'}
                    </div>
                  </div>
                  <div className="card-pay-arrow">›</div>
                </div>
              ))}
            </div>
            <div className="modal-notice">
              Payments are processed securely by DA DREAM-TECH. Your account activates automatically after payment is confirmed.
            </div>
          </>
        )}

        {/* Step 2: Enter payment details */}
        {step === 'details' && selectedMethod && (
          <>
            <h3>Pay with {selectedMethod.name}</h3>
            <div className="modal-sub">
              Amount: <strong>UGX {amount.toLocaleString()}</strong> — {planDuration} days
            </div>

            {/* Payment method badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--gray-bg)', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px' }}>
              <div className="network-logo" style={{ background: selectedMethod.color, color: selectedMethod.textColor }}>
                {selectedMethod.letter}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy)' }}>{selectedMethod.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {selectedMethod.type === 'mobile_money' ? 'Mobile Money Payment' : selectedMethod.type === 'bank' ? 'Bank Account Payment' : 'Card Payment'}
                </div>
              </div>
            </div>

            {error && <div className="auth-err">{error}</div>}

            {/* Mobile Money — phone number only, NO PIN */}
            {selectedMethod.type === 'mobile_money' && (
              <>
                <div className="form-group">
                  <label>Mobile Money Number</label>
                  <input
                    type="tel"
                    value={mmPhone}
                    onChange={(e) => setMmPhone(e.target.value)}
                    placeholder="e.g. 0772 123 456"
                  />
                </div>
                <div className="mm-info-box">
                  <div className="mm-info-icon"><Smartphone size={22} /></div>
                  <div className="mm-info-text">
                    After you submit, a payment prompt will appear on your phone.
                    Enter your Mobile Money PIN on your phone screen to approve — never on this website.
                  </div>
                </div>
              </>
            )}

            {/* Bank fields */}
            {selectedMethod.type === 'bank' && (
              <>
                <div className="form-group">
                  <label>Bank Account Number</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="Enter your account number"
                  />
                </div>
                <div className="form-group">
                  <label>Registered Phone Number</label>
                  <input
                    type="tel"
                    value={bankPhone}
                    onChange={(e) => setBankPhone(e.target.value)}
                    placeholder="e.g. 0772 123 456"
                  />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  You will receive an OTP on your phone to verify the payment.
                </div>
              </>
            )}

            {/* Card fields */}
            {selectedMethod.type === 'card' && (
              <>
                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
                      setCardNumber(v);
                    }}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    inputMode="numeric"
                  />
                </div>
                <div className="form-group">
                  <label>Name on Card</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Card holder name"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry (MM/YY)</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      maxLength={4}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button className="submit-btn navy-btn" style={{ flex: '0 0 auto', padding: '12px 20px' }} onClick={backToMethod}>
                Back
              </button>
              <button className="submit-btn green-btn" style={{ flex: '1' }} onClick={submitPayment}>
                {selectedMethod.type === 'mobile_money' ? `Send Prompt to ${mmPhone || 'my phone'}` : `Pay ${amount.toLocaleString()} UGX`}
              </button>
            </div>
            <div className="modal-notice">
              By proceeding, you authorize DA DREAM-TECH to process this payment. Your details are encrypted and secure.
            </div>
          </>
        )}

        {/* Step 3: Processing — USSD push status screen */}
        {step === 'processing' && selectedMethod && (
          <div className="processing-screen">
            <div className="processing-phone-icon">
              <Smartphone size={52} />
              <div className="processing-pulse-ring" />
            </div>
            <h3 style={{ marginBottom: '8px' }}>
              {selectedMethod.type === 'mobile_money' ? 'Check Your Phone' : 'Processing Payment'}
            </h3>
            <div className="processing-status-text">
              {selectedMethod.type === 'mobile_money' ? (
                <>
                  A payment prompt has been sent to <strong>{mmPhone}</strong>.
                  <br />
                  Check your phone screen and enter your PIN on the pop-up prompt to confirm payment of <strong>UGX {amount.toLocaleString()}</strong>.
                </>
              ) : (
                <>
                  DA DREAM-TECH is securely processing your payment of <strong>UGX {amount.toLocaleString()}</strong>. Please do not close this window.
                </>
              )}
            </div>

            <div className="processing-spinner-row">
              <div className="processing-spinner" />
              <span className="processing-timer">{pollSeconds}s</span>
            </div>

            <div className="processing-hint">
              Waiting for {selectedMethod.type === 'mobile_money' ? 'mobile network approval' : 'payment confirmation'}...
            </div>
          </div>
        )}

        {/* Step 4a: Success */}
        {step === 'success' && (
          <div className="result-screen success-screen">
            <div className="result-icon"></div>
            <h3 style={{ marginBottom: '8px' }}>Payment Successful!</h3>
            <div className="modal-sub" style={{ marginBottom: '20px' }}>
              Your payment of UGX {amount.toLocaleString()} has been confirmed by DA DREAM-TECH. Your {isFeatured ? 'featured listing' : 'subscription'} is now active.
            </div>
            <button className="submit-btn green-btn" onClick={handleClose}>Done</button>
          </div>
        )}

        {/* Step 4b: Failed */}
        {step === 'failed' && (
          <div className="result-screen failed-screen">
            <div className="result-icon"></div>
            <h3 style={{ marginBottom: '8px' }}>Payment Not Completed</h3>
            <div className="modal-sub" style={{ marginBottom: '20px' }}>
              The payment was not approved. This can happen if the prompt was declined, timed out, or the number is not registered for Mobile Money. Please try again.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="submit-btn green-btn" style={{ flex: '1' }} onClick={retryPayment}>Try Again</button>
              <button className="submit-btn navy-btn" style={{ flex: '0 0 auto', padding: '14px 20px' }} onClick={handleClose}>Close</button>
            </div>
          </div>
        )}

        {/* Step 4c: Pending confirmation */}
        {step === 'pending' && (
          <div className="result-screen">
            <div className="result-icon"></div>
            <h3 style={{ marginBottom: '8px' }}>Payment Submitted</h3>
            <div className="modal-sub" style={{ marginBottom: '20px' }}>
              Your payment of UGX {amount.toLocaleString()} has been submitted to DA DREAM-TECH for verification. Your account will activate automatically once confirmed. This usually takes a few minutes.
            </div>
            <button className="submit-btn navy-btn" onClick={handleClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
