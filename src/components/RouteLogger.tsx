import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteLogger() {
  const location = useLocation();

  useEffect(() => {
    console.log('🔄 Route changed:', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      timestamp: new Date().toISOString(),
      fullPath: location.pathname + location.search + location.hash
    });
  }, [location]);

  return null; // This component doesn't render anything
} 