/**
 * Random environmental-event modal. Variants: solar_storm,
 * pirate_interference, reactor_meltdown, black_hole. Pure presentational.
 */
export default function RandomEventOverlay({ randomEvent, randomEventTimer, onDismiss }) {
  if (!randomEvent) return null;
  const fmt = (n) => (n < 10 ? `0${n}` : `${n}`);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-center font-mono-cyber animate-fade-in border-4 border-ag-red">
      <div className="scanlines opacity-30" />
      <div className="absolute inset-0 bg-red-950/10 animate-pulse pointer-events-none" />
      <div className="ag-panel p-8 border-ag-red max-w-sm space-y-6 relative bg-ag-surface">
        <div className="text-ag-red text-3xl animate-bounce">🚨</div>

        {randomEvent === 'solar_storm' && (
          <>
            <h2 className="font-orbitron font-black text-lg text-ag-red tracking-wider uppercase">SOLAR STORM DETECTED</h2>
            <div className="text-[9px] text-ag-muted font-bold uppercase tracking-wider">ENVIRONMENT WARNING</div>
            <p className="text-xs text-ag-text leading-relaxed uppercase">
              Solar wind storm approaching. Navigation telemetry accuracy degraded.
            </p>
            <div className="text-ag-red font-bold border border-ag-red/30 bg-ag-red/5 py-2 rounded text-[10px] tracking-wider font-orbitron uppercase">
              SYSTEM COMPROMISED
            </div>
            <button
              onClick={onDismiss}
              className="w-full h-11 border border-ag-red text-ag-red hover:bg-ag-red/10 font-orbitron text-xs tracking-wider uppercase rounded-xl mt-4"
            >
              DISMISS WARNING
            </button>
          </>
        )}

        {randomEvent === 'pirate_interference' && (
          <>
            <h2 className="font-orbitron font-black text-lg text-ag-yellow tracking-wider uppercase">GRID INTERFERENCE</h2>
            <div className="text-[9px] text-ag-muted font-bold uppercase tracking-wider">BYPASS SEQUENCE REQUIRED</div>
            <p className="text-xs text-ag-text leading-relaxed uppercase">
              Unknown transmission interference detected. Solve decrypter link within time.
            </p>
            <div className="text-2xl font-orbitron font-bold text-ag-yellow animate-pulse">
              00:{fmt(randomEventTimer)}
            </div>
            <button
              onClick={onDismiss}
              className="w-full h-11 border border-ag-yellow text-ag-yellow bg-ag-yellow/5 hover:bg-ag-yellow/10 font-orbitron text-[10px] tracking-wider uppercase rounded-xl mt-4"
            >
              REBOOT LINK INTERFACE
            </button>
          </>
        )}

        {randomEvent === 'reactor_meltdown' && (
          <>
            <h2 className="font-orbitron font-black text-lg text-ag-red tracking-wider uppercase">PRESSURE DANGER</h2>
            <div className="text-[9px] text-ag-muted font-bold uppercase tracking-wider">EXCESS REACTOR BURST</div>
            <p className="text-xs text-ag-text leading-relaxed uppercase">
              Reactor core thermal stability exceeded. Perform tactical reposition immediately.
            </p>
            <button
              onClick={onDismiss}
              className="w-full h-11 bg-ag-red text-ag-bg border-none font-orbitron text-xs font-black tracking-wider uppercase rounded-xl mt-4 hover:opacity-90 transition-opacity"
            >
              DUMP THERMAL SYNC
            </button>
          </>
        )}

        {randomEvent === 'black_hole' && (
          <>
            <h2 className="font-orbitron font-black text-lg text-ag-purple tracking-wider uppercase">GRAVITY COLLAPSE</h2>
            <div className="text-[9px] text-ag-muted font-bold uppercase tracking-wider">GEODESIC COMPRESSION</div>
            <p className="text-xs text-ag-text leading-relaxed uppercase">
              Severe local gravity fluctuation. Lock coordinates and hold position static.
            </p>
            <div className="text-2xl font-orbitron font-bold text-ag-purple animate-pulse">
              00:{fmt(randomEventTimer)}
            </div>
            <div className="text-[9px] text-ag-muted uppercase tracking-widest animate-pulse mt-2">
              REMAIN ABSOLUTELY STATIC
            </div>
          </>
        )}
      </div>
    </div>
  );
}
