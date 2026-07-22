import { supabaseAdmin as db } from '../src/integrations/supabase/client.server.ts';

async function testTaskGen() {
  console.log("Starting diagnostic test...");
  try {
    // 1. Fetch sessions to get a valid checkpoint and team ID
    const { data: sessions, error: sErr } = await db.from('sessions').select('*').limit(1);
    if (sErr) throw sErr;
    if (!sessions || sessions.length === 0) {
      console.log("No sessions in database to test with.");
      return;
    }
    const session = sessions[0];
    console.log("Found session:", session);

    const { data: checkpoints, error: cErr } = await db.from('checkpoints').select('*').eq('session_id', session.id).limit(1);
    if (cErr) throw cErr;
    if (!checkpoints || checkpoints.length === 0) {
      console.log("No checkpoints for session:", session.id);
      return;
    }
    const checkpoint = checkpoints[0];
    console.log("Found checkpoint:", checkpoint);

    const { data: teams, error: tErr } = await db.from('teams').select('*').eq('session_id', session.id).limit(1);
    if (tErr) throw tErr;
    if (!teams || teams.length === 0) {
      console.log("No teams for session:", session.id);
      return;
    }
    const team = teams[0];
    console.log("Found team:", team);

    // Run the task gen query simulations
    console.log("Simulating task_cache read...");
    const { data: cached, error: cacheErr } = await db
      .from("task_cache")
      .select("task_json")
      .eq("checkpoint_id", checkpoint.id)
      .eq("team_id", team.id)
      .maybeSingle();
    if (cacheErr) console.error("Cache read error:", cacheErr);
    else console.log("Cache read success, cached task:", cached);

    // completions query
    const { data: completions, error: compErr } = await db
      .from("task_completions")
      .select("time_taken,score")
      .eq("team_id", team.id);
    if (compErr) console.error("Completions read error:", compErr);
    else console.log("Completions read success:", completions);

    const taskType = "physical";
    const sectorNode = "SECTOR-A1";
    const taskData = {
      anomaly_level: "Critical",
      radio_transmission: "Test transmission",
      protocol: "Test protocol",
      duration_seconds: 45,
      instruction: "Test instruction",
      answer_prompt: "Test prompt",
      type: taskType,
      sector_node: sectorNode
    };

    console.log("Simulating task_cache upsert...");
    const { data: upsertData, error: upsertErr } = await db.from("task_cache").upsert({
      checkpoint_id: checkpoint.id,
      team_id: team.id,
      task_json: taskData,
    }, { onConflict: "checkpoint_id,team_id" }).select();
    if (upsertErr) console.error("Upsert error:", upsertErr);
    else console.log("Upsert success:", upsertData);

  } catch (err) {
    console.error("Diagnostic failed with uncaught exception:", err);
  }
}

testTaskGen();
