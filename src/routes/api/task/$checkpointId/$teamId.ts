import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";
import { lovableAiComplete, extractJson } from "@/lib/ai-gateway.server";

const AUTO_TYPES = ["physical", "cognitive", "social", "creative"] as const;

const FALLBACKS: Record<string, any> = {
  physical: {
    anomaly_level: "Critical",
    radio_transmission: "STATUS: Station Power Offline\nCHALLENGE: Energy reserve depleted.\nGOAL: Initiate active physical movement to restore station power.\nREWARD: Power grid restored (+85%)",
    protocol: "Aerobic Pacing Challenge",
    duration_seconds: 45,
    instruction: "Sprint or run in place continuously for 45 seconds to generate energy for the station.",
    answer_prompt: "Count the total number of steps or stairs nearest to your team, multiply it by 2, and enter the total.",
    sdt_mechanics: {
      autonomy_options: [
        {
          id: "cardio_run",
          label: "Active Running",
          instruction: "Sprint or run on the spot continuously for 45 seconds to generate energy."
        },
        {
          id: "power_jacks",
          label: "Cardio Jumping Jacks",
          instruction: "Perform continuous jumping jacks for 45 seconds to generate energy."
        }
      ],
      relatedness_rules: "Coordinate with your pacing partner. Try to match each other's step counts.",
      competence_tip: "Maintain a steady breathing rhythm. Consistency and pacing beat raw speed."
    }
  },
  cognitive: {
    anomaly_level: "Warning",
    radio_transmission: "STATUS: Security Lock active\nCHALLENGE: System interface blocked.\nGOAL: Scan and organize local coordinates to bypass the lock.\nREWARD: System bypass active (+90%)",
    protocol: "Spatial Discovery Protocol",
    duration_seconds: 60,
    instruction: "Locate 3 unique physical objects in your immediate area and write down their names in alphabetical order.",
    answer_prompt: "Write down 3 surrounding objects in alphabetical order, then combine their first letters in UPPERCASE.",
    sdt_mechanics: {
      autonomy_options: [
        {
          id: "alphabet_objects",
          label: "Object Alphabetization",
          instruction: "Find 3 physical objects around you. Write down their names in alphabetical order."
        },
        {
          id: "color_objects",
          label: "Color Grouping",
          instruction: "Find 3 nearby objects that share the exact same color. Write down their names."
        }
      ],
      relatedness_rules: "Divide and conquer: One teammate scans for items while the other records and processes the list.",
      competence_tip: "Observe your immediate surroundings closely. Everyday objects count!"
    }
  },
  social: {
    anomaly_level: "Warning",
    radio_transmission: "STATUS: Team Link Offline\nCHALLENGE: Communications signal weak.\nGOAL: Perform synchronized actions to align security locks.\nREWARD: Communications link restored (+80%)",
    protocol: "Group Synchronization Routine",
    duration_seconds: 40,
    instruction: "All team members must complete 15 synchronized jumping jacks together in unison.",
    answer_prompt: "Add up the birth months of all team members (e.g. Jan = 1, Dec = 12) and type the total sum.",
    sdt_mechanics: {
      autonomy_options: [
        {
          id: "sync_jacks",
          label: "Synchronized Jacks",
          instruction: "All team members must complete 15 synchronized jumping jacks in unison."
        },
        {
          id: "mirror_squats",
          label: "Coordinated Squats",
          instruction: "Perform 10 mirror squats face-to-face, moving in synchronization with your teammate."
        }
      ],
      relatedness_rules: "Maintain visual contact with your partner to stay in sync.",
      competence_tip: "Begin with a moderate rhythm. Synchronization is about timing rather than speed."
    }
  },
  creative: {
    anomaly_level: "Warning",
    radio_transmission: "STATUS: Station Grid Unstable\nCHALLENGE: Structural integrity weak.\nGOAL: Perform balance holds to stabilize the defense grid.\nREWARD: Stabilization protocol active (+70%)",
    protocol: "Core Stability Challenge",
    duration_seconds: 30,
    instruction: "All team members hold a steady plank position for 30 seconds.",
    answer_prompt: "Find 3 metallic or stone structures nearby. Count their total edges and enter the number.",
    sdt_mechanics: {
      autonomy_options: [
        {
          id: "plank_hold",
          label: "Stability Plank Hold",
          instruction: "All team members hold a solid plank position for 30 seconds."
        },
        {
          id: "one_leg_balance",
          label: "Single-Leg Balance",
          instruction: "Hold a steady single-leg balance pose for 30 seconds. Switch legs if needed."
        }
      ],
      relatedness_rules: "Support your team. Call out the remaining seconds to encourage your teammates.",
      competence_tip: "Focus your eyes on a single stationary spot on the ground to maintain your balance."
    }
  },
};

