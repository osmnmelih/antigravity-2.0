import { useState, useEffect } from 'react';
import { useNavigate } from '../router-compat.jsx';
import { sessions, tasks, hints as hintsApi, completions } from '../api.js';
import StudentMap from '../components/StudentMap.jsx';
import TaskCard from '../components/TaskCard.jsx';
import HintPanel from '../components/HintPanel.jsx';
import ARView from '../components/ARView.jsx';
import RankingsOverlay from '../components/student/RankingsOverlay.jsx';
import DiscoveryOverlay from '../components/student/DiscoveryOverlay.jsx';
import RandomEventOverlay from '../components/student/RandomEventOverlay.jsx';
import ProtocolTimerOverlay from '../components/student/ProtocolTimerOverlay.jsx';
import FinishedScreen from '../components/student/FinishedScreen.jsx';
import { useAudioStatus } from '../hooks/useAudioStatus.js';
import { useGpsWatcher } from '../hooks/useGpsWatcher.js';
import { useProtocolTimer } from '../hooks/useProtocolTimer.js';
import { useRandomEvents } from '../hooks/useRandomEvents.js';
import { haversine, fmtDistance, TASK_META, DIFF_META, UNLOCK_DISTANCE } from '../utils.js';
import { playClickSound, playUnlockSound, playSuccessSound, playPingSound, startAmbientSpaceMusic, stopAmbientSpaceMusic, startTenseMissionMusic, stopTenseMissionMusic } from '../utils/audio.js';

const PHASE = { JOIN: 'join', MAP: 'map', TASK: 'task', SUBMIT: 'submit', FINISHED: 'finished' };
const LS_KEY = 'orienteering_student_session';

function saveStudentSession(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ ...data, savedAt: new Date().toISOString() })); }
  catch { /* ignore */ }
}
function loadStudentSession() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); }
  catch { return null; }
}
function clearStudentSession() {
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
}

