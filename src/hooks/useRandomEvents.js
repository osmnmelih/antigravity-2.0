import { useEffect, useState } from 'react';
import { playPingSound } from '../utils/audio.js';

const PHASE_MAP = 'map';
const TIMED_EVENTS = new Set(['pirate_interference', 'black_hole']);

/**
 * Schedules random environmental events while the player is on the MAP phase
 * and counts down the timer for time-bounded events.
 *
 * Behavior preserved exactly:
 *  - 45s check interval, 25% trigger chance, no overlap with an active event.
 *  - `pirate_interference` → 30s timer, `black_hole` → 20s timer.
 *  - When a timed event reaches 0, it is cleared.
 *
 * Setters are exposed with their original names so JSX dismissal handlers
 * (`onClick={() => setRandomEvent(null)}`) work without changes.
 */
export function useRandomEvents(phase) {
  const [randomEvent, setRandomEvent] = useState(null);
  const [randomEventTimer, setRandomEventTimer] = useState(0);

  // Scheduler
  useEffect(() => {
    if (phase !== PHASE_MAP) return;
    const interval = setInterval(() => {
      if (randomEvent) return; // avoid overlapping alerts
      const rand = Math.random();
      if (rand < 0.25) {
        const events = ['solar_storm', 'pirate_interference', 'reactor_meltdown', 'black_hole'];
        const chosen = events[Math.floor(Math.random() * events.length)];
        setRandomEvent(chosen);
        try { playPingSound(); } catch { /* ignore */ }

        if (chosen === 'pirate_interference') setRandomEventTimer(30);
        else if (chosen === 'black_hole') setRandomEventTimer(20);
      }
    }, 45000);
    return () => clearInterval(interval);
  }, [phase, randomEvent]);

  // Timed event countdown
  useEffect(() => {
    let timerId;
    if (randomEvent && TIMED_EVENTS.has(randomEvent) && randomEventTimer > 0) {
      timerId = setTimeout(() => {
        setRandomEventTimer(prev => prev - 1);
      }, 1000);
    } else if (randomEvent && randomEventTimer === 0 && TIMED_EVENTS.has(randomEvent)) {
      setRandomEvent(null);
    }
    return () => clearTimeout(timerId);
  }, [randomEvent, randomEventTimer]);

  return { randomEvent, randomEventTimer, setRandomEvent, setRandomEventTimer };
}
