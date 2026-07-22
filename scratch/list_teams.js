import { supabaseAdmin as db } from '../src/integrations/supabase/client.server.ts';

async function listAllTeams() {
  const { data: teams, error } = await db.from('teams').select('*');
  if (error) {
    console.error(error);
  } else {
    console.log("Teams in DB:", teams);
  }
}

listAllTeams();
