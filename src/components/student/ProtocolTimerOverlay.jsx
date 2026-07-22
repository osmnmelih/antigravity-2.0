/**
 * Full-screen "protocol active" countdown shown during the antigravity
 * tether mini-task. Pure presentational.
 */
export default function ProtocolTimerOverlay({ task, selectedOptionId, protocolTimeLeft, onAbort }) {
  const fmt = (n) => (n < 10 ? `0${n}` : `${n}`);

  const autonomyOptions = task?.sdt_mechanics?.autonomy_options || [];
  const selectedOption = autonomyOptions.find(opt => opt.id === selectedOptionId) || autonomyOptions[0];
  
  const activeLabel = selectedOption ? selectedOption.label : (task?.protocol || "ACTIVE PROTOCOL");
  const activeInstruction = selectedOption ? selectedOption.instruction : (task?.instruction || "Perform the physical activity.");

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-center font-mono-cyber border-4 border-ag-purple animate-fade-in">
      <div className="scanlines opacity-30" />
      <div className="space-y-8 max-w-sm">
        <div className="space-y-1">
          <h2 className="font-orbitron font-black text-xl text-ag-purple tracking-widest uppercase animate-pulse">
            PROTOCOL ACTIVE
          </h2>
          <p className="text-[10px] text-ag-cyan tracking-wider uppercase font-bold">
            {activeLabel}
          </p>
        </div>

        <div className="w-40 h-40 rounded-full border-4 border-ag-purple flex items-center justify-center bg-ag-purple/5 shadow-[0_0_24px_rgba(138,43,226,0.25)] relative mx-auto">
          <div className="absolute inset-2 rounded-full border border-dashed border-ag-cyan/40 animate-spin" style={{ animationDuration: '10s' }} />
          <span className="font-orbitron font-black text-3xl text-ag-text">
            00:{fmt(protocolTimeLeft)}
          </span>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-ag-muted uppercase tracking-widest leading-relaxed">
            {activeInstruction}
          </p>
          <div className="font-orbitron font-black text-[10px] text-ag-cyan tracking-widest uppercase animate-pulse">
            MAINTAIN BEACON TELEMETRY OUTPUT
          </div>
        </div>

        <button
          onClick={onAbort}
          className="w-40 h-10 border border-ag-red/40 text-ag-red hover:bg-ag-red/10 text-[9px] font-orbitron tracking-widest uppercase rounded-xl"
        >
          Abort Protocol
        </button>
      </div>
    </div>
  );
}
