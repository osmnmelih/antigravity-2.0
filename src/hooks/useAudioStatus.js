import { useEffect, useState } from 'react';
import { getAudioStatus } from '../utils/audio.js';

/**
 * Polls the audio subsystem status at a fixed interval.
 * Preserves the original 1500ms cadence and error fallback exactly.
 */
export function useAudioStatus(intervalMs = 1500) {
  const [audioStatus, setAudioStatus] = useState('NO_CTX');

  useEffect(() => {
    const iv = setInterval(() => {
      try {
        setAudioStatus(getAudioStatus());
      } catch {
        setAudioStatus('ERR');
      }
    }, intervalMs);
    return () => clearInterval(iv);
  }, [intervalMs]);

  return audioStatus;
}
