# ANTIGRAVITY 2.0 — Guardians-Game Cockpit Redesign

Re-skin the entire app around the logo's violet/magenta duotone, move primary actions to a top-right HUD with a left vertical rail, and add four diegetic cockpit elements: chamfered panels, holo scanlines/glitch, animated nebula starfield, and rivet/warning-stripe chrome.

## 1. Color system (logo-derived, purple-dominant)

Rewrite tokens in `src/styles.css` so violet+magenta own the surfaces; gold/cyan become accent-only.

- `--ag-bg` `#0A0314` (cosmic black-violet)
- `--ag-surface` `#1E0A3C` (deep nebula violet)
- `--ag-elevated` `#3A1470` (panel violet)
- `--ag-violet` `#8A2BE2` (primary)
- `--ag-violet-glow` `#B14EFF`
- `--ag-magenta` `#FF0055` (secondary surfaces + warnings)
- `--ag-magenta-soft` `#7A0030` (magenta panel tint)
- `--ag-gold` `#FFC800` (accent / status only)
- `--ag-cyan` `#00FFD2` (accent / live data only)
- `--ag-text` `#F3E8FF`, `--ag-muted` `#A391BE`

shadcn mapping: `--primary` → violet, `--secondary` → magenta, `--accent` → gold, `--ring` → violet-glow. All `bg-ag-*` / `text-ag-*` utilities re-resolve automatically through `@theme inline`.

## 2. Guardians cockpit chrome (new CSS utilities in styles.css)

- `.cockpit-panel` — chamfered/hex frame via `clip-path: polygon(...)` with double-stroke violet→magenta border, inner 1px gold hairline, faux corner rivets (`::before/::after` dots).
- `.cockpit-rail` — vertical left rail (56px), magenta warning stripes (repeating-linear-gradient at 45°), status LEDs (cyan/gold/magenta pulse dots).
- `.cockpit-hud-actions` — top-right action cluster anchor, chamfered, violet glow.
- `.holo-scanlines` — already exists; intensify on headers only.
- `.holo-glitch` — keyframe that briefly translates ±2px + hue-rotate on hover/focus of headings.
- `.nebula-bg` — fixed background: 3 layered radial gradients (violet/magenta/black) + CSS-only animated star layers (two `box-shadow` star fields with slow `translate3d` drift) + existing `animate-cosmic-drift`.
- `.warning-stripes` — magenta/black 45° repeating gradient used on rail edges and disabled buttons.

## 3. Layout shift — Top-right HUD + left rail

New shared component `src/components/CockpitFrame.jsx` wraps every page:

```text
┌────────────────────────────────────────────────────┐
│ [rail]  page content                  [HUD ACTIONS]│
│  LED                                  ┌──────────┐ │
│  LED                                  │ PRIMARY  │ │
│  LED                                  │ SECONDARY│ │
│  LED                                  └──────────┘ │
│  LED                                               │
└────────────────────────────────────────────────────┘
```

- `<CockpitFrame rail={...} actions={...}>{children}</CockpitFrame>`
- Mobile (<768px): rail collapses to a 40px top strip; HUD actions become a sticky top-right floating cluster (still top-right, not bottom).
- Replace all current bottom/centered primary buttons in Home, TeacherDashboard, SessionMonitor, StudentView, ARView, CommsRadio with the `actions` slot. Secondary/destructive actions go in the rail as icon buttons with tooltips.

## 4. Per-page application

- **Home** — nebula bg full-bleed; logo centered; HUD actions: `OPERATIVE` (violet primary), `COMMANDER` (magenta secondary). Rail: settings, about LEDs.
- **TeacherDashboard** — stepper becomes chamfered panels; `CREATE LOBBY` moves to top-right HUD; rail holds reconnect/refresh/export icons.
- **SessionMonitor** — team cards re-skinned as `cockpit-panel`s with magenta progress fills + gold "live" LEDs; `END SESSION` in top-right HUD (magenta), `EXPORT REPORT` second.
- **StudentView** — map + task panel; `SUBMIT` / `REQUEST HINT` in top-right HUD; rail holds comms, map-recenter, SOS (magenta warning-stripe).
- **ARView** — bearing arrow + lock ring re-tint to violet→magenta gradient with gold "in-range" pulse; `START CHALLENGE` in top-right HUD.
- **CommsRadio** — chamfered panel; PTT button stays large but mirrored to top-right HUD on desktop, bottom-safe on mobile only.

## 5. shadcn variants

Add `cockpit` button variant in `src/components/ui/button.tsx`: chamfered clip-path, violet bg, magenta hover, gold focus ring, warning-stripe disabled state. Keep existing variants intact so non-game UI still works.

## Technical notes

- Tailwind v4: all tokens added under `@theme inline` so utilities (`bg-ag-violet`, `border-ag-magenta`, `ring-ag-gold`) work without config.
- Chamfered frames via `clip-path` (no SVG masks) for cheap repaint.
- Starfield is pure CSS (two `box-shadow` clouds) — no canvas, no JS, mobile-safe.
- Glitch + scanlines wrapped in `@media (prefers-reduced-motion: no-preference)`.
- No business-logic, route, or API changes — pure presentation layer.

## Files touched

- edit: `src/styles.css`, `src/game-theme.css`, `src/components/ui/button.tsx`
- create: `src/components/CockpitFrame.jsx`, `src/components/CockpitRail.jsx`, `src/components/HudActions.jsx`
- edit: `src/pages/Home.jsx`, `src/pages/TeacherDashboard.jsx`, `src/pages/SessionMonitor.jsx`, `src/pages/StudentView.jsx`, `src/components/ARView.jsx`, `src/components/CommsRadio.jsx`, `src/components/QRDisplay.jsx`, `src/components/HintPanel.jsx`, `src/components/TaskCard.jsx`, `src/components/ReportView.jsx`, `src/components/StudentMap.jsx`, `src/components/MapPicker.jsx`
