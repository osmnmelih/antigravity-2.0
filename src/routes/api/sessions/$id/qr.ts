import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";

// GET /api/sessions/:id/qr — return join code (client renders QR locally)
export const Route = createFileRoute("/api/sessions/$id/qr")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { data: session } = await db
          .from("sessions")
          .select("join_code")
          .eq("id", Number(params.id))
          .maybeSingle();
        if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
        return Response.json({ code: session.join_code, qr: null });
      },
    },
  },
});
