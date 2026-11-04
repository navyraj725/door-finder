import { useNavigate, useLocation } from 'react-router-dom';
import BrandMark from './BrandMark';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onAuthClick: () => void;
  onSignOut: () => void;
  isLoggedIn: boolean;
  userName: string | null;
  isAdmin: boolean;
}

const TABS: { key: string; label: string; icon: string; path: string }[] = [
  { key: 'browse', label: 'Browse', icon: '', path: '/' },
  { key: 'pricing', label: 'Pricing', icon: '', path: '/pricing' },
  { key: 'dashboard', label: 'My Dashboard', icon: '', path: '/dashboard' },
];

export default function Header({ onTabChange, onAuthClick, onSignOut, isLoggedIn, userName, isAdmin }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  function isActive(path: string) {
    if (path === '/') return currentPath === '/' || currentPath.startsWith('/uganda');
    return currentPath.startsWith(path);
  }

  return (
    <header className="site-header">
      <div className="logo" onClick={() => navigate('/')}>
        <BrandMark className="brand-logo" size={44} />
        <div className="logo-text">
          <div className="brand"><strong>Door</strong> <span>finder</span></div>
          <div className="tagline"><span>Find Your Next Home in Uganda</span></div>
        </div>
      </div>
      <nav className="header-nav">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`nav-btn ${isActive(t.path) ? 'navy' : 'outline'}`}
            onClick={() => onTabChange(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
        {isAdmin && (
          <button
            className="nav-btn outline"
            onClick={() => navigate('/admin')}
          >
             Admin
          </button>
        )}
        {isLoggedIn ? (
          <>
            <span className="nav-btn outline" style={{ cursor: 'default', background: 'var(--green-light)', color: 'var(--green-dark)', border: 'none' }}>
               {userName}
            </span>
            <button className="nav-btn amber" onClick={onSignOut}>Sign Out</button>
          </>
        ) : (
          <button className="nav-btn green" onClick={onAuthClick}> Sign In</button>
        )}
      </nav>
    </header>
  );
}
