import { useState, useEffect } from 'react';
import CockpitFrame from '../components/CockpitFrame.jsx';
import { playClickSound, playSuccessSound } from '../utils/audio.js';
import logoUrl from '../assets/logo.png';

export default function Presentation() {
  const [activeModal, setActiveModal] = useState(null);

  const click = () => { try { playClickSound(); } catch (e) {} };
  const success = () => { try { playSuccessSound(); } catch (e) {} };

  // Scroll animations observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    const animatedElements = document.querySelectorAll('.fade-in-section');
    animatedElements.forEach(el => observer.observe(el));

    return () => {
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  const steps = [
    {
      num: 'STEP 01',
      title: 'TEACHER CREATES SESSION',
      body: 'The Commander opens Mission Control, names the session, and places GPS waypoints on a live Map using their device location. Each waypoint gets a task type and difficulty.',
      accent: 'var(--ag-cyan)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-ag-cyan">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="12" y1="8" x2="12" y2="16" />
        </svg>
      )
    },
    {
      num: 'STEP 02',
      title: 'STUDENTS JOIN VIA QR',
      body: 'Students scan the QR code or enter the mission code on their phones. They enter a crew callsign, crew name, and squadron designation to link telemetry.',
      accent: 'var(--ag-magenta)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-ag-magenta">
          <rect x="3" y="3" width="8" height="8" />
          <rect x="13" y="3" width="8" height="8" />
          <rect x="3" y="13" width="8" height="8" />
          <path d="M13 13h8v8" />
        </svg>
      )
    },
    {
      num: 'STEP 03',
      title: 'NAVIGATE TO WAYPOINTS',
      body: 'Operatives see checkpoints on a GPS map and navigate to them on foot. The AR camera view shows real-time distance HUD. Unlock threshold: 20 meters.',
      accent: 'var(--ag-green)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-ag-green">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4l3 3" />
        </svg>
      )
    },
    {
      num: 'STEP 04',
      title: 'COMPLETE AI TASKS',
      body: 'At each checkpoint, the engine generates a context-adaptive task: Physical, Cognitive, Social, or Creative, matching the squad\'s speed and fatigue.',
      accent: 'var(--ag-yellow)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-ag-yellow">
          <path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z" />
        </svg>
      )
    },
    {
      num: 'STEP 05',
      title: 'TEACHER MONITORS LIVE',
      body: 'The live dashboard shows all squads, their checkpoint completions, scores, and hints used in real time. An AI Debrief Report is generated at mission end.',
      accent: 'var(--ag-violet-glow)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-ag-violet-glow">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 9h10M7 13h6" />
        </svg>
      )
    },
    {
      num: 'STEP 06',
      title: 'RESULTS & STANDINGS',
      body: 'Students see the live leaderboard anytime. Score formula: 100 − (hints × 15), minimum 40. The team with the most points across all checkpoints wins the mission.',
      accent: 'var(--ag-cyan)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-ag-cyan">
          <path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )
    }
  ];

  const features = [
    { icon: '🗺️', title: 'Interactive Map Picker', body: 'Place custom checkpoint targets directly on a leafelt coordinates map.' },
    { icon: '⏱️', title: 'Adaptive ZPD Calibration', body: 'Task duration and requirements scale automatically based on crew speed and fatigue.' },
    { icon: '📡', title: 'Diegetic HUD & Comms', body: 'Full ambient audio loops, error static, space communications and sci-fi theme design.' },
    { icon: '📷', title: 'Mirrored AR camera', body: 'Precision AR overlay camera with target brackets showing actual distance indicator.' },
    { icon: '📊', title: 'Realtime Dashboard', body: 'Live scoreboard, checkpoint tracker bars and connection status indicators.' },
    { icon: '🧠', title: 'Generative AI Debriefs', body: 'One-click post-game summaries highlighting sync levels, team notes and activity logs.' }
  ];

  const techStack = [
    { layer: 'Frontend Library', tech: 'React 18' },
    { layer: 'Styling Framework', tech: 'TailwindCSS v4' },
    { layer: 'State Management', tech: 'TanStack React Router & Query' },
    { layer: 'Database', tech: 'Supabase (PostgreSQL)' },
    { layer: 'Maps Provider', tech: 'Leaflet (Dark Mode styled)' },
    { layer: 'Camera overlay', tech: 'HTML5 MediaDevices API' }
  ];

  return (
    <CockpitFrame rail={[]} actions={null} title={null}>
      <div className="text-ag-text font-orbitron select-none overflow-x-hidden min-h-screen">
        
        {/* NAV */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-16 bg-ag-bg/85 backdrop-blur-md border-b border-ag-border/50">
          <a className="font-bold text-xs tracking-[0.25em] text-ag-cyan" href="#" onClick={click}>ANTIGRAVITY 2.0</a>
          <ul className="hidden md:flex gap-8 list-none font-mono-cyber text-[10px] tracking-wider">
            <li><a href="#how" onClick={click} className="text-ag-muted hover:text-ag-cyan uppercase transition-colors">HOW IT WORKS</a></li>
            <li><a href="#features" onClick={click} className="text-ag-muted hover:text-ag-cyan uppercase transition-colors">FEATURES</a></li>
            <li><a href="#tech" onClick={click} className="text-ag-muted hover:text-ag-cyan uppercase transition-colors">TECH</a></li>
            <li><a href="/" onClick={success} className="text-ag-gold hover:text-ag-cyan font-bold uppercase transition-colors">LAUNCH GAME ≫</a></li>
          </ul>
        </nav>

        {/* HERO */}
        <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden pt-20">
          <div className="absolute inset-0 cockpit-grid opacity-20 pointer-events-none" />
          <div className="absolute w-[600px] h-[600px] rounded-full bg-radial from-ag-cyan/10 to-transparent top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '6s' }} />

          <div className="w-16 h-16 border-2 border-ag-cyan rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_24px_rgba(0,255,210,0.3)] animate-pulse">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-ag-cyan">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="3" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="21" />
              <line x1="3" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="21" y2="12" />
            </svg>
          </div>

          <h1 className="text-4xl md:text-7xl font-black tracking-[0.2em] text-ag-cyan drop-shadow-[0_0_24px_rgba(0,255,210,0.4)] mb-2">
            ANTIGRAVITY
          </h1>
          <p className="text-xs md:text-sm font-mono-cyber tracking-[0.4em] text-ag-muted mb-8">// DIGITAL AR SCAVENGER HUNT</p>
          <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ag-cyan to-transparent mb-8" />

          <p className="max-w-xl text-sm md:text-base text-ag-text/80 leading-relaxed font-sans font-light mb-10">
            A full-stack GPS-powered outdoor learning platform for physical education. 
            Teachers deploy missions with real map checkpoints — students navigate, complete AI-generated tasks, and compete in real time.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-12">
            <span className="px-4 py-1.5 rounded-full border border-ag-cyan/30 bg-ag-cyan/5 text-[9px] font-mono-cyber tracking-widest text-ag-cyan uppercase">GPS NAV</span>
            <span className="px-4 py-1.5 rounded-full border border-ag-magenta/30 bg-ag-magenta/5 text-[9px] font-mono-cyber tracking-widest text-ag-magenta uppercase">AI TASKS</span>
            <span className="px-4 py-1.5 rounded-full border border-ag-green/30 bg-ag-green/5 text-[9px] font-mono-cyber tracking-widest text-ag-green uppercase">LIVE OPS</span>
            <span className="px-4 py-1.5 rounded-full border border-ag-yellow/30 bg-ag-yellow/5 text-[9px] font-mono-cyber tracking-widest text-ag-yellow uppercase">4 MODES</span>
          </div>

          <div className="flex gap-4">
            <a href="/" className="cockpit-btn px-8 py-4 text-xs tracking-[0.25em]" onClick={success}>
              LAUNCH APP ≫
            </a>
          </div>

          <div className="absolute bottom-8 flex flex-col items-center gap-2 opacity-50 animate-bounce">
            <span className="font-mono-cyber text-[8px] tracking-[0.3em] text-ag-cyan">SCROLL DOWN</span>
            <svg width="10" height="15" viewBox="0 0 10 15" fill="none" stroke="#00FFD2" strokeWidth="2">
              <path d="M5 2 v11 M2 9 l3 3 l3-3" />
            </svg>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="py-24 px-6 bg-ag-surface/20 border-t border-ag-border/30 relative">
          <div className="max-w-6xl mx-auto">
            <span className="text-[10px] font-mono-cyber tracking-[0.3em] text-ag-cyan block mb-2">// MISSION PROTOCOL</span>
            <h2 className="text-2xl md:text-4xl font-black tracking-wider text-ag-text mb-12">HOW THE MISSION WORKS</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {steps.map((st, i) => (
                <div 
                  key={st.num}
                  className="cockpit-panel p-6 space-y-4 hover:scale-[1.02] transition-transform duration-300"
                  style={{ border: `1px solid ${st.accent}33`, boxShadow: `0 0 16px ${st.accent}12` }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold tracking-wider font-mono-cyber" style={{ color: st.accent }}>{st.num}</span>
                    <div className="w-8 h-8 rounded-lg bg-[#160c2c] flex items-center justify-center border border-white/5">
                      {st.icon}
                    </div>
                  </div>
                  <h3 className="font-bold text-xs tracking-wider text-ag-text uppercase">{st.title}</h3>
                  <p className="text-[11px] font-sans font-light text-ag-muted leading-relaxed">{st.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-24 px-6 relative">
          <div className="max-w-6xl mx-auto">
            <span className="text-[10px] font-mono-cyber tracking-[0.3em] text-ag-cyan block mb-2">// ADVANCED SYSTEMS</span>
            <h2 className="text-2xl md:text-4xl font-black tracking-wider text-ag-text mb-12">TACTICAL APP FEATURES</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <div key={f.title} className="ag-panel p-6 hover:border-ag-cyan/40 hover:bg-ag-cyan/5 transition-all duration-300">
                  <div className="text-2xl mb-4">{f.icon}</div>
                  <h3 className="font-bold text-xs tracking-wider text-ag-text uppercase mb-2">{f.title}</h3>
                  <p className="text-[11px] font-sans font-light text-ag-muted leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TECH STACK */}
        <section id="tech" className="py-24 px-6 bg-ag-surface/25 border-t border-b border-ag-border/30 relative">
          <div className="max-w-4xl mx-auto">
            <span className="text-[10px] font-mono-cyber tracking-[0.3em] text-ag-cyan block mb-2">// CONSOLE TECH</span>
            <h2 className="text-2xl md:text-4xl font-black tracking-wider text-ag-text mb-12">SYSTEM ARCHITECTURE</h2>

            <div className="overflow-hidden border border-ag-border/50 rounded-xl bg-ag-bg/80">
              <table className="w-full text-left font-mono-cyber text-xs border-collapse">
                <thead>
                  <tr className="border-b border-ag-border/50 text-[10px] text-ag-cyan/60 tracking-wider">
                    <th className="p-4 uppercase">SYSTEM LAYER</th>
                    <th className="p-4 uppercase">TECHNOLOGY INSTANCE</th>
                  </tr>
                </thead>
                <tbody>
                  {techStack.map((row) => (
                    <tr key={row.layer} className="border-b border-ag-border/30 hover:bg-ag-cyan/5 transition-colors">
                      <td className="p-4 text-ag-muted font-light uppercase tracking-wider">{row.layer}</td>
                      <td className="p-4 text-ag-green font-bold tracking-widest">{row.tech}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-8 px-6 md:px-12 border-t border-ag-border/30 flex flex-col md:flex-row justify-between items-center gap-4 bg-ag-bg relative z-10">
          <span className="font-bold text-xs tracking-[0.25em] text-ag-cyan">ANTIGRAVITY 2.0</span>
          <span className="font-mono-cyber text-[9px] tracking-wider text-ag-muted uppercase">// SCI-FI GAMIFIED PE ORIENTEERING PLATFORM</span>
        </footer>

      </div>
    </CockpitFrame>
  );
}
