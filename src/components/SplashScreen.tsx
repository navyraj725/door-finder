import { useEffect, useState } from 'react';
import BrandMark from './BrandMark';

export default function SplashScreen() {
  const [hide, setHide] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHide(true), 3300);
    return () => clearTimeout(t);
  }, []);
  if (hide) return null;
  return (
    <div className="splash-screen">
      <div className="splash-logo"><BrandMark size={120} /></div>
      <div className="splash-text">
        <span className="splash-door">Door</span><span className="splash-finder">Finder</span>
      </div>
      <div className="splash-tagline">Find Your Next Home in Uganda</div>
      <div className="splash-loader"><div className="splash-loader-bar" /></div>
    </div>
  );
}
