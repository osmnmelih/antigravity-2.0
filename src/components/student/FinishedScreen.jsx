/**
 * End-of-mission success screen. Pure presentational.
 */
export default function FinishedScreen({ onOpenResults, onExit }) {
  return (
    <div className="min-h-screen bg-ag-bg flex flex-col items-center justify-center p-6 text-center relative overflow-hidden cockpit-curve animate-fade-in">
      <div className="scanlines opacity-15" />

      <div className="z-10 space-y-6 max-w-xs">
        <div className="w-14 h-14 mx-auto rounded-full border border-ag-green bg-ag-green/5 flex items-center justify-center animate-pulse">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-ag-green">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <div className="space-y-1">
          <h1 className="font-orbitron text-xl font-black text-ag-green uppercase tracking-widest">MISSION SUCCESS</h1>
          <p className="text-xs text-ag-cyan font-bold tracking-wider uppercase">ANTIGRAVITY STABILIZED</p>
          <p className="text-[8px] text-ag-muted font-mono-cyber uppercase tracking-wider">ALL SYSTEMS ONLINE</p>
        </div>

        <div className="ag-panel p-4 text-[9px] text-ag-muted uppercase tracking-wider leading-relaxed">
          The crew successfully restored the vessel's primary beacons and cleared gravity distortion.
        </div>

        <div className="flex flex-col items-center gap-3 w-full">
          <button onClick={onOpenResults} className="ag-btn-primary w-full h-12 text-xs tracking-wider uppercase">
            Scoreboard
          </button>
          <button onClick={onExit} className="ag-btn-solid w-full h-12 text-xs tracking-wider uppercase">
            RETURN TO COMMAND
          </button>
        </div>
      </div>
    </div>
  );
}
