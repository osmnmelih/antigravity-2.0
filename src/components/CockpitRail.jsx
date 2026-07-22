/**
 * CockpitRail — vertical warning-stripe rail of LED status dots & icon buttons.
 * items: [{ id, label, color?, onClick?, icon? }]
 * Collapses to a horizontal top strip on small screens.
 */
export default function CockpitRail({ items = [] }) {
  if (!items.length) return null;

  return (
    <aside className="cockpit-rail flex md:flex-col flex-row md:items-center items-center md:gap-5 gap-4 md:py-5 px-3 md:px-0 shrink-0 overflow-x-auto md:overflow-visible">
      {items.map((it) => {
        const led = (
          <span
            className="cockpit-led"
            style={{ '--led-color': it.color || '#00FFD2' }}
            title={it.label}
            aria-label={it.label}
          />
        );
        if (it.onClick) {
          return (
            <button
              key={it.id}
              onClick={it.onClick}
              title={it.label}
              className="group flex md:flex-col items-center gap-1 hover:scale-110 transition-transform"
            >
              {it.icon ? (
                <span className="text-ag-violet-glow group-hover:text-ag-gold transition-colors text-base">
                  {it.icon}
                </span>
              ) : led}
              <span className="hidden md:block text-[8px] font-orbitron tracking-widest text-ag-muted uppercase">
                {it.label}
              </span>
            </button>
          );
        }
        return (
          <div key={it.id} className="flex md:flex-col items-center gap-1">
            {led}
            <span className="hidden md:block text-[8px] font-orbitron tracking-widest text-ag-muted uppercase">
              {it.label}
            </span>
          </div>
        );
      })}
    </aside>
  );
}