export default function StudentView() {
  const navigate = useNavigate();
  const audioStatus = useAudioStatus();

  const [joinCode, setJoinCode]       = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      const c = new URLSearchParams(window.location.search).get('code');
      return c ? c.toUpperCase() : '';
    } catch { return ''; }
  });
  const [callsign, setCallsign]       = useState('');
  const [crewNameInput, setCrewNameInput] = useState('');
  const [joinError, setJoinError]     = useState('');
  const [joining, setJoining]         = useState(false);

  const [savedSession, setSavedSession] = useState(null);

  const [phase, setPhase]             = useState(PHASE.JOIN);
  const [team, setTeam]               = useState(null);
  const [session, setSession]         = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [currentCp, setCurrentCp]     = useState(null);

  const { userPos, gpsError, startGPS, stopGPS } = useGpsWatcher();
  const [distance, setDistance]       = useState(null);

  const [task, setTask]               = useState(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskStartTime, setTaskStartTime] = useState(null);

  const [hintsList, setHintsList]     = useState([]);
  const [hintsUsed, setHintsUsed]     = useState(0);
  const [showHints, setShowHints]     = useState(false);
  const [hintLoading, setHintLoading] = useState(false);

  const [answer, setAnswer]           = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const [showResults, setShowResults]   = useState(false);
  const [resultsData, setResultsData]   = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  const [showAR, setShowAR] = useState(false);
  const [arInitializing, setArInitializing] = useState(false);

  const [bypassFrequency, setBypassFrequency] = useState(92.4);
  const [targetFrequency, setTargetFrequency] = useState(95.0);
  const [bypassUnlocked, setBypassUnlocked]   = useState(false);

  // Discovery animation state
  const [discoveredNode, setDiscoveredNode] = useState(null);
  const [showDiscoveryOverlay, setShowDiscoveryOverlay] = useState(false);

  // Random Events and Physical Protocol Timer states
  const { randomEvent, randomEventTimer, setRandomEvent } = useRandomEvents(phase);
  const {
    protocolTimerActive,
    protocolTimeLeft,
    setProtocolTimerActive,
    setProtocolTimeLeft,
  } = useProtocolTimer(45);
  const [adaptiveUnlockSecs, setAdaptiveUnlockSecs] = useState(0);



  useEffect(() => {
    const saved = loadStudentSession();
    if (saved) {
      setTeam(saved.team);
      setSession(saved.session);
      setCheckpoints(saved.checkpoints);
      if (saved.currentCpId === -1) {
        setPhase(PHASE.FINISHED);
      } else {
        const cp = saved.checkpoints.find(c => c.id === saved.currentCpId) || saved.checkpoints[0];
        setCurrentCp(cp);
        setPhase(PHASE.MAP);
        startGPS();
      }
    } else {
      navigate('/');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === PHASE.MAP) {
      try { startAmbientSpaceMusic(); } catch (e) {}
    }
  }, [phase]);

  useEffect(() => {
    const playMusicOnGesture = () => {
      try {
        startAmbientSpaceMusic();
      } catch (e) {}
      window.removeEventListener('touchstart', playMusicOnGesture);
      window.removeEventListener('click', playMusicOnGesture);
    };
    window.addEventListener('touchstart', playMusicOnGesture);
    window.addEventListener('click', playMusicOnGesture);
    return () => {
      window.removeEventListener('touchstart', playMusicOnGesture);
      window.removeEventListener('click', playMusicOnGesture);
      try { stopAmbientSpaceMusic(); } catch (e) {}
      try { stopTenseMissionMusic(); } catch (e) {}
    };
  }, []);


  useEffect(() => {
    if (userPos && currentCp) {
      const dist = haversine(userPos.lat, userPos.lng, currentCp.lat, currentCp.lng);
      setDistance(dist);

      const isClose = dist <= UNLOCK_DISTANCE;
      if (isClose && currentCp.id !== discoveredNode) {
        setDiscoveredNode(currentCp.id);
        setShowDiscoveryOverlay(true);
        try { playPingSound(); } catch (e) {}
      }
    }
  }, [userPos, currentCp, discoveredNode]);

  // Adaptive GPS Drift Lock Assist: If on map page, count up to 10s to bypass distance requirement for testing/drift
  useEffect(() => {
    if (phase === PHASE.MAP) {
      const interval = setInterval(() => {
        setAdaptiveUnlockSecs(prev => {
          if (prev >= 10) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setAdaptiveUnlockSecs(0);
    }
  }, [phase]);

  useEffect(() => {
    const isAdaptiveUnlocked = adaptiveUnlockSecs >= 10;
    const isClose = (distance !== null && distance <= UNLOCK_DISTANCE) || isAdaptiveUnlocked;
    if (isClose && currentCp && currentCp.id !== discoveredNode) {
      setDiscoveredNode(currentCp.id);
      setShowDiscoveryOverlay(true);
      try { playPingSound(); } catch (e) {}
    }
  }, [distance, adaptiveUnlockSecs, currentCp, discoveredNode]);

  useEffect(() => {
    if (phase === PHASE.SUBMIT && !submitResult) {
      const randFreq = (Math.floor(Math.random() * 40) + 80);
      setTargetFrequency(randFreq);
      setBypassFrequency(randFreq - 4);
      setBypassUnlocked(false);
    }
  }, [phase, submitResult]);

  useEffect(() => {
    if (task && task.ui_theme) {
      const { background, primary_neon_text, alarm_border, timer_color } = task.ui_theme;
      if (background) document.documentElement.style.setProperty('--cyber-bg', background);
      if (primary_neon_text) document.documentElement.style.setProperty('--cyber-cyan', primary_neon_text);
      if (alarm_border) document.documentElement.style.setProperty('--cyber-border', alarm_border);
      if (timer_color) document.documentElement.style.setProperty('--cyber-pink', timer_color);
    } else {
      document.documentElement.style.setProperty('--cyber-bg', '#0A0314');
      document.documentElement.style.setProperty('--cyber-cyan', '#00FFD2');
      document.documentElement.style.setProperty('--cyber-border', 'rgba(0,255,210,0.18)');
      document.documentElement.style.setProperty('--cyber-pink', '#FF0055');
    }
  }, [task]);

  // Random events + protocol timer effects now live in their respective hooks.


  async function handleJoin(e) {
    e.preventDefault();
    if (!joinCode.trim() || !callsign.trim() || !crewNameInput.trim()) return;
    playClickSound();
    setJoining(true); setJoinError('');
    const combinedTeamName = `${callsign.trim().toUpperCase()} (${crewNameInput.trim()})`;
    try {
      const { data } = await sessions.join(joinCode.trim().toUpperCase(), combinedTeamName);
      setTeam(data.team);
      setSession(data.session);
      const cps = data.session.checkpoints;
      setCheckpoints(cps);
      playSuccessSound();

      if (data.team.current_checkpoint === -1) {
        saveStudentSession({
          team: data.team,
          session: { id: data.session.id, name: data.session.name, join_code: joinCode.trim() },
          checkpoints: cps,
          currentCpId: -1,
        });
        setSavedSession(null);
        setPhase(PHASE.FINISHED);
      } else {
        const cp = cps.find(c => c.id === data.team.current_checkpoint) || cps[0];
        setCurrentCp(cp);
        saveStudentSession({
          team: data.team,
          session: { id: data.session.id, name: data.session.name, join_code: joinCode.trim() },
          checkpoints: cps,
          currentCpId: cp.id,
        });
        setSavedSession(null);
        setPhase(PHASE.MAP);
        startGPS();
      }
    } catch (err) {
      setJoinError('Flight Code not matching.');
    } finally { setJoining(false); }
  }

  function handleResume() {
    playClickSound();
    const saved = loadStudentSession();
    if (!saved) return;
    setTeam(saved.team);
    setSession(saved.session);
    setCheckpoints(saved.checkpoints);
    if (saved.currentCpId === -1) {
      setPhase(PHASE.FINISHED);
    } else {
      const cp = saved.checkpoints.find(c => c.id === saved.currentCpId) || saved.checkpoints[0];
      setCurrentCp(cp);
      setPhase(PHASE.MAP);
      startGPS();
    }
  }

  function handleStartFresh() {
    playClickSound();
    clearStudentSession();
    setSavedSession(null);
  }

  async function openResults() {
    if (!session?.id) return;
    playClickSound();
    setShowResults(true);
    if (resultsData) return;
    setResultsLoading(true);
    try {
      const { data } = await sessions.getById(session.id);
      setResultsData(data);
    } catch { /* ignore */ }
    finally { setResultsLoading(false); }
  }

  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [taskStep, setTaskStep] = useState(0);
  const [timerCompleted, setTimerCompleted] = useState(false);

  useEffect(() => {
    if (phase === PHASE.TASK && protocolTimeLeft === 0) {
      setTimerCompleted(true);
    }
  }, [protocolTimeLeft, phase]);

  async function handleUnlockTask() {
    if (!currentCp?.id || !team?.id) return;
    if (!canUnlock) {
      alert("You are too far from the station! Walk within 20 meters of the station target to start.");
      return;
    }
    setTaskLoading(true);
    setHintsList([]); setHintsUsed(0); setAnswer(''); setSubmitResult(null); setShowHints(false);
    try {
      const lat = userPos ? userPos.lat : null;
      const lng = userPos ? userPos.lng : null;
      const bypass = isAdaptiveUnlocked;
      const { data } = await tasks.generate(currentCp.id, team.id, lat, lng, bypass);
      try { stopAmbientSpaceMusic(); startTenseMissionMusic(); } catch(e) {}
      playUnlockSound();
      setTask(data);
      if (data?.sdt_mechanics?.autonomy_options?.length > 0) {
        setSelectedOptionId(data.sdt_mechanics.autonomy_options[0].id);
      } else {
        setSelectedOptionId(null);
      }
      setTaskStep(0);
      setTimerCompleted(false);
      setTaskStartTime(Date.now()); 
      setProtocolTimeLeft(data?.duration_seconds || 45);
      setPhase(PHASE.TASK);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || "Failed to start task. Please verify that the session is active.";
      alert(msg);
    }
    finally { setTaskLoading(false); }
  }

  async function handleRequestHint() {
    if (!team?.id || !currentCp?.id) return;
    if (hintsUsed >= 3 || hintLoading) return;
    playClickSound();
    setHintLoading(true);
    try {
      const { data } = await hintsApi.get({ teamId: team.id, checkpointId: currentCp.id, taskJson: task });
      setHintsList(prev => [...prev, data]);
      setHintsUsed(data.hintsUsed);
      setShowHints(true);
    } catch (err) { console.error(err); }
    finally { setHintLoading(false); }
  }

  async function handleComplete() {
    if (!team?.id || !currentCp?.id) return;
    setSubmitting(true);
    const timeTaken = taskStartTime ? Math.round((Date.now() - taskStartTime) / 1000) : 0;
    try {
      const { data } = await completions.submit({ teamId: team.id, checkpointId: currentCp.id, timeTaken, answer });
      setSubmitResult(data);
      try { stopTenseMissionMusic(); startAmbientSpaceMusic(); } catch(e) {}
      playSuccessSound();
      if (data.finished) { setPhase(PHASE.FINISHED); stopGPS(); }
      else { setPhase(PHASE.SUBMIT); }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  }

  function handleAdvance() {
    playClickSound();
    try { stopTenseMissionMusic(); startAmbientSpaceMusic(); } catch(e) {}
    if (!submitResult?.nextCheckpoint) return;
    const nextCp = checkpoints.find(cp => cp.id === submitResult.nextCheckpoint.id);
    setCurrentCp(nextCp);
    const saved = loadStudentSession();
    if (saved && nextCp) saveStudentSession({ ...saved, currentCpId: nextCp.id });
    setTask(null); setPhase(PHASE.MAP);
  }

  const cpIndex   = checkpoints.findIndex(cp => cp.id === currentCp?.id);
  const isAdaptiveUnlocked = adaptiveUnlockSecs >= 10;
  const canUnlock = (distance !== null && distance <= UNLOCK_DISTANCE) || isAdaptiveUnlocked;
  let taskType = currentCp?.task_type;
  if (taskType === 'auto' && currentCp) {
    const autoTypes = ['physical', 'cognitive', 'social', 'creative'];
    taskType = autoTypes[(currentCp.order_num - 1) % autoTypes.length];
  }
  const meta      = currentCp ? (TASK_META[taskType] || TASK_META.physical) : null;

  function adjustFrequency(val) {
    playClickSound();
    setBypassFrequency(prev => {
      const newVal = prev + val;
      if (newVal === targetFrequency) {
        setBypassUnlocked(true);
        playUnlockSound();
      } else {
        setBypassUnlocked(false);
      }
      return newVal;
    });
  }

  // ── AR VIEW ──
  if (showAR && phase === PHASE.MAP) {
    return (
      <ARView
        userPos={userPos}
        currentCp={currentCp}
        distance={distance}
        canUnlock={canUnlock}
        taskLoading={taskLoading}
        onClose={() => { setShowAR(false); setArInitializing(false); }}
        onUnlock={() => { setShowAR(false); setArInitializing(false); handleUnlockTask(); }}
        onCameraReady={() => setArInitializing(false)}
      />
    );
  }

  // ── RANKINGS ──
  if (showResults) {
    return (
      <RankingsOverlay
        resultsData={resultsData}
        resultsLoading={resultsLoading}
        session={session}
        team={team}
        checkpointCount={checkpoints.length}
        onClose={() => setShowResults(false)}
      />
    );
  }


  // ── MAP ──
  if (phase === PHASE.MAP) {
    const stabilityPercentage = checkpoints.length > 0 ? Math.round((cpIndex / checkpoints.length) * 100) : 0;

    return (
      <div className="h-screen flex flex-col bg-ag-bg cockpit-curve">
        <div className="scanlines opacity-15" />
        
        {/* Navigation HUD header */}
        <div className="px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-center z-10 flex-shrink-0">
          <div className="cockpit-panel px-5 py-3 flex items-center gap-4 w-full max-w-3xl">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-ag-cyan animate-pulse shadow-[0_0_8px_#00FFD2] shrink-0" />
              <div className="min-w-0">
                <div className="font-orbitron font-black text-ag-yellow text-xs lg:text-sm tracking-[0.2em] uppercase truncate">{team.name}</div>
                <div className="text-[9px] text-ag-muted font-mono-cyber uppercase tracking-widest mt-0.5 hidden sm:block">// TACTICAL NAVIGATION CORE</div>
              </div>
            </div>
            <div className="text-right hidden sm:block shrink-0">
              <div className="text-[9px] text-ag-muted font-mono-cyber uppercase tracking-wider">SECTORS SECURED</div>
              <div className="font-orbitron font-black text-ag-cyan text-xs lg:text-base mt-0.5">
                {stabilityPercentage}% [{cpIndex + 1}/{checkpoints.length}]
              </div>
            </div>
            <button onClick={openResults} className="cockpit-btn-secondary px-4 py-2 text-[10px] tracking-[0.2em] shrink-0">
              SCOREBOARD
            </button>
          </div>
        </div>

        {/* ── Responsive Map Layout ── */}
        <div className="flex-1 relative lg:flex lg:flex-row min-h-0 z-10">

          {/* Left panel: Actions and Status */}
          <div
            className="absolute bottom-6 inset-x-0 mx-auto w-11/12 max-w-md lg:max-w-none lg:relative lg:bottom-auto lg:inset-x-auto lg:mx-0 lg:w-[40%] lg:min-w-[340px] lg:h-full lg:bg-transparent flex flex-col justify-between p-0 lg:p-6"
            style={{ zIndex: 1000 }}
          >
            {currentCp && (
              <div className="cockpit-panel p-4 lg:p-6 space-y-4 lg:space-y-5 flex-1 flex flex-col justify-between">

                {/* ── Target + Distance ── */}
                <div className="space-y-3 lg:space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <span className="text-[9px] text-ag-muted font-mono-cyber uppercase block tracking-widest">TARGET STATION</span>
                      <h3 className="font-orbitron font-black text-base lg:text-lg text-ag-yellow uppercase tracking-wide truncate">
                        {currentCp.label}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] text-ag-muted font-mono-cyber uppercase block tracking-widest">DISTANCE</span>
                      <span className={`font-orbitron font-black text-base lg:text-2xl tracking-wider ${canUnlock ? 'text-ag-green' : 'text-ag-yellow'}`}>
                        {userPos ? fmtDistance(distance) : 'SEARCHING...'}
                      </span>
                    </div>
                  </div>

                  <div className={`py-3 px-4 rounded-lg border text-[11px] font-mono-cyber uppercase text-center font-bold tracking-wider ${
                    canUnlock ? 'border-ag-green/40 bg-ag-green/5 text-ag-green animate-pulse' : 'border-ag-yellow/40 bg-ag-yellow/5 text-ag-yellow'
                  }`}>
                    {canUnlock ? '[ ✔ STATION REACHED — READY TO START ]' : `[ ⚠ WALK WITHIN ${UNLOCK_DISTANCE}M TO UNLOCK ]`}
                  </div>
                </div>

                {/* ── Control Buttons ── */}
                <div className="space-y-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                  <button
                    onClick={handleUnlockTask}
                    disabled={!canUnlock || taskLoading || arInitializing}
                    className="cockpit-btn w-full px-6 py-4 text-xs tracking-[0.25em]"
                  >
                    {taskLoading ? 'PREPARING...' : arInitializing ? 'INITIALIZING CAMERA...' : 'START TASK 🚀'}
                  </button>
                  <button
                    onClick={() => { setArInitializing(true); setShowAR(true); }}
                    disabled={arInitializing}
                    className="cockpit-btn-secondary w-full px-6 py-4 text-xs tracking-[0.25em]"
                  >
                    {arInitializing ? 'INITIALIZING...' : 'AR CAMERA 📷'}
                  </button>
                  <button
                    onClick={() => { clearStudentSession(); navigate('/'); }}
                    className="cockpit-btn-secondary w-full px-6 py-3 text-[11px] tracking-[0.25em] opacity-80 hover:opacity-100"
                  >
                    ← BACK
                  </button>
                </div>
              </div>
            )}
            {!currentCp && (
              <div className="cockpit-panel p-4 lg:p-6">
                <button
                  onClick={() => { clearStudentSession(); navigate('/'); }}
                  className="cockpit-btn-secondary w-full px-6 py-4 text-xs tracking-[0.25em]"
                >
                  ← BACK
                </button>
              </div>
            )}
          </div>

          {/* Right panel: Map */}
          <div className="absolute inset-0 lg:relative lg:flex-1 lg:h-full z-0">
            <StudentMap userPos={userPos} checkpoints={checkpoints} currentCp={currentCp} />

            {gpsError && (
              <div className="absolute top-5 left-5 right-5 z-10 cockpit-panel border-ag-red/60 bg-ag-bg/90 px-4.5 py-3 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-ag-red animate-ping flex-shrink-0" />
                <p className="font-mono-cyber text-[9.5px] text-ag-red tracking-wider uppercase leading-relaxed">
                  GPS TELEMETRY OFFLINE: Please enable location services in your phone/browser settings to track coordinates.
                </p>
              </div>
            )}

            {/* Radar HUD circular tag */}
            <div className="absolute bottom-5 left-5 z-10 cockpit-panel px-3.5 py-3 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full border-2 border-ag-yellow relative overflow-hidden flex items-center justify-center flex-shrink-0">
                <div className="absolute inset-0 border-t-2 border-ag-yellow rounded-full animate-spin" style={{ animationDuration: '3.5s' }} />
                <div className="w-2.5 h-2.5 bg-ag-yellow rounded-full animate-ping" />
              </div>
              <div className="font-mono-cyber text-[10px] leading-snug">
                <div className="text-ag-yellow font-black uppercase tracking-wider">BEACON SCAN RETICLE</div>
                <div className="text-ag-muted uppercase mt-0.5">Telemetry coordinates lock active</div>
              </div>
            </div>
          </div>

        </div>


        {/* Screen 6: SECTOR DISCOVERY OVERLAY */}
        {showDiscoveryOverlay && (
          <DiscoveryOverlay
            currentCp={currentCp}
            onConfirm={() => setShowDiscoveryOverlay(false)}
          />
        )}

        {/* Screen 12: RANDOM EVENTS OVERLAY */}
        <RandomEventOverlay
          randomEvent={randomEvent}
          randomEventTimer={randomEventTimer}
          onDismiss={() => setRandomEvent(null)}
        />
      </div>
    );
  }

  // ── TASK INTERFACE (Unified Task & Decryption Input) ──
  if (phase === PHASE.TASK || phase === PHASE.SUBMIT) {
    const hasResult = !!submitResult;

    return (
      <div className="min-h-screen bg-ag-bg flex flex-col cockpit-curve">
        <div className="scanlines opacity-15" />

        <header className="bg-ag-surface border-b border-ag-border px-4 py-3 z-10 flex flex-col gap-2.5">
          <div className="flex items-center justify-between w-full">
            <div>
              <div className="font-orbitron font-bold text-ag-cyan text-xs uppercase tracking-wider">{task?.ui_theme?.terminal_title || 'STATION CHALLENGE'}</div>
              <div className="text-[9px] text-ag-muted font-mono-cyber uppercase tracking-wider mt-0.5">Station {cpIndex+1} of {checkpoints.length}</div>
            </div>
            <button onClick={openResults} className="text-[9px] font-orbitron font-bold px-3 py-1.5 rounded-lg border border-ag-cyan/35 text-ag-cyan bg-ag-cyan/5 hover:bg-ag-cyan/10 transition-colors uppercase tracking-wider">
              LEADERBOARD
            </button>
          </div>
          {/* Progress Indicators */}
          {!hasResult && (
            <div className="flex items-center justify-between w-full text-[9px] font-mono-cyber px-1 pt-1.5 border-t border-ag-border/30">
              <span className={`flex items-center gap-1 ${taskStep === 0 ? 'text-ag-cyan font-bold' : 'text-ag-muted'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${taskStep === 0 ? 'bg-ag-cyan shadow-[0_0_6px_#00FFD2]' : 'bg-ag-border'}`} /> BRIEF & CHOOSE
              </span>
              <div className="h-0.5 flex-1 mx-3 bg-ag-border/20 rounded" />
              <span className={`flex items-center gap-1 ${taskStep === 1 ? 'text-ag-cyan font-bold' : 'text-ag-muted'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${taskStep === 1 ? 'bg-ag-cyan shadow-[0_0_6px_#00FFD2]' : 'bg-ag-border'}`} /> ACTIVE TIMER
              </span>
              <div className="h-0.5 flex-1 mx-3 bg-ag-border/20 rounded" />
              <span className={`flex items-center gap-1 ${taskStep === 2 ? 'text-ag-cyan font-bold' : 'text-ag-muted'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${taskStep === 2 ? 'bg-ag-cyan shadow-[0_0_6px_#00FFD2]' : 'bg-ag-border'}`} /> TUNER & SUBMIT
              </span>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 z-10">
          {!hasResult ? (
            <>
              {/* Step 1: Briefing & Selection */}
              {taskStep === 0 && task && (
                <TaskCard 
                  task={task} 
                  cpIndex={cpIndex} 
                  selectedOptionId={selectedOptionId} 
                  onSelectOption={setSelectedOptionId} 
                  step={0}
                />
              )}

              {/* Step 2: Protocol Instruction & Tips */}
              {taskStep === 1 && task && (
                <TaskCard 
                  task={task} 
                  cpIndex={cpIndex} 
                  selectedOptionId={selectedOptionId} 
                  onSelectOption={setSelectedOptionId} 
                  step={1}
                />
              )}

              {/* Step 3: Tuner and Submission */}
              {taskStep === 2 && (
                <>
                  {showHints && hintsList.length > 0 && <HintPanel hints={hintsList} />}

                  {/* Step 1: Frequency Tuner Slider */}
                  <div className="ag-panel p-4 border-ag-border/50 bg-[rgba(22,12,44,0.6)] rounded-2xl">
                    <div className="text-[11px] font-orbitron font-bold text-ag-yellow uppercase tracking-wider mb-3 text-center">
                      [ STEP 1: CONNECT TO SIGNAL 📡 ]
                    </div>
                    
                    <div className="bg-ag-bg/60 p-4 rounded-xl border border-ag-border/40 space-y-3">
                      <div className="flex justify-between items-center text-xs font-mono-cyber">
                        <span className="text-ag-muted">YOUR RADIO DIAL:</span>
                        <span className={`font-bold text-sm ${bypassUnlocked ? 'text-ag-green animate-pulse' : 'text-ag-cyan'}`}>
                          {bypassFrequency} GHz
                        </span>
                      </div>

                      <input
                        type="range"
                        min={Math.max(50, targetFrequency - 20)}
                        max={Math.min(150, targetFrequency + 20)}
                        step="1"
                        value={bypassFrequency}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          setBypassFrequency(val);
                          if (val === targetFrequency) {
                            setBypassUnlocked(true);
                            try { playUnlockSound(); } catch (err) {}
                          } else {
                            setBypassUnlocked(false);
                          }
                        }}
                        className="w-full accent-ag-yellow bg-ag-surface h-2 rounded-lg appearance-none cursor-pointer border border-ag-border/50"
                      />

                      <div className="flex justify-between text-[10px] font-mono-cyber uppercase tracking-wider">
                        <span>Target Frequency: {targetFrequency} GHz</span>
                        <span className={bypassUnlocked ? 'text-ag-green font-bold' : 'text-ag-yellow animate-pulse'}>
                          {bypassUnlocked ? '✔ SIGNAL CONNECTED!' : 'SLIDE TO MATCH TARGET'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Decryption Key Input */}
                  {task?.answer_prompt && (
                    <div className="ag-panel p-4 border-ag-green/30 bg-[rgba(22,12,44,0.6)] rounded-2xl">
                      <div className="text-[11px] font-orbitron font-bold text-ag-green uppercase tracking-wider mb-2">
                        [ STEP 2: ENTER MISSION CODE KEY 🔑 ]
                      </div>
                      <p className="text-ag-text text-xs leading-relaxed font-mono-cyber mb-3 bg-ag-bg/50 p-3 rounded-xl border border-ag-border/50">
                        {task.answer_prompt}
                      </p>
                      <input
                        type="text"
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        placeholder="Type the secret keycode here..."
                        className="cyber-input w-full h-12 text-sm uppercase font-mono-cyber tracking-wide rounded-xl"
                        autoComplete="off"
                        required
                      />
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* System Recovery Report (Shown on completion success) */
            <div className="ag-panel p-6 text-center border-ag-green/40 space-y-5 bg-ag-elevated/20">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full border border-ag-green bg-ag-green/5 flex items-center justify-center animate-pulse">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-ag-green">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div className="font-orbitron text-xs font-black text-ag-green uppercase tracking-wider">CHALLENGE COMPLETED & STATION SECURED! 🎉</div>
              
              <div className="space-y-3 max-w-xs mx-auto text-left font-mono-cyber text-[10px]">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-ag-cyan font-bold">⚡ REACTOR ENERGY</span>
                    <span className="text-ag-green font-bold">+12%</span>
                  </div>
                  <div className="h-1 bg-ag-elevated rounded-full overflow-hidden"><div className="h-full bg-ag-cyan" style={{ width: '74%' }} /></div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-ag-purple font-bold">🛡 SHIELD INTEGRITY</span>
                    <span className="text-ag-green font-bold">+8%</span>
                  </div>
                  <div className="h-1 bg-ag-elevated rounded-full overflow-hidden"><div className="h-full bg-ag-purple" style={{ width: '49%' }} /></div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-ag-green font-bold">🌌 NAV ACCURACY</span>
                    <span className="text-ag-green font-bold">+15%</span>
                  </div>
                  <div className="h-1 bg-ag-elevated rounded-full overflow-hidden"><div className="h-full bg-ag-green" style={{ width: '70%' }} /></div>
                </div>
              </div>

              <div className="text-ag-muted text-[9px] font-mono-cyber uppercase tracking-wider mt-2 animate-pulse">
                {submitResult.nextCheckpoint
                  ? `NEXT STATION TO VISIT: ${submitResult.nextCheckpoint.label}`
                  : 'ALL LOBBY STATIONS SECURED!'}
              </div>
            </div>
          )}
        </div>

        <div className="bg-ag-surface border-t border-ag-border px-4 pt-3.5 pb-6 space-y-4 z-10">
          {!hasResult ? (
            <>
              {/* Step Navigation Details */}
              {taskStep === 0 && (
                <button
                  onClick={() => {
                    try { playClickSound(); } catch(e){}
                    setTaskStep(1);
                  }}
                  className="ag-btn-solid w-full h-14 font-orbitron text-sm tracking-wider uppercase font-black"
                >
                  LOCK SELECTION ➔
                </button>
              )}

              {taskStep === 1 && (
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      try { playClickSound(); } catch(e){}
                      setProtocolTimeLeft(task?.duration_seconds || 45);
                      setProtocolTimerActive(true);
                    }}
                    className="flex-1 h-14 border border-ag-purple bg-ag-purple/5 text-ag-purple hover:bg-ag-purple/10 font-orbitron text-sm tracking-wider uppercase rounded-xl font-black transition-colors"
                  >
                    START TIMER ⏱️
                  </button>
                  <button
                    onClick={() => {
                      try { playClickSound(); } catch(e){}
                      setTaskStep(2);
                    }}
                    disabled={!timerCompleted}
                    className={`flex-1 h-14 font-orbitron text-sm font-black tracking-wider rounded-xl transition-all
                      ${timerCompleted
                        ? 'bg-ag-cyan text-ag-bg hover:opacity-90 shadow-[0_0_10px_rgba(0,255,210,0.35)] cursor-pointer'
                        : 'bg-ag-bg/40 border border-ag-border/30 text-ag-muted cursor-not-allowed opacity-50'
                      }`}
                  >
                    NEXT: CONNECT SIGNAL ➔
                  </button>
                </div>
              )}

              {taskStep === 2 && (
                <>
                  {/* Hint request buttons */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        try { playClickSound(); } catch(e){}
                        setShowHints(v => !v);
                      }}
                      disabled={hintsList.length === 0}
                      className="text-xs text-ag-muted underline font-mono-cyber disabled:opacity-40 uppercase tracking-wider"
                    >
                      {hintsList.length > 0 ? `${showHints ? 'Hide' : 'Show'} Hints (${hintsList.length})` : 'No hints used'}
                    </button>
                    <button
                      onClick={() => {
                        try { playClickSound(); } catch(e){}
                        handleRequestHint();
                      }}
                      disabled={hintsUsed >= 3 || hintLoading}
                      className="h-10 px-4 rounded-lg border border-ag-yellow text-ag-yellow bg-ag-yellow/5 hover:bg-ag-yellow/10 text-xs font-orbitron tracking-wider uppercase transition-colors"
                    >
                      {hintLoading ? 'DECRYPTING...' : `GET HINT (${3 - hintsUsed})`}
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        try { playClickSound(); } catch(e){}
                        setTaskStep(1);
                      }}
                      className="w-1/4 h-14 border border-ag-border/50 text-ag-muted font-orbitron text-xs tracking-wider uppercase rounded-xl transition-colors"
                    >
                      ← BACK
                    </button>
                    <button
                      onClick={() => {
                        try { playClickSound(); } catch(e){}
                        handleComplete();
                      }}
                      disabled={submitting || !bypassUnlocked || !answer.trim()}
                      className={`flex-1 h-14 font-orbitron text-sm font-black uppercase tracking-wider rounded-xl transition-all
                        ${(bypassUnlocked && answer.trim())
                          ? 'bg-ag-green text-ag-bg hover:opacity-90 shadow-[0_0_12px_rgba(0,255,136,0.35)] cursor-pointer' 
                          : 'bg-ag-bg/60 border border-ag-border/50 text-ag-muted cursor-not-allowed'}`}
                    >
                      {submitting ? 'SUBMITTING...' : 'SUBMIT ANSWER 🚀'}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : submitResult?.nextCheckpoint ? (
            <button onClick={handleAdvance} className="ag-btn-solid w-full h-12 font-orbitron text-xs tracking-wider uppercase">
              GO TO NEXT STATION ➔
            </button>
          ) : (
            <button onClick={() => setPhase(PHASE.FINISHED)} className="ag-btn-solid w-full h-12 font-orbitron text-xs tracking-wider uppercase">
              SHOW RESULTS ➔
            </button>
          )}
        </div>

        {/* Screen 9: TIMER SCREEN (PROTOCOL ACTIVE) */}
        {protocolTimerActive && (
          <ProtocolTimerOverlay
            task={task}
            selectedOptionId={selectedOptionId}
            protocolTimeLeft={protocolTimeLeft}
            onAbort={() => setProtocolTimerActive(false)}
          />
        )}
      </div>
    );
  }


  // ── FINISHED ──
  if (phase === PHASE.FINISHED) {
    return (
      <FinishedScreen
        onOpenResults={openResults}
        onExit={() => { clearStudentSession(); navigate('/'); }}
      />
    );
  }


  return null;
}
