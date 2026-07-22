import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from '../router-compat.jsx';
import { sessions as sessionsApi, reports as reportsApi } from '../api.js';
import ReportView from '../components/ReportView.jsx';
import CockpitFrame from '../components/CockpitFrame.jsx';

const MISSION_TYPES = [
  { label: 'Physical',  color: '#FF0055', bg: 'rgba(255,0,85,0.10)'    }, // magenta
  { label: 'Cognitive', color: '#00FFD2', bg: 'rgba(0,255,210,0.10)'   }, // cyan
  { label: 'Social',    color: '#FFC800', bg: 'rgba(255,200,0,0.10)'   }, // gold
  { label: 'Creative',  color: '#8A2BE2', bg: 'rgba(138,43,226,0.12)'  }, // violet
];

function StatBar({ label, val, color }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-ag-muted uppercase tracking-wide">{label}</span>
        <span className="text-xs font-mono-cyber font-bold" style={{ color }}>{val}%</span>
      </div>
      <div className="h-2 bg-ag-elevated rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${val}%`, background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
    </div>
  );
}

export default function SessionMonitor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession]             = useState(null);
  const [report, setReport]               = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError]                 = useState('');
  const [activeTab, setActiveTab]         = useState('overview'); // 'overview' | 'crew' | 'report'

  // Simulated ship telemetry
  const [telemetry, setTelemetry] = useState({
    reactor: 62, shield: 41, nav: 55, gravity: 38, comms: 48, morale: 71
  });

  const fetchSession = useCallback(async () => {
    try {
      const { data } = await sessionsApi.getById(id);
      setSession(data);
      setTelemetry(prev => ({
        reactor:  Math.min(100, Math.max(30, prev.reactor  + Math.floor(Math.random() * 5) - 2)),
        shield:   Math.min(100, Math.max(40, prev.shield   + Math.floor(Math.random() * 3) - 1)),
        nav:      Math.min(100, Math.max(30, prev.nav      + Math.floor(Math.random() * 2) - 1)),
        gravity:  Math.min(100, Math.max(30, prev.gravity  + Math.floor(Math.random() * 3) - 1)),
        comms:    Math.min(100, Math.max(30, prev.comms    + Math.floor(Math.random() * 3) - 1)),
        morale:   Math.min(100, Math.max(30, prev.morale   + Math.floor(Math.random() * 4) - 2)),
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Connection lost');
    }
  }, [id]);

  useEffect(() => {
    fetchSession();
    const iv = setInterval(fetchSession, 10_000);
    return () => clearInterval(iv);
  }, [fetchSession]);

  async function generateReport() {
    setLoadingReport(true); setError('');
    try {
      const { data } = await reportsApi.generate(id);
      setReport(data);
      setActiveTab('report');
    } catch (err) {
      setError(err.response?.data?.error || 'Report generation failed');
    } finally { setLoadingReport(false); }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-ag-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-ag-cyan border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="font-orbitron text-ag-muted text-[10px] tracking-[0.25em] uppercase">Connecting...</div>
        </div>
      </div>
    );
  }

  const totalCps  = session.checkpoints.length;
  const totalDone = session.teams.reduce((s, t) => s + (t.completions?.length || 0), 0);
  const totalHints= session.teams.reduce((s, t) => s + (t.completions?.reduce((h, c) => h + (c.hints_used || 0), 0) || 0), 0);
  const allDone   = session.teams.length > 0 && session.teams.every(t => (t.completions?.length || 0) >= totalCps);

  const TABS = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'crew',     label: 'CREW' },
    { id: 'report',   label: 'REPORT' },
  ];

  const hudActions = (
    <>
      <button onClick={() => navigate('/teacher')} className="cockpit-btn-secondary w-full px-5 py-3 text-[11px] tracking-[0.25em]">
        ← BACK
      </button>
      <button onClick={fetchSession} className="cockpit-btn-secondary w-full px-5 py-3 text-[11px] tracking-[0.25em]">
        ↺ REFRESH
      </button>
      <button onClick={generateReport} disabled={loadingReport} className="cockpit-btn-secondary w-full px-5 py-3 text-[11px] tracking-[0.25em]">
        {loadingReport ? 'GENERATING…' : 'GENERATE REPORT'}
      </button>
    </>
  );

  return (
    <CockpitFrame rail={[]} actions={hudActions} title={null}>
    <div className="flex flex-col relative">
      <div className="scanlines opacity-15 fixed inset-0 pointer-events-none z-50" />

      {/* ── Session info strip ── */}
      <div className="px-6 pt-4 pb-2 flex flex-col items-center gap-2 relative z-10">
        <p className="text-[10px] text-ag-muted font-mono-cyber uppercase tracking-[0.3em] text-center">
          {session.name} · PIN <span className="text-ag-gold font-bold">{session.join_code}</span>
        </p>
        {allDone && !report && (
          <span className="text-xs font-orbitron text-ag-green animate-pulse px-3 py-1.5 rounded-xl border border-ag-green/45 bg-ag-green/5 font-black tracking-wider">
            MISSION COMPLETE
          </span>
        )}
      </div>


      {error && (
        <div className="mx-5 mt-3 bg-ag-red/10 border border-ag-red/35 text-ag-red text-sm px-4 py-2.5 rounded-xl relative z-10 font-mono-cyber">{error}</div>
      )}

      {/* ── Tab bar ── */}
      <div className="bg-ag-surface/80 backdrop-blur-md border-b border-ag-border px-6 flex gap-2 relative z-10">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-3.5 text-xs font-orbitron font-black tracking-widest uppercase transition-all border-b-2 -mb-px
              ${activeTab === t.id
                ? 'border-ag-cyan text-ag-cyan'
                : 'border-transparent text-ag-muted hover:text-ag-text'}`}
          >
            {t.label}
            {t.id === 'report' && report && (
              <span className="ml-2 w-2 h-2 rounded-full bg-ag-green inline-block shadow-[0_0_6px_#00FF88]" />
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto relative z-10">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="max-w-5xl mx-auto p-5 space-y-6">

            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Active Crews', val: session.teams.length, color: 'var(--ag-cyan)' },
                { label: 'Total Nodes',  val: totalCps,              color: 'var(--ag-muted)' },
                { label: 'Completed',    val: totalDone,             color: 'var(--ag-green)' },
                { label: 'Hints Used',   val: totalHints,            color: 'var(--ag-yellow)' },
              ].map(({ label, val, color }) => (
                <div key={label} className="ag-panel p-6 text-center">
                  <div className="font-orbitron font-black text-3xl" style={{ color }}>{val}</div>
                  <div className="text-xs text-ag-muted uppercase tracking-wider mt-1.5 font-mono-cyber">{label}</div>
                </div>
              ))}
            </div>

            {/* Two-column */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Ship Telemetry */}
              <div className="ag-panel p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-ag-border/50 pb-2.5">
                  <h2 className="font-orbitron font-black text-sm text-ag-cyan tracking-widest uppercase">Ship Telemetry</h2>
                  <span className="text-xs text-ag-green font-mono-cyber animate-pulse">● LIVE</span>
                </div>
                <div className="space-y-4">
                  <StatBar label="Reactor Energy"    val={Math.round(telemetry.reactor)} color="#00FFD2" />
                  <StatBar label="Shield Integrity"  val={Math.round(telemetry.shield)}  color="#00FFD2" />
                  <StatBar label="Navigation"        val={Math.round(telemetry.nav)}     color="#00FF88" />
                  <StatBar label="Gravity Stability" val={Math.round(telemetry.gravity)} color="#FFC800" />
                  <StatBar label="Comms Strength"    val={Math.round(telemetry.comms)}   color="#FFC800" />
                  <StatBar label="Crew Morale"       val={Math.round(telemetry.morale)}  color="#00FFD2" />
                </div>
              </div>

              {/* Sector Progress */}
              <div className="ag-panel p-6 space-y-5">
                <div className="border-b border-ag-border/50 pb-2.5">
                  <h2 className="font-orbitron font-black text-sm text-ag-cyan tracking-widest uppercase">Sector Progress</h2>
                </div>
                {session.teams.length === 0 ? (
                  <div className="text-ag-muted text-xs text-center py-8 font-mono-cyber">
                    AWAITING CREW CONNECTION...<br/>
                    <span className="text-ag-cyan font-bold text-base mt-2.5 block tracking-widest font-orbitron">PIN: {session.join_code}</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {session.teams.map(team => {
                      const done = team.completions?.length || 0;
                      const pct  = totalCps ? Math.round((done / totalCps) * 100) : 0;
                      return (
                        <div key={team.id} className="space-y-2.5">
                          <div className="flex justify-between text-xs font-mono-cyber">
                            <span className="text-ag-text font-black uppercase truncate">{team.name}</span>
                            <span className="text-ag-muted font-bold">{done}/{totalCps} SECURED</span>
                          </div>
                          {/* Node chain */}
                          <div className="flex items-center gap-2">
                            {session.checkpoints.map((cp, idx) => {
                              const comp = team.completions?.find(c => c.checkpoint_id === cp.id);
                              const m    = MISSION_TYPES[idx % 4];
                              return (
                                <div key={cp.id} className="flex-1 flex items-center gap-2 last:flex-none">
                                  <div
                                    className="w-8 h-8 rounded-xl border flex items-center justify-center font-orbitron font-bold text-xs transition-all"
                                    style={{
                                      background: comp ? `${m.bg}` : idx === done ? 'rgba(0,255,210,0.08)' : 'transparent',
                                      borderColor: comp ? m.color : idx === done ? 'rgba(0,255,210,0.6)' : 'rgba(255,255,255,0.1)',
                                      color: comp ? m.color : idx === done ? '#00FFD2' : 'rgba(255,255,255,0.2)',
                                    }}
                                  >
                                    {idx + 1}
                                  </div>
                                  {idx < session.checkpoints.length - 1 && (
                                    <div className="flex-1 h-px" style={{ background: idx < done ? '#00FF88' : 'rgba(255,255,255,0.08)' }} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {/* Progress bar */}
                          <div className="h-0.5 bg-ag-elevated rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-ag-green rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Mission complete banner */}
            {allDone && !report && (
              <div className="ag-panel p-6 text-center border-ag-green/40" style={{ background: 'rgba(0,255,136,0.04)' }}>
                <div className="w-10 h-10 mx-auto mb-3 rounded-full border border-ag-green/40 bg-ag-green/10 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-ag-green">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <p className="font-orbitron font-bold text-ag-green text-sm tracking-widest uppercase">All Sectors Cleared</p>
                <p className="text-ag-muted text-xs mt-1">Generate the mission report to review crew performance.</p>
                <button onClick={generateReport} disabled={loadingReport}
                  className="mt-4 ag-btn-solid px-8 py-2.5 text-xs">
                  {loadingReport ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* CREW TAB */}
        {activeTab === 'crew' && (
          <div className="max-w-3xl mx-auto p-5 space-y-3">
            <h2 className="font-orbitron font-bold text-[11px] text-ag-cyan tracking-widest uppercase">Crew Status</h2>
            {session.teams.length === 0 ? (
              <div className="ag-panel p-8 text-center">
                <p className="text-ag-muted text-xs">No crew connected yet.</p>
                <p className="text-ag-cyan font-bold text-sm mt-2">{session.join_code}</p>
              </div>
            ) : (
              session.teams.map(team => {
                const done       = team.completions?.length || 0;
                const pct        = totalCps ? Math.round((done / totalCps) * 100) : 0;
                const totalScore = team.completions?.reduce((s, c) => s + (c.score || 0), 0) || 0;
                const hintsUsed  = team.completions?.reduce((h, c) => h + (c.hints_used || 0), 0) || 0;
                return (
                  <div key={team.id} className="ag-panel p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="font-bold text-ag-text text-sm uppercase">{team.name}</div>
                        <div className="text-[10px] text-ag-muted mt-0.5">{done}/{totalCps} nodes · {hintsUsed} hints</div>
                      </div>
                      <div className="text-right">
                        <div className="font-orbitron font-black text-ag-cyan text-lg">{totalScore}</div>
                        <div className="text-[9px] text-ag-muted uppercase">Points</div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-ag-muted">
                        <span>Progress</span>
                        <span className="text-ag-cyan font-bold">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-ag-elevated rounded-full overflow-hidden">
                        <div className="h-full bg-ag-cyan rounded-full transition-all duration-700" style={{ width: `${pct}%`, boxShadow: '0 0 6px #00FFD2' }} />
                      </div>
                    </div>

                    {/* Completion list */}
                    {team.completions && team.completions.length > 0 && (
                      <div className="mt-4 space-y-1.5">
                        {team.completions.map((c, i) => {
                          const m = MISSION_TYPES[i % 4];
                          return (
                            <div key={i} className="flex items-center justify-between text-[10px] py-1.5 border-b border-ag-border last:border-0">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded flex items-center justify-center font-bold"
                                     style={{ background: m.bg, color: m.color, fontSize: '9px' }}>{i + 1}</div>
                                <span className="text-ag-muted" style={{ color: m.color }}>{m.label}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-ag-muted">{c.time_taken}s</span>
                                <span className="font-bold" style={{ color: m.color }}>+{c.score}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* REPORT TAB */}
        {activeTab === 'report' && (
          <div className="max-w-3xl mx-auto p-5">
            {report ? (
              <ReportView report={report} />
            ) : (
              <div className="ag-panel p-8 text-center">
                <p className="text-ag-muted text-xs mb-4">Generate a mission report once all crews have finished.</p>
                <button onClick={generateReport} disabled={loadingReport}
                  className="ag-btn-primary px-8 py-2.5 text-xs">
                  {loadingReport ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </CockpitFrame>
  );
}
