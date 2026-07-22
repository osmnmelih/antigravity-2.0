import { useRef, useEffect, useState } from 'react';
import { fmtDistance } from '../utils.js';

export default function ARView({ userPos, currentCp, distance, canUnlock, onUnlock, onClose, taskLoading, onCameraReady }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef   = useRef(null);

  const [cameraError, setCameraError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [initProgress, setInitProgress] = useState(0);
  const [initStage, setInitStage] = useState('REQUESTING CAMERA ACCESS');

  // Smoothly tick progress up to 95% while we wait for the camera to be ready
  useEffect(() => {
    if (cameraReady) {
      setInitProgress(100);
      setInitStage('SCANNER ONLINE');
      return;
    }
    const id = setInterval(() => {
      setInitProgress(p => (p < 95 ? Math.min(95, p + (95 - p) * 0.08 + 0.6) : p));
    }, 120);
    return () => clearInterval(id);
  }, [cameraReady]);

  // Camera initialization with fallbacks
  useEffect(() => {
    async function start() {
      let stream = null;
      try {
        setInitStage('REQUESTING CAMERA ACCESS');
        let constraints = { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false };
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const backCam = devices.filter(d => d.kind === 'videoinput').find(d =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          if (backCam) {
            constraints.video = { deviceId: { exact: backCam.deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } };
          }
        } catch (e) {
          // Proceed with default environment camera constraints
        }

        setInitStage('STARTING CAMERA STREAM');
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        }

        streamRef.current = stream;
        setInitStage('ATTACHING VIDEO SIGNAL');
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          if (videoRef.current.readyState >= 1) {
            setCameraReady(true);
            onCameraReady?.();
          } else {
            setInitStage('STABILIZING SCANNER');
          }
        }
      } catch (err) {
        console.error('Camera startup failed:', err);
        setCameraError('Camera access denied. Please allow camera access in browser settings.');
      }
    }
    start();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Simple Canvas Focus drawing function (no high-frequency loop)
  useEffect(() => {
    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h * 0.45;
      const boxSize = Math.min(w, h) * 0.28;
      // Logo palette: cyan (acquiring) → gold (in-range lock)
      const neonColor = canUnlock ? '#FFC800' : '#00FFD2';

      // Draw minimal modern camera focusing brackets
      ctx.strokeStyle = neonColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = neonColor;
      ctx.shadowBlur = 10;

      const half = boxSize / 2;
      const len = 20; // length of corner lines

      // Top-Left Corner
      ctx.beginPath();
      ctx.moveTo(cx - half, cy - half + len);
      ctx.lineTo(cx - half, cy - half);
      ctx.lineTo(cx - half + len, cy - half);
      ctx.stroke();

      // Top-Right Corner
      ctx.beginPath();
      ctx.moveTo(cx + half, cy - half + len);
      ctx.lineTo(cx + half, cy - half);
      ctx.lineTo(cx + half - len, cy - half);
      ctx.stroke();

      // Bottom-Left Corner
      ctx.beginPath();
      ctx.moveTo(cx - half, cy + half - len);
      ctx.lineTo(cx - half, cy + half);
      ctx.lineTo(cx - half + len, cy + half);
      ctx.stroke();

      // Bottom-Right Corner
      ctx.beginPath();
      ctx.moveTo(cx + half, cy + half - len);
      ctx.lineTo(cx + half, cy + half);
      ctx.lineTo(cx + half - len, cy + half);
      ctx.stroke();

      // Display distance or status in the center of the crosshair brackets
      const textLabel = (distance != null) ? fmtDistance(distance) : 'ACQUIRING GPS...';
      ctx.shadowBlur = 0;
      ctx.font = '900 22px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Semitransparent background pill for maximum readability over camera stream
      const tw = ctx.measureText(textLabel).width;
      ctx.fillStyle = 'rgba(10,3,20,0.7)';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(cx - tw/2 - 14, cy - 18, tw + 28, 36, 8) : ctx.rect(cx - tw/2 - 14, cy - 18, tw + 28, 36);
      ctx.fill();

      // Render the text
      ctx.fillStyle = neonColor;
      ctx.shadowColor = neonColor;
      ctx.shadowBlur = 8;
      ctx.fillText(textLabel, cx, cy);
      ctx.shadowBlur = 0;
    }
    
    draw();
    window.addEventListener('resize', draw);
    return () => {
      window.removeEventListener('resize', draw);
    };
  }, [distance, canUnlock]);

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden select-none font-orbitron">
      {/* Camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onLoadedMetadata={() => { setCameraReady(true); onCameraReady?.(); }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* AR canvas overlay */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Camera warm-up progress overlay */}
      {!cameraReady && !cameraError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-ag-bg/85 backdrop-blur-sm px-6">
          <div className="cockpit-panel w-full max-w-sm px-6 py-7 text-center space-y-5">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-ag-cyan animate-pulse" />
              <span className="font-orbitron font-black text-ag-cyan text-sm tracking-[0.3em]">
                INITIALIZING SCANNER
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="h-2 w-full rounded-full bg-[rgba(0,255,210,0.08)] border border-ag-cyan/30 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-ag-cyan to-ag-yellow transition-[width] duration-150 ease-out"
                  style={{ width: `${Math.round(initProgress)}%`, boxShadow: '0 0 12px rgba(0,255,210,0.6)' }}
                />
              </div>
              <div className="flex justify-between font-mono-cyber text-[10px] uppercase tracking-widest">
                <span className="text-ag-text/70">{initStage}</span>
                <span className="text-ag-yellow font-black">{Math.round(initProgress)}%</span>
              </div>
            </div>

            <p className="font-mono-cyber text-[10px] text-ag-muted uppercase tracking-wider leading-relaxed">
              [ ALLOW CAMERA ACCESS IF PROMPTED ]
            </p>
          </div>
        </div>
      )}

      {/* Top HUD panel */}
      <div
        className="absolute top-0 left-0 right-0 px-4 pt-safe-top pb-6 flex items-start justify-center z-20"
        style={{ background: 'linear-gradient(to bottom, rgba(10,3,20,0.85) 0%, transparent 100%)' }}
      >
        <div className="cockpit-panel px-6 py-3 flex items-center gap-4 max-w-md w-full">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-ag-cyan animate-pulse" />
              <span className="font-orbitron font-black text-ag-cyan text-sm tracking-[0.25em]">STATION FINDER</span>
            </div>
            {currentCp && (
              <div className="font-mono-cyber text-[11px] text-ag-text/80 uppercase tracking-widest truncate">
                TARGET: {currentCp.label}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="cockpit-btn-secondary px-4 py-2 text-xs tracking-[0.2em] shrink-0"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Camera error state */}
      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-ag-bg/95 p-8 text-center z-30">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ag-red mb-4">
            <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
          <p className="text-ag-red text-sm mb-6 uppercase tracking-wider font-orbitron">{cameraError}</p>
          <button onClick={onClose} className="cockpit-btn-secondary px-8 py-4 text-sm tracking-[0.25em]">← Go Back</button>
        </div>
      )}

      {/* In-range target lock indicator */}
      {canUnlock && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div
            className="w-36 h-36 rounded-full border-4 border-ag-yellow animate-ping"
            style={{ animationDuration: '3s', boxShadow: '0 0 28px rgba(255,200,0,0.55)' }}
          />
        </div>
      )}

      {/* Bottom control panel */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 pb-10 pt-6 z-20"
        style={{ background: 'linear-gradient(to top, rgba(10,3,20,0.92) 0%, transparent 100%)' }}
      >
        <div className="max-w-md mx-auto space-y-3">
          {canUnlock ? (
            <button
              onClick={onUnlock}
              disabled={!cameraReady || taskLoading}
              className="cockpit-btn w-full px-8 py-5 text-sm tracking-[0.25em]"
            >
              {!cameraReady ? 'INITIALIZING CAMERA...' : taskLoading ? 'PREPARING TASK...' : 'START CHALLENGE 🚀'}
            </button>
          ) : (
            <div className="cockpit-panel px-6 py-5 text-center">
              <div className="text-sm font-orbitron font-black text-ag-yellow tracking-[0.25em] uppercase mb-2">
                STATION NOT REACHED
              </div>
              <p className="text-ag-text/80 text-[11px] font-mono-cyber uppercase tracking-wider leading-relaxed">
                [ WALK TOWARDS THE STATION — WITHIN {UNLOCK_DISTANCE}M TO START ]
              </p>
            </div>
          )}
          <button
            onClick={onClose}
            className="cockpit-btn-secondary w-full px-8 py-4 text-xs tracking-[0.25em]"
          >
            ← BACK TO MAP
          </button>
        </div>

      </div>
    </div>
  );
}

const UNLOCK_DISTANCE = 20;