export const Route = createFileRoute("/api/task/$checkpointId/$teamId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const checkpointId = Number(params.checkpointId);
        const teamId = Number(params.teamId);

        // Geolocation distance enforcement
        const url = new URL(request.url, "http://localhost");
        const latParam = url.searchParams.get("lat");
        const lngParam = url.searchParams.get("lng");
        const isBypassed = url.searchParams.get("bypass") === "true";

        const { data: checkpoint } = await db
          .from("checkpoints").select("*").eq("id", checkpointId).maybeSingle();
        if (!checkpoint) return Response.json({ error: "Checkpoint not found" }, { status: 404 });

        if (!isBypassed) {
          if (!latParam || !lngParam) {
            return Response.json({ error: "Location coordinates required to unlock task." }, { status: 400 });
          }
          const uLat = parseFloat(latParam);
          const uLng = parseFloat(lngParam);
          if (isNaN(uLat) || isNaN(uLng)) {
            return Response.json({ error: "Invalid location coordinates." }, { status: 400 });
          }

          // Calculate distance (Haversine)
          const R = 6371000; // Earth radius in meters
          const toRad = (d: number) => (d * Math.PI) / 180;
          const dLat = toRad(checkpoint.lat - uLat);
          const dLon = toRad(checkpoint.lng - uLng);
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(uLat)) * Math.cos(toRad(checkpoint.lat)) * Math.sin(dLon / 2) ** 2;
          const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

          // Allow a small buffer above 20m for GPS accuracy (total 25m)
          if (dist > 25) {
            return Response.json({ error: "Too far from checkpoint station! Walk closer to lock on." }, { status: 400 });
          }
        }

        // cache hit
        const { data: cached } = await db
          .from("task_cache")
          .select("task_json")
          .eq("checkpoint_id", checkpointId)
          .eq("team_id", teamId)
          .maybeSingle();
        if (cached?.task_json) return Response.json(cached.task_json);

        const { data: team } = await db
          .from("teams").select("*").eq("id", teamId).maybeSingle();
        if (!team) return Response.json({ error: "Team not found" }, { status: 404 });

        let taskType = checkpoint.task_type;
        if (!taskType || taskType === "auto") {
          taskType = AUTO_TYPES[(checkpoint.order_num - 1) % AUTO_TYPES.length];
        }

        const { data: completions } = await db
          .from("task_completions")
          .select("time_taken,score")
          .eq("team_id", teamId)
          .order("id", { ascending: false });
        const completed = completions ?? [];
        let teamSpeed = "moderate", fatigue = "low";
        if (completed.length > 0) {
          const recent = completed.slice(0, 3).map((c) => c.time_taken ?? 0);
          const avg = recent.reduce((a, b) => a + b, 0) / Math.max(1, recent.length);
          if (avg < 120) teamSpeed = "fast"; else if (avg > 360) teamSpeed = "slow";
          if (completed.length >= 4) fatigue = "high"; else if (completed.length >= 2) fatigue = "medium";
        }

        const fallback = FALLBACKS[taskType] || FALLBACKS.physical;
        let duration = fallback.duration_seconds;
        if (fatigue === "high") duration = Math.max(20, Math.round(duration * 0.75));
        if (teamSpeed === "fast") duration = Math.round(duration * 1.1);

        const sectorNode = `SECTOR-${String.fromCharCode(64 + checkpoint.order_num)}${checkpoint.order_num + 16}`;

        let taskData: any = { ...fallback, duration_seconds: duration, type: taskType, sector_node: sectorNode };

        if (process.env.LOVABLE_API_KEY) {
          try {
            const systemPrompt = `You are a physical education specialist and game designer.
Generate a fun, extremely simple to understand physical education challenge for students aged 12-17.
Use very basic words that any student can understand instantly. Keep a professional physical education tone with a light gamified framing.
Do NOT use specific movie character names (e.g. avoid Star-Lord, Groot, Drax) or overly heavy sci-fi jargon (e.g. avoid plasma, shields, warp). Use standard, formal physical education and activity terms.

Focus on Self-Determination Theory (SDT) principles:
- Autonomy: Provide a choice of two physical options.
- Competence: Ensure tasks are scaled to match physical abilities.
- Relatedness: Suggest cooperative team behavior.

Task Parameters:
- Category: ${taskType}.
- Target action: ${taskType === 'physical' ? 'Cardio endurance / Active running' : 'Group coordination / observation puzzle'}
- Checkpoint: #${checkpoint.order_num} named "${checkpoint.label}".

Return ONLY valid JSON (no markdown):
{
  "anomaly_level": "Critical" | "Warning" | "Stable",
  "radio_transmission": "STATUS: ...\\nCHALLENGE: ...\\nGOAL: ...\\nREWARD: ...",
  "protocol": "Simple formal challenge title (e.g. Cardio endurance pacing)",
  "duration_seconds": 30-60,
  "instruction": "One sentence direct instructions on what physical action the team must do.",
  "sdt_mechanics": {
    "autonomy_options": [
      { "id": "option_1_id", "label": "Option 1 Title", "instruction": "One sentence instruction for option 1" },
      { "id": "option_2_id", "label": "Option 2 Title", "instruction": "One sentence instruction for option 2" }
    ],
    "relatedness_rules": "One sentence explaining team collaboration or support strategy",
    "competence_tip": "One supportive sentence or strategy tip to build competence"
  },
  "answer_prompt": "Simple question about the surroundings to get the key code (e.g. Count the red benches near you)."
}`;
            const raw = await lovableAiComplete("Generate the adaptive JSON task now.", {
              systemPrompt, maxTokens: 400, temperature: 0.9,
            });
            const gen = extractJson(raw) as any;
            if (gen && typeof gen === "object") {
              taskData = { ...fallback, ...gen, duration_seconds: gen.duration_seconds || duration, type: taskType, sector_node: sectorNode };
            }
          } catch (err) {
            console.warn("AI task gen failed, using fallback:", (err as Error).message);
          }
        }

        await db.from("task_cache").upsert({
          checkpoint_id: checkpointId, team_id: teamId, task_json: taskData,
        }, { onConflict: "checkpoint_id,team_id" });

        return Response.json(taskData);
      },
    },
  },
});
