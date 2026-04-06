import { useState, useCallback } from 'react';

interface UseRateLimitReturn {
  isRateLimited: boolean;
  showPaywall: boolean;
  dismissPaywall: () => void;
  handleRateLimitError: () => void;
}

export function useRateLimit(): UseRateLimitReturn {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const handleRateLimitError = useCallback(() => {
    setIsRateLimited(true);
    setShowPaywall(true);
  }, []);

  const dismissPaywall = useCallback(() => {
    setShowPaywall(false);
  }, []);

  return {
    isRateLimited,
    showPaywall,
    dismissPaywall,
    handleRateLimitError,
  };
}
