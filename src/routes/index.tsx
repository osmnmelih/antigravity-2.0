import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import GameApp from "@/GameApp.jsx";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ANTIGRAVITY 2.0 — AR Scavenger Hunt" },
      { name: "description", content: "Web-based AR scavenger hunt with live telemetry, map navigation, and Milano radio comms." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;800;900&family=Share+Tech+Mono&family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<div style={{ minHeight: "100vh", background: "#0A0314" }} />}>
      <GameApp />
    </ClientOnly>
  ),
});
