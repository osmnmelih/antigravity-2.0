// ─────────────────────────────────────────────────────────────────────────────
// ANTIGRAVITY 2.0 — Web Audio Synth Engine
// All sounds generated via Web Audio API (zero assets, instant load).
// ─────────────────────────────────────────────────────────────────────────────

// ── One-shot SFX Helper ──────────────────────────────────────────────────────

let _sfxCtx = null;

function _ctx() {
  if (typeof window === 'undefined') return null;
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return null;
  
  if (!_sfxCtx || _sfxCtx.state === 'closed') {
    _sfxCtx = new C();
  }
  
  // Force playback category to bypass physical silent mute switch on iOS
  if (typeof navigator !== 'undefined' && navigator.audioSession) {
    try {
      if (navigator.audioSession.type !== 'playback') {
        navigator.audioSession.type = 'playback';
      }
    } catch (e) {}
  }
  
  if (_sfxCtx.state === 'suspended') {
    _sfxCtx.resume().catch(() => {});
  }
  return _sfxCtx;
}

// Wrapper to guarantee the audio context is active before creating nodes
function _playSFX(playCallback) {
  try {
    const ctx = _ctx();
    if (!ctx) return;
    
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    
    // Play synchronously in the same callstack to satisfy iOS Safari autoplay security
    playCallback(ctx);
  } catch (e) {
    console.warn('SFX playback failed:', e);
  }
}

export function playClickSound() {
  _playSFX((ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(480, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.09);
  });
}

export function playUnlockSound() {
  _playSFX((ctx) => {
    const now = ctx.currentTime;
    [400, 640, 800].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      gain.gain.setValueAtTime(0.0, now + i * 0.09);
      gain.gain.linearRampToValueAtTime(0.08, now + i * 0.09 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.22);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + i * 0.09); osc.stop(now + i * 0.09 + 0.25);
    });
  });
}

export function playSuccessSound() {
  _playSFX((ctx) => {
    const now = ctx.currentTime;
    // 8-bit style upward chord C5→E5→G5→C6
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.0, now + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.07, now + i * 0.06 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.28);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + i * 0.06); osc.stop(now + i * 0.06 + 0.3);
    });
  });
}

export function playPingSound() {
  _playSFX((ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.4);
  });
}

// ── Background Music Engines Disabled ─────────────────────────────────────────
export function startAmbientSpaceMusic() {}
export function stopAmbientSpaceMusic() {}
export function startTenseMissionMusic() {}
export function stopTenseMissionMusic() {}
export function getAudioStatus() { return 'DISABLED'; }

// Global window event listener to resume AudioContext on first mobile user interaction
if (typeof window !== 'undefined') {
  const resumeAudio = () => {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    if (typeof navigator !== 'undefined' && navigator.audioSession) {
      try {
        navigator.audioSession.type = 'playback';
      } catch (e) {}
    }
    if (!_sfxCtx || _sfxCtx.state === 'closed') {
      _sfxCtx = new C();
    }
    if (_sfxCtx && _sfxCtx.state === 'suspended') {
      _sfxCtx.resume().then(() => {
        // Trigger a silent click buffer to warm up mobile audio hardware
        const osc = _sfxCtx.createOscillator();
        const gain = _sfxCtx.createGain();
        gain.gain.setValueAtTime(0.0001, _sfxCtx.currentTime);
        osc.connect(gain);
        gain.connect(_sfxCtx.destination);
        osc.start();
        osc.stop(_sfxCtx.currentTime + 0.01);
      }).catch((err) => console.log('Audio resume error:', err));
    }
  };
  window.addEventListener('touchend', resumeAudio);
  window.addEventListener('click', resumeAudio);
}

