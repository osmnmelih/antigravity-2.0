import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";

// POST /api/complete — mark a checkpoint complete
export const Route = createFileRoute("/api/complete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as {
          teamId?: number; checkpointId?: number; timeTaken?: number; answer?: string;
        };
        if (!body.teamId || !body.checkpointId)
          return Response.json({ error: "teamId and checkpointId are required" }, { status: 400 });

        const { data: existing } = await db.from("task_completions").select("*")
          .eq("team_id", body.teamId).eq("checkpoint_id", body.checkpointId).maybeSingle();
        const hintsUsed = existing?.hints_used ?? 0;
        const score = Math.max(40, 100 - hintsUsed * 15);

        if (existing) {
          await db.from("task_completions").update({
            time_taken: body.timeTaken ?? 0, score, answer: body.answer ?? "",
            completed_at: new Date().toISOString(),
          }).eq("id", existing.id);
        } else {
          await db.from("task_completions").insert({
            team_id: body.teamId, checkpoint_id: body.checkpointId,
            time_taken: body.timeTaken ?? 0, hints_used: 0, score, answer: body.answer ?? "",
          });
        }

        const { data: currentCp } = await db.from("checkpoints").select("*").eq("id", body.checkpointId).maybeSingle();
        const { data: team } = await db.from("teams").select("*").eq("id", body.teamId).maybeSingle();
        if (!currentCp || !team) return Response.json({ error: "Missing related rows" }, { status: 500 });

        const { data: nextCp } = await db.from("checkpoints").select("*")
          .eq("session_id", team.session_id)
          .eq("order_num", currentCp.order_num + 1).maybeSingle();

        await db.from("teams").update({ current_checkpoint: nextCp?.id ?? -1 }).eq("id", body.teamId);

        return Response.json({
          success: true, score, hintsUsed, nextCheckpoint: nextCp ?? null, finished: !nextCp,
        });
      },
    },
  },
});
