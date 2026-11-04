import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import { supabase, type AdminSettings } from '@/lib/supabase';
import SplashScreen from '@/components/SplashScreen';
import BrandMark from '@/components/BrandMark';
import ScrollToTop from '@/components/ScrollToTop';
import Header from '@/components/Header';
import AuthModal from '@/components/AuthModal';
import Browse from '@/components/Browse';
import Pricing from '@/components/Pricing';
import Dashboard from '@/components/Dashboard';
import AdminDashboard from '@/components/AdminDashboard';
import AdminLogin from '@/components/AdminLogin';
import LocationDirectory from '@/components/LocationDirectory';
import InfoPages, { type InfoPage } from '@/components/InfoPages';
import ReportPage from '@/components/ReportPage';
import { fetchLocationsByLevel, buildLocationPath, type UgandaLocation } from '@/lib/locations';

function AppContent() {
  const { profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [paySuccess, setPaySuccess] = useState(false);
  const [payCancel, setPayCancel] = useState(false);

  useEffect(() => {
    supabase
      .from('admin_settings')
      .select('*')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(data as AdminSettings);
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setPaySuccess(true);
      navigate('/dashboard');
      setTimeout(() => setPaySuccess(false), 6000);
    } else if (params.get('payment') === 'cancel') {
      setPayCancel(true);
      setTimeout(() => setPayCancel(false), 6000);
    }
  }, []);

  function refreshSettings() {
    supabase
      .from('admin_settings')
      .select('*')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (data) setSettings(data as AdminSettings); });
  }

  function handleTabChange(tab: string) {
    if (tab === 'dashboard' && !profile) {
      setAuthOpen(true);
      return;
    }
    if (tab === 'admin') {
      navigate('/admin');
      return;
    }
    if (tab === 'browse') navigate('/');
    else if (tab === 'pricing') navigate('/pricing');
    else if (tab === 'dashboard') navigate('/dashboard');
  }

  function handleSignOut() {
    signOut();
    navigate('/');
  }

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isInfoRoute = ['/about', '/terms', '/privacy', '/cookies'].includes(location.pathname);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--gray-bg)' }}>
        <div style={{ fontSize: '16px', color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      {!isAdminRoute && (
        <>
          <Header
            currentTab={location.pathname}
            onTabChange={handleTabChange}
            onAuthClick={() => setAuthOpen(true)}
            onSignOut={handleSignOut}
            isLoggedIn={!!profile}
            userName={profile?.full_name || profile?.email?.split('@')[0] || null}
            isAdmin={profile?.role === 'admin'}
          />
          <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
        </>
      )}

      {paySuccess && !isAdminRoute && (
        <div className="notif-banner success" style={{ maxWidth: '700px', margin: '16px auto 0' }}>
          <div className="notif-icon"></div>
          <div className="notif-text"><strong>Payment Successful!</strong>Your subscription has been activated. You can now post unlimited listings.</div>
        </div>
      )}
      {payCancel && !isAdminRoute && (
        <div className="notif-banner warn" style={{ maxWidth: '700px', margin: '16px auto 0' }}>
          <div className="notif-icon"></div>
          <div className="notif-text"><strong>Payment Cancelled</strong>Your payment was not completed. You can try again anytime.</div>
        </div>
      )}

      {/* Mobile bottom nav */}
      {!isAdminRoute && !isInfoRoute && (
        <nav className="mobile-bottom-nav">
          <button className={`mb-nav-btn ${location.pathname === '/' || location.pathname.startsWith('/uganda') ? 'active' : ''}`} onClick={() => navigate('/')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
            <span>Browse</span>
          </button>
          <button className={`mb-nav-btn ${location.pathname === '/pricing' ? 'active' : ''}`} onClick={() => navigate('/pricing')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            <span>Pricing</span>
          </button>
          <button className={`mb-nav-btn ${location.pathname === '/dashboard' ? 'active' : ''}`} onClick={() => profile ? navigate('/dashboard') : setAuthOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Dashboard</span>
          </button>
          {profile ? (
            <button className="mb-nav-btn" onClick={handleSignOut}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              <span>Sign Out</span>
            </button>
          ) : (
            <button className="mb-nav-btn" onClick={() => setAuthOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
              <span>Sign In</span>
            </button>
          )}
        </nav>
      )}

      <Routes>
        <Route path="/" element={<Browse isLoggedIn={!!profile} onRequireAuth={() => setAuthOpen(true)} />} />
        <Route path="/pricing" element={<Pricing settings={settings} onRequireAuth={() => setAuthOpen(true)} />} />
        <Route path="/dashboard" element={
          profile ? <Dashboard settings={settings} onRequireAuth={() => setAuthOpen(true)} onNavigatePricing={() => navigate('/pricing')} /> : <SignInPrompt onAuthClick={() => setAuthOpen(true)} />
        } />
        <Route path="/admin" element={
          profile?.role === 'admin' ? <AdminDashboard settings={settings} onSettingsChange={refreshSettings} /> : <AdminLogin />
        } />
        <Route path="/report" element={<ReportPage onRequireAuth={() => setAuthOpen(true)} />} />
        <Route path="/about" element={<InfoPages page="about" onNavigate={(p) => navigate(`/${p}`)} />} />
        <Route path="/terms" element={<InfoPages page="terms" onNavigate={(p) => navigate(`/${p}`)} />} />
        <Route path="/privacy" element={<InfoPages page="privacy" onNavigate={(p) => navigate(`/${p}`)} />} />
        <Route path="/cookies" element={<InfoPages page="cookies" onNavigate={(p) => navigate(`/${p}`)} />} />
        <Route path="/uganda" element={<UgandaOverview onNavigate={(p) => navigate(p)} />} />
        <Route path="/uganda/:region" element={<LocationDirectoryRouter onNavigate={(p) => navigate(p)} />} />
        <Route path="/uganda/:region/:district" element={<LocationDirectoryRouter onNavigate={(p) => navigate(p)} />} />
        <Route path="/uganda/:region/:district/:category" element={<LocationDirectoryRouter onNavigate={(p) => navigate(p)} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isAdminRoute && !isInfoRoute && (
        <>
          <div className="promo-strip"> One subscription for Houses, Apartments, Hotels &amp; Guest Houses — post unlimited listings with Premium!</div>
          <footer className="site-footer">
            <div className="footer-brand">
              <BrandMark className="footer-logo" size={56} />
              <div className="brand-name"><strong>Door</strong> <span>Finder</span></div>
              <p>Uganda's all-in-one marketplace for houses, apartments, hotels &amp; guest houses. Find verified listings across all districts.</p>
              <div className="copyright">© 2026 Door Finder Uganda. All rights reserved.</div>
            </div>
            <div className="footer-col">
              <h4>Browse</h4>
              <ul>
                <li><a onClick={() => navigate('/')}>All Listings</a></li>
                <li><a onClick={() => navigate('/pricing')}>Pricing</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Account</h4>
              <ul>
                <li><a onClick={() => profile ? navigate('/dashboard') : setAuthOpen(true)}>My Dashboard</a></li>
                <li><a onClick={() => setAuthOpen(true)}>Sign In</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <ul>
                <li><a onClick={() => navigate('/about')}>About Us</a></li>
                <li><a onClick={() => navigate('/terms')}>Terms of Service</a></li>
                <li><a onClick={() => navigate('/privacy')}>Privacy Policy</a></li>
                <li><a onClick={() => navigate('/cookies')}>Cookie Policy</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Browse Uganda</h4>
              <ul>
                <li><a onClick={() => navigate('/uganda')}>All Uganda</a></li>
                <li><a onClick={() => navigate('/uganda/central/kampala')}>Kampala</a></li>
                <li><a onClick={() => navigate('/uganda/central/wakiso')}>Wakiso</a></li>
                <li><a onClick={() => navigate('/uganda/eastern/jinja')}>Jinja</a></li>
                <li><a onClick={() => navigate('/uganda/western/mbarara')}>Mbarara</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <ul>
                <li><a onClick={() => navigate('/report')}>Report a Scammer</a></li>
                <li><a href="https://wa.me/256743824988" target="_blank" rel="noreferrer">WhatsApp: +256 743 824988</a></li>
                <li><a href="mailto:doorfinderug@gmail.com">doorfinderug@gmail.com</a></li>
              </ul>
            </div>
          </footer>
        </>
      )}
    </>
  );
}

function SignInPrompt({ onAuthClick }: { onAuthClick: () => void }) {
  return (
    <div className="section" style={{ maxWidth: '600px', margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
      <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Sign In Required</h2>
      <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Please sign in to view your dashboard.
      </p>
      <button className="submit-btn" onClick={onAuthClick}>Sign In</button>
    </div>
  );
}

function LocationDirectoryRouter({ onNavigate }: { onNavigate: (p: string) => void }) {
  const params = new URLSearchParams(useLocation().search);
  const path = useLocation().pathname;
  const parts = path.replace(/^\/uganda\//, '').replace(/\/$/, '').split('/');
  const categorySlugs = ['houses-for-rent', 'houses-for-sale', 'apartments', 'hotels', 'rentals', 'guest-houses', 'warehouses', 'airbnb'];
  const lastPart = parts[parts.length - 1];
  const isCategory = categorySlugs.includes(lastPart);
  const slug = isCategory ? parts[parts.length - 2] || parts[0] : lastPart;
  const categorySlug = isCategory ? lastPart : undefined;

  if (!slug || slug === '') {
    return <UgandaOverview onNavigate={onNavigate} />;
  }

  return <LocationDirectory slug={slug} categorySlug={categorySlug} onNavigate={onNavigate} />;
}

function UgandaOverview({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [districts, setDistricts] = useState<UgandaLocation[]>([]);
  useEffect(() => {
    fetchLocationsByLevel('district').then(setDistricts);
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--navy) 0%, #1a3a5c 100%)', color: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Uganda Property Directory</h1>
        <p style={{ fontSize: '15px', opacity: 0.9, lineHeight: 1.6 }}>
          Explore property listings across Uganda. Browse by region, district, city, or town to find houses, apartments, hotels, and real estate for rent and sale.
        </p>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Browse by District</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
        {districts.map((d) => (
          <button
            key={d.id}
            onClick={() => onNavigate(buildLocationPath(d))}
            style={{ background: 'white', border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left', font: 'inherit', color: 'var(--text)' }}
          >
            {d.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SplashScreen />
      <AppContent />
    </AuthProvider>
  );
}
