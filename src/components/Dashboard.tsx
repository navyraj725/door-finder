import { useEffect, useState } from 'react';
import { MessageCircle, Crown, RefreshCw, ArrowUpCircle } from 'lucide-react';
import { supabase, type Property, type Subscription, type Payment, type FeaturedListing, type AdminSettings, planConfig, planLabel } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import ListingForm from './ListingForm';
import PaymentModal from './PaymentModal';
import EditProfileModal from './EditProfileModal';
import { CategoryLogo } from './CategoryLogos';

interface DashboardProps {
  settings: AdminSettings | null;
  onRequireAuth: () => void;
  onNavigatePricing: () => void;
}

export default function Dashboard({ settings, onRequireAuth, onNavigatePricing }: DashboardProps) {
  const { profile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [featured, setFeatured] = useState<FeaturedListing[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editProp, setEditProp] = useState<Property | null>(null);
  const [editProfile, setEditProfile] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [featuredModal, setFeaturedModal] = useState<{ propertyId: string; days: number; amount: number } | null>(null);
  const [renewModal, setRenewModal] = useState<{ plan: 'monthly' | 'six_month' | 'annual'; amount: number } | null>(null);

  useEffect(() => {
    if (!profile) return;
    const uid = profile.id;
    async function load() {
      const [propsRes, subsRes, payRes, featRes] = await Promise.all([
        supabase.from('properties').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('featured_listings').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      ]);
      setProperties((propsRes.data as Property[]) || []);
      const subs = (subsRes.data as Subscription[]) || [];
      setSubscription(subs.find((s) => s.status === 'active') || subs[0] || null);
      setPayments((payRes.data as Payment[]) || []);
      setFeatured((featRes.data as FeaturedListing[]) || []);
    }
    load();
  }, [profile, refreshKey]);

  if (!profile) {
    return (
      <section className="section">
        <div className="empty-state">
          <div className="empty-icon"></div>
          <div className="empty-text">Please sign in to view your dashboard.</div>
          <button className="choose-btn navy" style={{ marginTop: '16px' }} onClick={onRequireAuth}>Sign In</button>
        </div>
      </section>
    );
  }

  const cfg = planConfig(subscription?.plan_type);
  const isPaid = cfg.key !== 'free';
  const expiry = subscription?.expiry_date ? new Date(subscription.expiry_date) : null;
  const now = new Date();
  const remainingDays = expiry ? Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
  const isExpired = subscription?.status === 'expired' || (expiry && expiry < now);
  const isExpiringSoon = !isExpired && remainingDays > 0 && remainingDays <= 7;
  const startDate = subscription?.start_date ? new Date(subscription.start_date).toLocaleDateString() : '—';
  const expiryDate = expiry ? expiry.toLocaleDateString() : '—';
  const activeListingCount = properties.filter((p) => p.is_active).length;

  function refresh() { setRefreshKey((k) => k + 1); }

  async function deleteProperty(id: string) {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    await supabase.from('properties').delete().eq('id', id);
    refresh();
  }

  async function toggleStatus(id: string, current: string) {
    const next = current === 'available' ? 'rented' : current === 'rented' ? 'sold' : 'available';
    await supabase.from('properties').update({ status: next }).eq('id', id);
    refresh();
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('properties').update({ is_active: !current }).eq('id', id);
    refresh();
  }

  function featureListing(propertyId: string, days: number, amount: number) {
    setFeaturedModal({ propertyId, days, amount });
  }

  function startRenew(plan: 'monthly' | 'six_month' | 'annual') {
    const amount = plan === 'monthly' ? (settings?.monthly_price ?? 10000) : plan === 'six_month' ? (settings?.six_month_price ?? 60000) : (settings?.annual_price ?? 120000);
    setRenewModal({ plan, amount });
  }

  const featuredIds = new Set(featured.filter((f) => f.status === 'active').map((f) => f.property_id));

  return (
    <>
      <section className="section">
        <div className="dash-hero">
          <div>
            <h2>My Dashboard</h2>
            <p>Manage your listings, subscription, and payment history.</p>
          </div>
          <button className="add-prop-btn" onClick={() => setShowForm(true)}>+ Add New Listing</button>
        </div>

        {/* Profile card */}
        <div className="profile-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
            {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : ''}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy)' }}>{profile.full_name || 'User'}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{profile.email}</div>
          </div>
          {profile.whatsapp && (
            <a
              href={`https://wa.me/256${profile.whatsapp.replace(/^0/, '')}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: '#25D366', color: 'white', fontWeight: 600,
                fontSize: '13px', padding: '8px 14px', borderRadius: '8px',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              <MessageCircle size={15} /> {profile.whatsapp}
            </a>
          )}
          <button
            onClick={() => setEditProfile(true)}
            style={{
              background: 'var(--navy)', color: 'white', fontWeight: 600,
              fontSize: '13px', padding: '8px 14px', borderRadius: '8px',
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
             Edit Profile
          </button>
        </div>

        {/* Subscription status */}
        <div className="dash-section-title">Subscription</div>
        <div className="sub-card" style={{ marginBottom: '24px' }}>
          <div className="sub-card-top">
            <div className="sub-icon" style={{ background: isPaid ? 'var(--green-light)' : 'var(--gray-light)' }}>
              {isPaid ? <Crown size={22} /> : null}
            </div>
            <div className="sub-info">
              <h3>{planLabel(subscription?.plan_type)}</h3>
              <div className="sub-meta">
                Started: {startDate}
                {` • Expires: ${expiryDate}`}
                {!isExpired && ` • ${remainingDays} days remaining`}
                {isExpired && ' • Expired'}
              </div>
            </div>
            <span className={`sub-badge ${isExpired ? 'badge-expired' : isExpiringSoon ? 'badge-expiring' : 'badge-active'}`}>
              {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : subscription?.status === 'active' ? 'Active' : subscription?.status}
            </span>
          </div>
          {expiry && !isExpired && (
            <>
              <div className="sub-progress-label">
                <span>{remainingDays} days left</span>
                <span>{cfg.durationDays} days</span>
              </div>
              <div className="sub-card-bar">
                <div className="sub-card-bar-fill" style={{
                  width: `${(remainingDays / cfg.durationDays) * 100}%`,
                  background: isExpiringSoon ? 'var(--amber)' : 'var(--green)',
                }} />
              </div>
            </>
          )}
          <div className="sub-card-footer">
            <div className="sub-footer-info">
              {isPaid
                ? <><strong>{activeListingCount} active listings</strong> • Unlimited plan</>
                : <><strong>{activeListingCount} / 1 active listing</strong> • Free plan</>}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {isExpired && (
                <button className="renew-btn" onClick={() => startRenew('monthly')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={14} /> Renew Monthly
                </button>
              )}
              <button className="renew-btn" onClick={onNavigatePricing} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowUpCircle size={14} /> {isExpired ? 'Renew / Upgrade' : 'Upgrade'}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {(isExpiringSoon || isExpired) && (
          <div className={`notif-banner ${isExpired ? 'danger' : 'warn'}`} style={{ marginBottom: '24px' }}>
            <div className="notif-icon">{isExpired ? '' : ''}</div>
            <div className="notif-text">
              <strong>{isExpired ? 'Your subscription has expired' : `Subscription expires in ${remainingDays} days`}</strong>
              {isExpired
                ? 'Your listings are hidden from search. Renew to restore them.'
                : 'Renew now to keep your listings visible and avoid interruption.'}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="dash-stats">
          <div className="dash-stat"><div className="ds-num">{properties.length}</div><div className="ds-label">Total Listings</div></div>
          <div className="dash-stat"><div className="ds-num">{activeListingCount}</div><div className="ds-label">Active</div></div>
          <div className="dash-stat"><div className="ds-num">{featuredIds.size}</div><div className="ds-label">Featured</div></div>
          <div className="dash-stat"><div className="ds-num">{payments.length}</div><div className="ds-label">Payments</div></div>
        </div>

        {/* My listings */}
        <div className="dash-section-title">
          My Listings
          <button className="add-prop-btn" onClick={() => setShowForm(true)}>+ Add</button>
        </div>
        {properties.length === 0 ? (
          <div className="empty-state" style={{ marginBottom: '28px' }}>
            <div className="empty-icon"></div>
            <div className="empty-text">No listings yet. Click "Add New Listing" to create your first.</div>
          </div>
        ) : (
          <div style={{ marginBottom: '28px' }}>
            {properties.map((p) => {
              const isFeat = featuredIds.has(p.id);
              const isPropExpired = p.expires_at && new Date(p.expires_at) < now;
              return (
                <div key={p.id} className="my-prop-card">
                  <div className="mp-top">
                    <div className="mp-thumb" style={{ background: 'var(--gray-light)' }}>
                      <CategoryLogo category={p.category} size={32} />
                    </div>
                    <div className="mp-details">
                      <h3>{p.title}</h3>
                      <div className="mp-meta">{p.category} • {p.area || p.district} • {p.category === 'Guest Houses' ? (p.entry_fee > 0 ? `${Number(p.entry_fee).toLocaleString()} UGX entry` : 'Free entry') : p.category === 'Hotels' || p.category === 'Rentals' || p.category === 'Airbnb' ? `${Number(p.price).toLocaleString()} UGX/night` : `${Number(p.price).toLocaleString()} UGX/month`}</div>
                      <div className="mp-status-row">
                        <span className={`mp-status ${isPropExpired ? 'status-expired' : `status-${p.status}`}`}>
                          {isPropExpired ? 'expired' : p.status}
                        </span>
                        <span className={`mp-status ${p.is_active ? 'status-available' : 'status-expired'}`}>
                          {p.is_active ? 'visible' : 'hidden'}
                        </span>
                        {isFeat && <span className="badge featured"> Featured</span>}
                        {p.expires_at && !isPropExpired && (
                          <span className="mp-views"> {Math.ceil((new Date(p.expires_at).getTime() - now.getTime()) / 86400000)}d left</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mp-actions">
                    <button className="mp-btn edit" onClick={() => { setEditProp(p); setShowForm(true); }}> Edit</button>
                    <button className="mp-btn edit" onClick={() => toggleStatus(p.id, p.status)}>Change Status</button>
                    <button className="mp-btn edit" onClick={() => toggleActive(p.id, p.is_active)}>
                      {p.is_active ? 'Hide' : 'Show'}
                    </button>
                    {!isFeat && isPaid && (
                      <>
                        <button className="mp-btn wa" onClick={() => featureListing(p.id, 7, settings?.featured_7d_price ?? 10000)}>
                           Feature 7d
                        </button>
                        <button className="mp-btn wa" onClick={() => featureListing(p.id, 30, settings?.featured_30d_price ?? 30000)}>
                           Feature 30d
                        </button>
                      </>
                    )}
                    <a className="mp-btn wa" href={`https://wa.me/256${(p.whatsapp || '700123456').replace(/^0/, '')}`} target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp</a>
                    <button className="mp-btn del" onClick={() => deleteProperty(p.id)}> Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Payment history */}
        <div className="dash-section-title">Payment History</div>
        {payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <div className="empty-text">No payments yet.</div>
          </div>
        ) : (
          <table className="payment-table">
            <thead>
              <tr>
                <th>Date</th><th>Type</th><th>Plan</th><th>Amount</th><th>Reference</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr key={pay.id}>
                  <td>{new Date(pay.created_at).toLocaleDateString()}</td>
                  <td style={{ textTransform: 'capitalize' }}>{pay.type}</td>
                  <td>{planLabel(pay.plan_type)}</td>
                  <td><strong>{Number(pay.amount).toLocaleString()} {pay.currency || 'UGX'}</strong></td>
                  <td>{pay.reference || '—'}</td>
                  <td><span className={`pay-status ${pay.status}`}>{pay.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {showForm && (
        <ListingForm
          settings={settings}
          editProperty={editProp}
          onDone={() => { setShowForm(false); setEditProp(null); refresh(); }}
          onClose={() => { setShowForm(false); setEditProp(null); }}
        />
      )}

      {featuredModal && (
        <PaymentModal
          open={!!featuredModal}
          amount={featuredModal.amount}
          planType="free"
          propertyId={featuredModal.propertyId}
          durationDays={featuredModal.days}
          onClose={() => setFeaturedModal(null)}
          onSuccess={refresh}
        />
      )}

      {renewModal && (
        <PaymentModal
          open={!!renewModal}
          amount={renewModal.amount}
          planType={renewModal.plan}
          onClose={() => setRenewModal(null)}
          onSuccess={refresh}
        />
      )}

      {editProfile && (
        <EditProfileModal
          open={editProfile}
          onClose={() => setEditProfile(false)}
          onUpdated={refresh}
        />
      )}
    </>
  );
}
