/**
 * Full-screen rankings overlay shown while the student is mid-mission.
 * Pure presentational — owns no state.
 */
export default function RankingsOverlay({
  resultsData,
  resultsLoading: _resultsLoading, // reserved; kept in API for parity
  session,
  team,
  checkpointCount,
  onClose,
}) {
  const sorted = resultsData?.teams
    ?.map(t => ({
      ...t,
      totalScore: t.completions?.reduce((s, c) => s + (c.score || 0), 0) || 0,
      done: t.completions?.length || 0,
    }))
    .sort((a, b) => b.totalScore - a.totalScore) || [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-cyber-bg">
      <div className="scanlines opacity-30" />
      <div className="bg-cyber-card border-b border-cyber-border px-4 py-4 flex items-center justify-between z-10">
        <div>
          <h2 className="font-orbitron font-black text-cyber-cyan text-sm tracking-wider">GALACTIC RANKINGS</h2>
          <p className="text-[10px] text-cyber-muted font-mono-cyber uppercase mt-0.5">{session?.name}</p>
        </div>
        <button onClick={onClose} className="text-xl text-cyber-muted font-bold">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 z-10">
        {sorted.length === 0 ? (
          <div className="hud-panel p-6 text-center text-cyber-muted text-xs font-mono-cyber uppercase border-cyber-border/30 bg-cyber-bg/40">
            No active telemetry rankings logged yet.
          </div>
        ) : (
          sorted.map((t, i) => {
            const isMe = t.id === team?.id;
            return (
              <div key={t.id} className="rounded-xl px-4 py-3 flex items-center gap-3 border border-cyber-border"
                style={{ background: isMe ? 'rgba(0,255,210,0.06)' : '#160C2C' }}>
                <span className="font-orbitron font-bold text-cyber-cyan text-sm w-6">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-cyber-text truncate">{t.name}</div>
                  <div className="text-[10px] text-cyber-muted font-mono-cyber">{t.done}/{checkpointCount} nodes secured</div>
                </div>
                <span className="font-orbitron font-bold text-cyber-cyan text-sm">{t.totalScore} SYS</span>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 z-10">
        <button onClick={onClose} className="cyber-btn-cyan w-full h-12 font-orbitron text-xs tracking-wider uppercase">
          Resume Telemetry HUD
        </button>
      </div>
    </div>
  );
}
