import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";

function rand6() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export const Route = createFileRoute("/api/sessions/")({
  server: {
    handlers: {
      // POST /api/sessions  — create
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { name?: string };
        const name = body.name?.trim();
        if (!name) return Response.json({ error: "Session name is required" }, { status: 400 });

        for (let i = 0; i < 5; i++) {
          const join_code = rand6();
          const { data, error } = await db
            .from("sessions")
            .insert({ name, join_code, status: "active" })
            .select()
            .single();
          if (!error) return Response.json(data);
          if (!String(error.message).toLowerCase().includes("duplicate")) {
            return Response.json({ error: error.message }, { status: 500 });
          }
        }
        return Response.json({ error: "Could not allocate join code" }, { status: 500 });
      },
    },
  },
});
