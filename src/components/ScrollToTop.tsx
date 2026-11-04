import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls to top on route changes, unless the user is navigating to
 * an in-page hash anchor. Respects the sticky header height so the
 * destination heading is not covered.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return;
      }
    }

    if (pathname !== prevPath.current) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      prevPath.current = pathname;
    }
  }, [pathname, hash]);

  return null;
}
