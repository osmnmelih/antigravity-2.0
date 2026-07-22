import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";

// GET /api/completions/:teamId
export const Route = createFileRoute("/api/completions/$teamId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { data } = await db
          .from("task_completions")
          .select("*, checkpoints!inner(order_num,task_type,difficulty,label,lat,lng)")
          .eq("team_id", Number(params.teamId));
        const flat = (data ?? []).map((c: any) => ({
          ...c,
          order_num: c.checkpoints?.order_num,
          task_type: c.checkpoints?.task_type,
          difficulty: c.checkpoints?.difficulty,
          label: c.checkpoints?.label,
          lat: c.checkpoints?.lat,
          lng: c.checkpoints?.lng,
        })).sort((a, b) => (a.order_num ?? 0) - (b.order_num ?? 0));
        return Response.json(flat);
      },
    },
  },
});
