import axios from 'axios';
import { supabaseAdmin as db } from '../src/integrations/supabase/client.server.ts';

async function testLiveApi() {
  try {
    const { data: sessions } = await db.from('sessions').select('*').limit(1);
    if (!sessions || sessions.length === 0) {
      console.log("No sessions found");
      return;
    }
    const session = sessions[0];
    const { data: checkpoints } = await db.from('checkpoints').select('*').eq('session_id', session.id).limit(1);
    const { data: teams } = await db.from('teams').select('*').eq('session_id', session.id).limit(1);

    if (!checkpoints || checkpoints.length === 0 || !teams || teams.length === 0) {
      console.log("No checkpoints or teams found to test with");
      return;
    }

    const checkpointId = checkpoints[0].id;
    const teamId = teams[0].id;

    const liveUrl = `https://antigravity-2-0-seven.vercel.app/api/task/${checkpointId}/${teamId}`;
    console.log(`Sending request to live URL: ${liveUrl}`);

    const res = await axios.get(liveUrl);
    console.log("Response status:", res.status);
    console.log("Response data:", res.data);
  } catch (err) {
    if (err.response) {
      console.error("API Error Response Status:", err.response.status);
      console.error("API Error Response Data:", err.response.data);
    } else {
      console.error("Error connecting to live API:", err.message);
    }
  }
}

testLiveApi();
