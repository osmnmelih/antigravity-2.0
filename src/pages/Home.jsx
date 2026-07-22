import { useState, useEffect } from 'react';
import { useNavigate } from '../router-compat.jsx';
import { sessions } from '../api.js';
import { playClickSound, playSuccessSound, startAmbientSpaceMusic, stopAmbientSpaceMusic } from '../utils/audio.js';
import logoUrl from '../assets/logo.png';
import CockpitFrame from '../components/CockpitFrame.jsx';

export default function Home() {
  const navigate = useNavigate();
  const initialStage = (typeof window !== 'undefined' && window.location.hash === '#role') ? 'role' : 'splash';
  const [stage, setStage] = useState(initialStage); // 'splash' | 'role' | 'register'


  const [callsign, setCallsign]               = useState('');
  const [crewName, setCrewName]               = useState('');
  const [teamDesignation, setTeamDesignation] = useState('');
  const [joinCode, setJoinCode]               = useState('');
  const [joining, setJoining]                 = useState(false);
  const [joinError, setJoinError]             = useState('');

  const click   = () => { try { playClickSound();   } catch (e) {} };
  const success = () => { try { playSuccessSound(); } catch (e) {} };

  // Start music when moving from splash → role, stop on mission start
  function handleBeginMission() {
    click();
    try { startAmbientSpaceMusic(); } catch (e) {}
    
    // Explicitly request browser geolocation permission immediately
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          console.log("Location permission granted.");
        },
        (err) => {
          console.warn("Location permission error:", err);
          if (err.code === 1) {
            alert("Lütfen tarayıcınızdan konum izni verin. Konum izni olmadan oyunu oynamak mümkün değildir. / Please allow location permission in browser settings.");
          }
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      alert("Tarayıcınız konum servisini desteklemiyor veya HTTPS (güvenli bağlantı) kullanmıyorsunuz. Lütfen adresi https:// ile açtığınızdan emin olun!");
    }
    
    setStage('role');
  }

  // Stop music right before navigating into the game
  function navigateToGame(path) {
    try { stopAmbientSpaceMusic(); } catch (e) {}
    navigate(path);
  }

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!callsign.trim() || !crewName.trim() || !teamDesignation.trim() || !joinCode.trim()) return;
    click();
    setJoining(true);
    setJoinError('');
    const combinedName = `${callsign.trim().toUpperCase()} (${crewName.trim()}) [${teamDesignation.trim()}]`;
    try {
      const { data } = await sessions.join(joinCode.trim().toUpperCase(), combinedName);
      success();
      const cps = data.session.checkpoints;
      const cp  = cps.find(c => c.id === data.team.current_checkpoint) || cps[0];
      localStorage.setItem('orienteering_student_session', JSON.stringify({
        team: data.team,
        session: { id: data.session.id, name: data.session.name, join_code: joinCode.trim().toUpperCase() },
        checkpoints: cps,
        currentCpId: cp ? cp.id : -1,
        savedAt: new Date().toISOString()
      }));
      // Stop music before entering mission
      try { stopAmbientSpaceMusic(); } catch (e) {}
      navigate('/student');
    } catch (err) {
      setJoinError(err.response?.data?.error || 'Lobby not found or connection rejected.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <CockpitFrame rail={[]} actions={null} title={null}>
    <div className="flex flex-col relative select-none min-h-screen">


      {/* ══════════════ SPLASH ══════════════ */}
      {stage === 'splash' && (
        <main className="flex-1 flex flex-col items-center justify-center px-6 gap-8 py-10 ag-fade-in z-10">
          <div className="w-full max-w-2xl px-4">
            <img
              src={logoUrl}
              alt="ANTIGRAVITY 2.0"
              className="w-full object-contain select-none"
              style={{ filter: 'drop-shadow(0 0 45px rgba(255,0,85,0.55))', animation: 'pulseGlow 5s ease-in-out infinite' }}
              draggable="false"
            />
          </div>

          <button
            id="btn-begin-mission"
            onClick={handleBeginMission}
            className="cockpit-btn px-10 py-4 text-sm tracking-[0.3em]"
          >
            BEGIN MISSION ≫
          </button>

          <div className="cockpit-panel px-6 py-3 max-w-md text-center">
            <p className="text-ag-magenta text-xs font-orbitron tracking-[0.25em] uppercase animate-pulse">
              [ AUTHORIZED CREW SCAN REQUIRED ]
            </p>
          </div>
        </main>
      )}

      {/* ══════════════ ROLE SELECTION ══════════════ */}
      {stage === 'role' && (
        <main className="flex-1 flex flex-col items-center justify-center px-6 gap-10 py-10 ag-fade-in relative z-10">

          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
            <img
              src={logoUrl}
              alt=""
              className="w-[90vw] max-w-4xl object-contain opacity-[0.06] select-none"
              style={{ filter: 'blur(1px) saturate(0.7)' }}
              draggable="false"
            />
          </div>

          <div className="cockpit-panel px-8 py-4 relative">
            <h2 className="font-orbitron text-2xl font-black text-ag-gold tracking-[0.25em] uppercase text-center">Role Selection</h2>
          </div>

          <div className="w-full max-w-md flex flex-col gap-5 relative">
            <button
              id="btn-role-operator"
              onClick={() => { success(); navigateToGame('/teacher'); }}
              className="cockpit-btn w-full px-8 py-5 text-sm tracking-[0.25em]"
            >
              OPERATOR ≫ GAME HOST
            </button>

            <button
              id="btn-role-scavenger"
              onClick={() => { click(); setStage('register'); }}
              className="cockpit-btn w-full px-8 py-5 text-sm tracking-[0.25em]"
            >
              SCAVENGER ≫ PLAYER
            </button>



            <button
              onClick={() => { click(); setStage('splash'); }}
              className="cockpit-btn-secondary w-full px-8 py-5 text-sm tracking-[0.25em]"
            >
              ← ABORT SELECTION
            </button>
          </div>



        </main>
      )}


      {/* ══════════════ CREW REGISTRATION ══════════════ */}
      {stage === 'register' && (
        <main className="flex-1 flex flex-col items-center justify-center px-6 gap-8 py-10 ag-fade-in z-10">
          <div className="cockpit-panel px-8 py-4 relative">
            <h2 className="font-orbitron text-2xl font-black text-ag-gold tracking-[0.25em] uppercase text-center">Crew Registration</h2>
          </div>

          <form onSubmit={handleJoin} className="w-full max-w-md flex flex-col gap-5 relative">
            {[
              { label: 'CALLSIGN',         value: callsign,        set: setCallsign,        placeholder: 'E.G. STAR-LORD-7' },
              { label: 'CREW NAME',        value: crewName,        set: setCrewName,        placeholder: 'E.G. MILANO-CREW' },
              { label: 'TEAM DESIGNATION', value: teamDesignation, set: setTeamDesignation, placeholder: 'E.G. SQUADRON-A' },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <label className="block font-orbitron text-[10px] text-ag-magenta tracking-[0.3em] uppercase mb-2">{label}</label>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={value}
                  onChange={e => set(e.target.value)}
                  className="cyber-input w-full h-14 text-sm uppercase tracking-wide font-mono-cyber"
                  autoComplete="off"
                  required
                />
              </div>
            ))}

            <div>
              <label className="block font-orbitron text-[10px] text-ag-magenta tracking-[0.3em] uppercase mb-2">LOBBY PIN</label>
              <input
                type="text"
                placeholder="E.G. GOTG09"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                className="cyber-input w-full h-14 text-sm text-ag-gold text-center tracking-[0.3em] uppercase font-bold font-mono-cyber"
                maxLength={8}
                autoComplete="off"
                required
              />
            </div>

            {joinError && (
              <p className="text-ag-magenta text-xs text-center uppercase tracking-[0.25em] font-orbitron">{joinError}</p>
            )}

            <button
              id="btn-join"
              type="submit"
              disabled={joining || !callsign.trim() || !crewName.trim() || !teamDesignation.trim() || !joinCode.trim()}
              className="cockpit-btn w-full px-8 py-5 text-sm tracking-[0.25em] mt-2"
            >
              {joining ? 'LINKING TELEMETRY...' : 'ESTABLISH LINK 🚀'}
            </button>

            <button
              type="button"
              onClick={() => { click(); setStage('role'); }}
              className="cockpit-btn-secondary w-full px-8 py-5 text-sm tracking-[0.25em]"
            >
              ← BACK TO ROLE SELECTION
            </button>
          </form>
        </main>
      )}


      {/* ── Footer ── */}
      <footer className="relative z-10 mt-auto flex justify-center items-center px-8 py-5 border-t border-ag-violet/30">
        <span className="font-orbitron text-sm md:text-base font-black tracking-[0.25em] uppercase bg-gradient-to-r from-ag-violet-glow via-ag-magenta to-ag-gold bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(177,78,255,0.45)]">
          Scavenger Hunt: Antigravity 2.0
        </span>
      </footer>

    </div>
    </CockpitFrame>
  );
}
