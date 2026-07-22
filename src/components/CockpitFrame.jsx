/**
 * CockpitFrame — Guardians-of-the-Galaxy diegetic cockpit shell.
 * Wraps a page with:
 *  - animated nebula starfield background
 *  - holographic scanlines
 *  - left vertical warning-stripe rail (collapses to top strip on mobile)
 *  - top-right HUD action cluster (sticky)
 */
import CockpitRail from './CockpitRail.jsx';
import HudActions from './HudActions.jsx';

export default function CockpitFrame({
  rail = [],
  actions = null,
  title = null,
  children,
  className = '',
}) {
  return (
    <div className={`relative min-h-screen text-ag-text ${className}`}>
      {/* Animated nebula + starfield (fixed, behind everything) */}
      <div className="nebula-bg" aria-hidden />

      {/* Scanlines overlay */}
      <div className="scanlines opacity-20" aria-hidden />

      <div className="flex min-h-screen md:flex-row flex-col relative z-10">
        {rail && rail.length > 0 && <CockpitRail items={rail} />}

        <div className="flex-1 min-w-0 relative">
          {/* Top-right HUD action cluster */}
          {(actions || title) && (
            <div className="sticky top-3 z-30 flex justify-end pointer-events-none px-3 md:px-5 pt-2">
              <HudActions title={title}>{actions}</HudActions>
            </div>
          )}

          <div className="relative z-10 -mt-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
