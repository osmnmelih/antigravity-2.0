import { playClickSound } from '../../utils/audio.js';

/**
 * "Sector reached" discovery overlay shown when the player gets close enough
 * to the current checkpoint. Pure presentational.
 */
export default function DiscoveryOverlay({ currentCp, onConfirm }) {
  if (!currentCp) return null;
  return (
    <div className="fixed inset-0 z-50 bg-ag-bg/95 flex flex-col items-center justify-center p-6 text-center font-mono-cyber">
      <div className="scanlines opacity-20" />
      <div className="ag-panel p-8 border-ag-cyan max-w-sm space-y-6 relative bg-ag-surface">
        <div className="w-16 h-16 mx-auto rounded-full border border-ag-cyan/30 relative flex items-center justify-center bg-ag-cyan/5">
          <div className="absolute inset-0 border-2 border-ag-cyan rounded-full animate-ping" style={{ animationDuration: '2s' }} />
          <div className="text-ag-cyan text-2xl">📡</div>
        </div>
        <div className="space-y-2">
          <h2 className="font-orbitron font-black text-xl text-ag-cyan tracking-wider uppercase">SECTOR REACHED</h2>
          <div className="text-lg font-bold text-ag-text uppercase">NODE {currentCp.order_num || currentCp.label}</div>
          <span className="text-[9px] text-ag-red font-bold border border-ag-red/30 bg-ag-red/5 px-2.5 py-1 rounded font-orbitron tracking-widest uppercase animate-pulse">
            ANOMALY DETECTED
          </span>
        </div>
        <p className="text-[9px] text-ag-muted uppercase tracking-widest leading-relaxed">
          Emergency transmitter synchronized. Initiate beacon scan calibrate immediately.
        </p>
        <button
          onClick={() => { playClickSound(); onConfirm(); }}
          className="ag-btn-solid w-full h-12 text-xs tracking-wider uppercase"
        >
          CONNECT TELEMETRY ➔
        </button>
      </div>
    </div>
  );
}
