/**
 * HudActions — top-right chamfered cluster for primary/secondary actions.
 * Renders nothing if no children and no title.
 */
export default function HudActions({ title = null, children }) {
  if (!children && !title) return null;
  return (
    <div className="cockpit-hud-actions pointer-events-auto flex flex-col items-stretch gap-2 min-w-[180px] max-w-[260px]">
      {title && (
        <div className="text-[9px] font-orbitron tracking-[0.3em] text-ag-gold uppercase text-right mb-1">
          ◤ {title}
        </div>
      )}
      <div className="flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}
