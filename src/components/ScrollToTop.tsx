// src/ScrollToTop.tsx
import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === 'PUSH' || navigationType === 'REPLACE') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth', // Optional: Remove for instant scroll
      });
    }
  }, [pathname, navigationType]);

  return null;
};

export default ScrollToTop;
