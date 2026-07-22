import { supabaseAdmin as db } from '../src/integrations/supabase/client.server.ts';

async function listAllCheckpoints() {
  const { data: checkpoints, error } = await db.from('checkpoints').select('*');
  if (error) {
    console.error(error);
  } else {
    console.log("Checkpoints in DB:", checkpoints);
  }
}

listAllCheckpoints();
