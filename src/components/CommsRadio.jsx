import { useState, useEffect } from 'react';
import { playClickSound } from '../utils/audio.js';

const CHARACTERS = {
  starlord: { name: 'Star-Lord (Peter Quill)', color: '#00FFD2', avatar: '🎧', tag: 'Leader' },
  rocket: { name: 'Rocket Raccoon', color: '#FFC800', avatar: '🦝', tag: 'Weapons & Tech' },
  gamora: { name: 'Gamora', color: '#00FF88', avatar: '⚔️', tag: 'Assassin' },
  drax: { name: 'Drax the Destroyer', color: '#FF0055', avatar: '👹', tag: 'Muscle' },
  groot: { name: 'Groot', color: '#8A2BE2', avatar: '🌱', tag: 'Flora Colossus' }
};

const RANDOM_CHATTER = [
  { char: 'starlord', text: "Guys, the hyper-thruster is leaking coolant again. Rocket, did you tape it with duct tape?" },
  { char: 'rocket', text: "It's carbon-fiber nano-mesh tape, Quill! And it holds perfectly unless Drax tries to eat it again!" },
  { char: 'drax', text: "It smelled of space cherries. I am not ashamed of my culinary exploration." },
  { char: 'gamora', text: "Focus! The crew is out there risking their lives to lock down these sector nodes. Scan the signals!" },
  { char: 'groot', text: "I am Groot... (Translated: Turn up the 80s track, Quill! This terminal vibe is too quiet!)" },
  { char: 'starlord', text: "Alright crew, telemetry looks good. Keep moving between nodes or Rocket gets cranky." },
  { char: 'rocket', text: "Who's cranky?! I'll blow up the next asteroid block we pass just to prove I'm happy!" }
];

export default function CommsRadio({ currentCpIndex, checkpointsCount, teamSpeed, teamFatigue }) {
  const [messages, setMessages] = useState([
    { char: 'starlord', text: "Comms established. Scavengers, do you copy? Stabilize the sector nodes to get us out of this quadrant!", time: '10:00' }
  ]);
  const [staticPulse, setStaticPulse] = useState(false);

  useEffect(() => {
    // Generate periodic funny chat or react to speed/fatigue changes
    const interval = setInterval(() => {
      setStaticPulse(true);
      setTimeout(() => setStaticPulse(false), 800);

      // Construct dynamic message based on session conditions
      let nextMsg = null;
      if (teamSpeed === 'fast') {
        nextMsg = {
          char: 'rocket',
          text: "Look at 'em go! Those scavengers are moving faster than a Nova Corp interceptor!"
        };
      } else if (teamFatigue === 'high') {
        nextMsg = {
          char: 'gamora',
          text: "Scavengers, telemetry indicates high fatigue levels. Stabilize in a secure zone and vent core heat."
        };
      } else {
        // Random chatter fallback
        nextMsg = RANDOM_CHATTER[Math.floor(Math.random() * RANDOM_CHATTER.length)];
      }

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      setMessages(prev => [
        ...prev.slice(-4), // Keep last 5 messages
        { ...nextMsg, time: timeStr }
      ]);
    }, 15000);

    return () => clearInterval(interval);
  }, [teamSpeed, teamFatigue]);

  return (
    <div className="cyber-card relative p-4 overflow-hidden border border-cyber-border/40" 
         style={{ background: 'rgba(10,3,20,0.85)' }}>
      {/* Radio header */}
      <div className="flex items-center justify-between border-b border-cyber-border/30 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${staticPulse ? 'bg-cyber-pink animate-ping' : 'bg-cyber-cyan'} transition-all`} />
          <span className="font-orbitron text-xs font-bold text-cyber-cyan tracking-widest uppercase">
            MILANO RADIO COMMS FEED
          </span>
        </div>
        <div className="text-[10px] font-mono-cyber text-cyber-muted">
          FREQ: 88.5 FM // SYNTH_LINK
        </div>
      </div>

      {/* Message window */}
      <div className="space-y-3 h-48 overflow-y-auto pr-1">
        {messages.map((msg, i) => {
          const char = CHARACTERS[msg.char] || CHARACTERS.starlord;
          return (
            <div key={i} className="flex gap-2.5 items-start text-xs border-b border-white/5 pb-2 last:border-0">
              <span className="text-lg bg-cyber-bg/50 border border-cyber-dim p-1 rounded-lg leading-none">
                {char.avatar}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-orbitron font-bold uppercase tracking-wider" style={{ color: char.color }}>
                    {char.name}
                  </span>
                  <span className="text-[9px] text-cyber-muted font-mono-cyber">{msg.time}</span>
                </div>
                <p className="text-cyber-text leading-relaxed font-mono-cyber text-[11px]">{msg.text}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Decorative scanner line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyber-cyan to-transparent opacity-40 animate-pulse" />
    </div>
  );
}
