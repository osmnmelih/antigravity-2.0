import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";
import { lovableAiComplete, extractJson } from "@/lib/ai-gateway.server";

const MAX_HINTS = 3;
const FALLBACK_HINTS = [
  { hint: "Take a step back and re-read the instructions carefully. What's the very first step asking you to do?", encouragement: "You've totally got this!" },
  { hint: "Focus on the completion criteria — it tells you exactly what 'done' looks like. Work backwards from there.", encouragement: "Almost there, keep pushing!" },
  { hint: "Break it into the smallest possible piece. Just do step 1, then stop and reassess.", encouragement: "One last push — you can nail it!" },
];

export const Route = createFileRoute("/api/hint/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as {
          teamId?: number; checkpointId?: number; taskJson?: any;
        };
        if (!body.teamId || !body.checkpointId || !body.taskJson)
          return Response.json({ error: "teamId, checkpointId and taskJson are required" }, { status: 400 });

        const { data: existing } = await db
          .from("task_completions")
          .select("*")
          .eq("team_id", body.teamId)
          .eq("checkpoint_id", body.checkpointId)
          .maybeSingle();
        const hintsUsed = existing?.hints_used ?? 0;
        if (hintsUsed >= MAX_HINTS)
          return Response.json({ error: "Maximum hints reached", hintsUsed }, { status: 400 });

        const hintNumber = hintsUsed + 1;
        if (existing) {
          await db.from("task_completions")
            .update({ hints_used: hintNumber })
            .eq("id", existing.id);
        } else {
          await db.from("task_completions").insert({
            team_id: body.teamId, checkpoint_id: body.checkpointId,
            hints_used: 1, score: 100,
          });
        }

        const task = typeof body.taskJson === "string" ? JSON.parse(body.taskJson) : body.taskJson;
        let payload: any = FALLBACK_HINTS[hintNumber - 1];

        if (process.env.LOVABLE_API_KEY) {
          const prompt = `A student crew is stuck on this space mission task:

Task/Protocol: ${task.protocol || "Active Task"}
Radio Transmission: ${task.radio_transmission || ""}
Instructions: ${task.instruction || ""}
Answer Prompt: ${task.answer_prompt || ""}

Hint #${hintNumber} of ${MAX_HINTS}.
Write a hint that:
- Does NOT give away the answer
- Gets progressively more helpful (1: vague encouragement, 2: specific guidance, 3: near-direct help)
- Warm and motivating for teenagers

Return ONLY valid JSON:
{"hint": "...", "encouragement": "max 6 words"}`;
          try {
            const raw = await lovableAiComplete(prompt, { maxTokens: 220, temperature: 0.7 });
            payload = extractJson(raw);
          } catch (err) {
            console.warn("AI hint failed, fallback:", (err as Error).message);
          }
        }

        return Response.json({
          ...payload, hintsUsed: hintNumber, hintsRemaining: MAX_HINTS - hintNumber,
        });
      },
    },
  },
});
