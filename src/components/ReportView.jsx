import { fmtTime } from '../utils.js';

function Section({ title, icon, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3.5 border-b border-[rgba(0,255,210,0.2)] pb-2">
        <span className="text-lg">{icon}</span>
        <h3 className="font-orbitron font-black text-xs text-ag-cyan tracking-[0.25em] uppercase">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function ReportView({ report }) {
  if (!report) return null;
  const { session, teams: teamStats } = report;

  const overallPerformance = report.overallSquadSync || report.narrative || "System diagnostic report finalized.";
  const syncLevel =
    overallPerformance.toLowerCase().includes('high') || overallPerformance.toLowerCase().startsWith('stable') || overallPerformance.toLowerCase().includes('generated') || overallPerformance.toLowerCase().includes('strong')
      ? { color: '#00FF88', border: 'rgba(0,255,136,0.3)', bg: 'rgba(0,255,136,0.06)'  }
      : overallPerformance.toLowerCase().includes('medium') || overallPerformance.toLowerCase().includes('warn')
      ? { color: '#FFC800', border: 'rgba(255,200,0,0.3)', bg: 'rgba(255,200,0,0.06)'  }
      : { color: '#FF0055', border: 'rgba(255,0,85,0.3)', bg: 'rgba(255,0,85,0.06)'  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-2">

      {/* Header Info Banner */}
      <div className="cockpit-panel p-8 space-y-5">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl border border-ag-cyan/35 bg-ag-cyan/10 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,210,0.2)] shrink-0">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-ag-cyan animate-pulse">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <div>
            <h2 className="font-orbitron font-black text-ag-yellow text-xl tracking-wider uppercase">// SESSION EVALUATION REPORT</h2>
            <p className="text-xs text-ag-muted font-mono-cyber uppercase tracking-widest mt-1">
              Class session: <span className="text-ag-text font-bold">{session?.name || 'Active Session'}</span> · PIN Code: <span className="text-ag-gold font-bold">{session?.code || 'N/A'}</span>
            </p>
          </div>
        </div>

        {/* Diagnostic Status Box */}
        <div className="rounded-xl border p-5 font-mono-cyber" style={{ borderColor: syncLevel.border, background: syncLevel.bg }}>
          <div className="text-[10px] text-ag-muted uppercase tracking-widest mb-2 font-bold">// SUMMARY EVALUATION</div>
          <div className="text-sm leading-relaxed text-ag-text" style={{ textShadow: `0 0 8px ${syncLevel.color}40` }}>
            {overallPerformance}
          </div>
        </div>
      </div>

      {/* Grid Layout for details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Results / Leaderboard */}
        {teamStats?.length > 0 && (
          <Section title="Leaderboard & metrics" icon="📊">
            <div className="space-y-4">
              {[...teamStats].sort((a, b) => b.totalScore - a.totalScore).map((t, i) => (
                <div key={t.teamName} className="cockpit-panel px-5 py-4.5 flex items-center gap-4">
                  <span
                    className="font-orbitron font-black text-xl w-8 text-center shrink-0"
                    style={{ color: i === 0 ? '#FFC800' : i === 1 ? '#00FFD2' : 'var(--ag-muted)' }}
                  >
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-orbitron font-black text-ag-text text-base uppercase tracking-wide truncate">{t.teamName}</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-ag-muted font-mono-cyber uppercase mt-1.5">
                      <span className="text-ag-green font-bold">{t.completionRate}% Done</span>
                      <span>{fmtTime(t.avgTimeSeconds)} average</span>
                      <span className="text-ag-yellow font-bold">{t.totalHintsUsed} hints</span>
                    </div>
                  </div>
                  <span className="font-orbitron font-black text-ag-cyan text-2xl tracking-wider shrink-0">
                    {t.totalScore}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Pedagogical Observations */}
        {(report.squadDiagnostics?.length > 0 || report.teamObservations?.length > 0) && (
          <Section title="Squad Observations" icon="👁️">
            <div className="space-y-4">
              {(report.squadDiagnostics || report.teamObservations).map((t, i) => (
                <div key={i} className="cockpit-panel px-5 py-4 space-y-2 border-l-3" style={{ borderLeftColor: 'var(--ag-cyan)' }}>
                  <div className="font-orbitron font-bold text-ag-yellow text-sm uppercase tracking-wider">{t.team || t.teamName}</div>
                  <div className="text-ag-text text-xs leading-relaxed font-mono-cyber">{t.observation}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Highlights */}
        {(report.missionHighlights?.length > 0 || report.highlights?.length > 0) && (
          <Section title="Physical Activity Highlights" icon="🔥">
            <div className="cockpit-panel p-6 space-y-4 font-mono-cyber">
              {(report.missionHighlights || report.highlights).map((h, i) => (
                <div key={i} className="flex gap-4.5 text-xs text-ag-text leading-relaxed">
                  <span className="text-ag-cyan font-bold select-none shrink-0">[0{i+1}]</span>
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Classroom Suggestions & Lesson Upgrades */}
        {(report.efficiencyUpgrades?.length > 0 || report.suggestions?.length > 0) && (
          <Section title="Curriculum Integration Suggestions" icon="🎓">
            <div className="cockpit-panel p-6 space-y-4 font-mono-cyber">
              {(report.efficiencyUpgrades || report.suggestions).map((s, i) => (
                <div key={i} className="flex gap-4 text-xs text-ag-muted leading-relaxed">
                  <span className="text-ag-yellow font-bold select-none shrink-0">➔</span>
                  <span className="text-ag-text/90">{s}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

      </div>

      {/* Detail Checkpoint Breakdown Section */}
      {teamStats?.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-3">
            <span className="text-lg">🎯</span>
            <h3 className="font-orbitron font-black text-sm text-ag-yellow tracking-[0.25em] uppercase">// DETAILED CHECKPOINT METRICS</h3>
          </div>
          
          <div className="space-y-5">
            {teamStats.map((team) => (
              <div key={team.teamName} className="cockpit-panel p-6 space-y-4">
                <div className="border-b border-[rgba(255,255,255,0.08)] pb-3 flex justify-between items-center">
                  <span className="font-orbitron font-black text-base text-ag-cyan tracking-wider uppercase">{team.teamName}</span>
                  <span className="text-xs font-mono-cyber text-ag-muted">{team.checkpointsCompleted} of {team.totalCheckpoints} Stations Secured</span>
                </div>

                {team.completionsList && team.completionsList.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-mono-cyber text-xs">
                      <thead>
                        <tr className="border-b border-[rgba(255,255,255,0.05)] text-ag-muted uppercase text-[9px] tracking-wider">
                          <th className="py-2.5 px-2">Checkpoint Station</th>
                          <th className="py-2.5 px-2">Challenge Type</th>
                          <th className="py-2.5 px-2 text-center">Time Spent</th>
                          <th className="py-2.5 px-2 text-center">Hints Used</th>
                          <th className="py-2.5 px-2 text-center">Points</th>
                          <th className="py-2.5 px-2">Submitted Answer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {team.completionsList.map((comp, idx) => (
                          <tr key={idx} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-ag-surface/40">
                            <td className="py-3 px-2 font-bold text-ag-text">{comp.checkpointLabel}</td>
                            <td className="py-3 px-2 uppercase text-ag-muted text-[10px]">{comp.taskType}</td>
                            <td className="py-3 px-2 text-center text-ag-text font-bold">{fmtTime(comp.timeTaken)}</td>
                            <td className="py-3 px-2 text-center text-ag-yellow">{comp.hintsUsed} / 3</td>
                            <td className="py-3 px-2 text-center text-ag-green font-bold">+{comp.score}</td>
                            <td className="py-3 px-2 text-ag-cyan font-bold truncate max-w-[150px]">{comp.answer}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-ag-muted uppercase font-mono-cyber">
                    No stations completed by this crew yet.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
