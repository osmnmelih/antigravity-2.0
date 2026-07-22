import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";

// PUT /api/checkpoints/:id  /  DELETE /api/checkpoints/:id
export const Route = createFileRoute("/api/checkpoints/$id")({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
        const body = (await request.json().catch(() => ({}))) as {
          label?: string;
          lat?: number;
          lng?: number;
        };
        const patch: { label?: string; lat?: number; lng?: number } = {};
        if (body.label != null) patch.label = body.label;
        if (body.lat != null) patch.lat = body.lat;
        if (body.lng != null) patch.lng = body.lng;
        const { data, error } = await db
          .from("checkpoints")
          .update(patch)
          .eq("id", Number(params.id))
          .select()
          .single();
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json(data);
      },
      DELETE: async ({ params }) => {
        const id = Number(params.id);
        await db.from("task_cache").delete().eq("checkpoint_id", id);
        const { error } = await db.from("checkpoints").delete().eq("id", id);
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ success: true });
      },
    },
  },
});
