import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";

// PATCH /api/sessions/:id/status — end / reactivate
export const Route = createFileRoute("/api/sessions/$id/status")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = (await request.json().catch(() => ({}))) as { status?: string };
        if (!body.status || !["active", "ended"].includes(body.status))
          return Response.json({ error: "status must be active or ended" }, { status: 400 });
        const { error } = await db
          .from("sessions")
          .update({ status: body.status })
          .eq("id", Number(params.id));
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ success: true });
      },
    },
  },
});
