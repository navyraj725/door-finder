import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { supabase, type AdminSettings, type PlanType, PLANS, planConfig } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PaymentModal from './PaymentModal';

interface PricingProps {
  settings: AdminSettings | null;
  onRequireAuth: () => void;
}

export default function Pricing({ settings, onRequireAuth }: PricingProps) {
  const { profile } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<PlanType | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ plan: PlanType; amount: number } | null>(null);

  useEffect(() => {
    if (!profile) { setCurrentPlan(null); return; }
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        const raw = (data?.[0]?.plan_type as PlanType) || 'free';
        const sub = data?.[0];
        if (sub?.status === 'expired' || (sub?.expiry_date && new Date(sub.expiry_date) < new Date())) {
          setCurrentPlan('free');
        } else {
          setCurrentPlan(raw);
        }
      });
  }, [profile]);

  function choosePlan(plan: PlanType, amount: number) {
    if (!profile) { onRequireAuth(); return; }
    if (plan === 'free') return;
    setPaymentModal({ plan, amount });
  }

  function effectivePrice(plan: PlanType): number {
    if (plan === 'monthly') return settings?.monthly_price ?? 10000;
    if (plan === 'six_month') return settings?.six_month_price ?? 60000;
    if (plan === 'annual') return settings?.annual_price ?? 120000;
    return 0;
  }

  const currentNormalized = currentPlan === 'premium_6mo' ? 'six_month' : currentPlan === 'premium_1yr' ? 'annual' : currentPlan;

  return (
    <section className="section">
      <div className="section-header" style={{ justifyContent: 'center' }}>
        <h2 className="section-title" style={{ textAlign: 'center' }}>Choose Your Plan</h2>
      </div>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '15px', marginBottom: '32px', maxWidth: '560px', margin: '0 auto 32px' }}>
        One subscription works for every listing type. Post houses, apartments, hotels and guest houses — no category-based pricing. All prices in UGX.
      </p>

      {settings?.promo_text && (
        <div className="notif-banner success" style={{ maxWidth: '700px', margin: '0 auto 24px' }}>
          <div className="notif-icon"></div>
          <div className="notif-text"><strong>Promotional Offer</strong>{settings.promo_text}</div>
        </div>
      )}

      <div className="pricing-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {PLANS.map((plan) => {
          const price = plan.key === 'free' ? 0 : effectivePrice(plan.key);
          const isCurrent = currentNormalized === plan.key;
          const isPopular = plan.popular;
          return (
            <div key={plan.key} className={`pricing-card ${isPopular ? 'popular' : ''}`} style={{ position: 'relative' }}>
              {isPopular && <div className="popular-badge">Popular</div>}
              <div className="plan-name">{plan.label}</div>
              <div className="plan-price">
                UGX {price.toLocaleString()}
                <span className="per"> / {plan.durationDays} days</span>
              </div>
              <div className="plan-desc">
                {plan.maxListings === 'unlimited'
                  ? 'Unlimited property listings across every category.'
                  : 'Get started with one listing — perfect for trying out Door Finder.'}
              </div>
              <ul className="plan-features">
                <li><span className="check"><Check size={12} /></span> {plan.maxListings === 'unlimited' ? 'Unlimited listings' : '1 property listing'}</li>
                <li><span className="check"><Check size={12} /></span> Active for {plan.durationDays} {plan.durationDays === 1 ? 'day' : 'days'}</li>
                <li><span className="check"><Check size={12} /></span> All listing types: Houses, Apartments, Hotels, Guest Houses, Warehouses</li>
                <li><span className="check"><Check size={12} /></span> WhatsApp contact button</li>
                {plan.maxListings === 'unlimited' && <li><span className="check"><Check size={12} /></span> Priority search placement</li>}
                {plan.maxListings === 'unlimited' && <li><span className="check"><Check size={12} /></span> Premium badge on listings</li>}
                {plan.key === 'annual' && <li><span className="check"><Check size={12} /></span> Best value — save UGX 60,000 vs monthly</li>}
              </ul>
              <button
                className={`choose-btn ${isPopular ? 'green' : plan.key === 'annual' ? 'navy' : 'outline'}`}
                disabled={isCurrent}
                onClick={() => choosePlan(plan.key, price)}
              >
                {isCurrent ? 'Current Plan' : plan.key === 'free' ? 'Free' : `Choose ${plan.label}`}
              </button>
            </div>
          );
        })}
      </div>


      {paymentModal && (
        <PaymentModal
          open={!!paymentModal}
          amount={paymentModal.amount}
          planType={paymentModal.plan}
          onClose={() => setPaymentModal(null)}
        />
      )}
    </section>
  );
}
