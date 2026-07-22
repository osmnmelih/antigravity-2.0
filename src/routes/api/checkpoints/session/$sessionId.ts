import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";

// GET /api/checkpoints/session/:sessionId
export const Route = createFileRoute("/api/checkpoints/session/$sessionId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { data, error } = await db
          .from("checkpoints")
          .select("*")
          .eq("session_id", Number(params.sessionId))
          .order("order_num", { ascending: true });
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json(data ?? []);
      },
    },
  },
});
