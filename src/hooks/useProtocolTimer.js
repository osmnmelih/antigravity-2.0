import { useEffect, useState } from 'react';
import { playClickSound, playSuccessSound } from '../utils/audio.js';

/**
 * Owns the protocol-timer state and its 1Hz countdown effect.
 * Setters are exposed with their original names so call sites do not change.
 *
 * Behavior preserved: every tick plays a click sound; reaching 0 disables the
 * timer and plays a success sound. Sound errors are swallowed.
 */
export function useProtocolTimer(initialSeconds = 45) {
  const [protocolTimerActive, setProtocolTimerActive] = useState(false);
  const [protocolTimeLeft, setProtocolTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    let timerId;
    if (protocolTimerActive && protocolTimeLeft > 0) {
      timerId = setTimeout(() => {
        setProtocolTimeLeft(prev => prev - 1);
        try { playClickSound(); } catch { /* ignore */ }
      }, 1000);
    } else if (protocolTimerActive && protocolTimeLeft === 0) {
      setProtocolTimerActive(false);
      try { playSuccessSound(); } catch { /* ignore */ }
    }
    return () => clearTimeout(timerId);
  }, [protocolTimerActive, protocolTimeLeft]);

  return {
    protocolTimerActive,
    protocolTimeLeft,
    setProtocolTimerActive,
    setProtocolTimeLeft,
  };
}
