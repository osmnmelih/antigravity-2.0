import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";

// POST /api/checkpoints — add checkpoint
export const Route = createFileRoute("/api/checkpoints/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as {
          session_id?: number;
          lat?: number;
          lng?: number;
          order_num?: number;
          label?: string;
        };
        if (!body.session_id || body.lat == null || body.lng == null)
          return Response.json({ error: "session_id, lat, lng are required" }, { status: 400 });

        let order = body.order_num;
        if (order == null) {
          const { data } = await db
            .from("checkpoints")
            .select("order_num")
            .eq("session_id", body.session_id)
            .order("order_num", { ascending: false })
            .limit(1);
          order = ((data?.[0]?.order_num as number | undefined) ?? 0) + 1;
        }

        const { data: cp, error } = await db
          .from("checkpoints")
          .insert({
            session_id: body.session_id,
            lat: body.lat,
            lng: body.lng,
            task_type: "auto",
            difficulty: "auto",
            order_num: order,
            label: body.label?.trim() || `Sector Node ${order}`,
          })
          .select()
          .single();
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json(cp);
      },
    },
  },
});
