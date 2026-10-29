import { useCallback, useEffect } from 'react';
import { playMokSound, preloadMokSound } from '../lib/mok-audio';

export function useMokSound() {
  useEffect(() => {
    void preloadMokSound();
  }, []);

  return useCallback(() => {
    void playMokSound();
  }, []);
}
