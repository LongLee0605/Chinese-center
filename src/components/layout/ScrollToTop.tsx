import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scroll window to top khi đổi route (SPA). */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
