/**
 * useLazyLoad Hook
 * Manages lazy loading state for components
 */

import { useState, useEffect } from 'react';

export function useLazyLoad(
  shouldLoad: boolean,
  delay: number = 0
): [boolean, () => void] {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (shouldLoad && !isLoaded) {
      if (delay > 0) {
        const timer = setTimeout(() => {
          setIsLoaded(true);
        }, delay);
        return () => clearTimeout(timer);
      } else {
        setIsLoaded(true);
      }
    }
  }, [shouldLoad, isLoaded, delay]);

  const forceLoad = () => setIsLoaded(true);

  return [isLoaded, forceLoad];
}