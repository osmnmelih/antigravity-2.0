import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";

// GET /api/report/:sessionId — basic stats (AI narrative deferred to next pass)
export const Route = createFileRoute("/api/report/$sessionId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const sessionId = Number(params.sessionId);
        const { data: session } = await db.from("sessions").select("*").eq("id", sessionId).maybeSingle();
        if (!session) return Response.json({ error: "Session not found" }, { status: 404 });

        const { data: checkpoints } = await db.from("checkpoints").select("*")
          .eq("session_id", sessionId).order("order_num", { ascending: true });
        const { data: teams } = await db.from("teams").select("*").eq("session_id", sessionId);

        const totalCheckpoints = checkpoints?.length ?? 0;
        const teamStats = await Promise.all((teams ?? []).map(async (team) => {
          const { data: comps } = await db.from("task_completions")
            .select("*, checkpoints!inner(order_num,task_type,difficulty,label)")
            .eq("team_id", team.id);
          const completions = comps ?? [];
          const totalScore = completions.reduce((s, c: any) => s + (c.score ?? 0), 0);
          const avgTime = completions.length
            ? Math.round(completions.reduce((s, c: any) => s + (c.time_taken ?? 0), 0) / completions.length)
            : 0;
          const totalHints = completions.reduce((s, c: any) => s + (c.hints_used ?? 0), 0);
          
          const details = completions.map((c: any) => ({
            checkpointLabel: c.checkpoints?.label || `Node ${c.checkpoints?.order_num}`,
            taskType: c.checkpoints?.task_type || 'physical',
            timeTaken: c.time_taken,
            hintsUsed: c.hints_used,
            score: c.score,
            answer: c.answer || 'N/A'
          }));

          return {
            teamName: team.name,
            checkpointsCompleted: completions.length,
            totalCheckpoints,
            completionRate: totalCheckpoints ? Math.round((completions.length / totalCheckpoints) * 100) : 0,
            totalScore,
            avgTimeSeconds: avgTime,
            totalHintsUsed: totalHints,
            completionsList: details,
          };
        }));

        let aiNarrative = {
          overallSquadSync: "The session shows strong performance across squads. Most teams successfully maintained steady aerobic pacing and demonstrated active task engagement.",
          missionHighlights: [
            "Completed continuous shuttle runs focusing on cardiovascular endurance training.",
            "Demonstrated spatial coordination and physical positioning tasks in group settings.",
            "Coordinated team efforts and synchronized exercise protocols successfully."
          ],
          teamObservations: (teams ?? []).map(t => ({
            teamName: t.name,
            observation: "Good active performance. The crew pacing remained consistent throughout the challenges."
          })),
          suggestions: [
            "Use the 45-second duration intervals as a baseline for future aerobic training setups.",
            "Integrate similar short movement breaks between standard classroom curriculum topics to improve student focus."
          ]
        };

        if (process.env.LOVABLE_API_KEY) {
          try {
            const { lovableAiComplete, extractJson } = await import("@/lib/ai-gateway.server");
            const systemPrompt = `You are a professional physical education curriculum specialist.
Analyze physical activity data from a school game session and generate a clear, professional pedagogical report.
Do NOT use game lore, sci-fi terms, or space theme terminology (e.g. do NOT use words like "Milano", "sectors", "thrusters", "crews", "anomalies", "syncing sectors"). Write in plain, professional teacher-facing language.
Focus on:
1. Cardiovascular/aerobic endurance benefits of the specific actions performed (running, high-knees jogging, planks, jumping jacks).
2. Zone of Proximal Development (ZPD) and physical pacing adaptation.
3. Classroom integration tips for the teacher.

Session: "${session.name}"
Teams: ${JSON.stringify(teamStats)}

Return ONLY valid JSON (no markdown):
{
  "overallSquadSync": "A clear, professional summary of overall team pacing, cardiovascular engagement, and motor coordination.",
  "missionHighlights": ["Direct highlight of physical effort", "Direct highlight of team coordination"],
  "teamObservations": [
    { "teamName": "Team Name", "observation": "Curriculum-focused observation of this specific team's stamina and performance" }
  ],
  "suggestions": ["Upgrade/suggestion 1 for classroom physical education integration", "Upgrade/suggestion 2 for physical learning breaks"]
}`;
            const raw = await lovableAiComplete("Compile pedagogical activity log.", { systemPrompt, maxTokens: 600 });
            const parsed = extractJson(raw) as any;
            if (parsed && typeof parsed === "object") {
              aiNarrative = {
                overallSquadSync: parsed.overallSquadSync || aiNarrative.overallSquadSync,
                missionHighlights: parsed.missionHighlights || aiNarrative.missionHighlights,
                teamObservations: parsed.teamObservations || aiNarrative.teamObservations,
                suggestions: parsed.suggestions || aiNarrative.suggestions
              };
            }
          } catch (e) {
            console.warn("Report AI narrative failed:", e);
          }
        }

        return Response.json({
          session: { name: session.name, code: session.join_code, status: session.status },
          totalCheckpoints,
          totalTeams: teams?.length ?? 0,
          teams: teamStats,
          overallSquadSync: aiNarrative.overallSquadSync,
          missionHighlights: aiNarrative.missionHighlights,
          teamObservations: aiNarrative.teamObservations,
          suggestions: aiNarrative.suggestions,
          narrative: aiNarrative.overallSquadSync
        });
      },
    },
  },
});
