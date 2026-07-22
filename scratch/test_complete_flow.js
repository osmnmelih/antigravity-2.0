import axios from 'axios';

const BASE_URL = 'https://antigravity-2-0-seven.vercel.app/api';

async function runFlow() {
  try {
    console.log("1. Creating session...");
    const sessionName = `Test Session ${Date.now()}`;
    const createRes = await axios.post(`${BASE_URL}/sessions`, { name: sessionName });
    const session = createRes.data;
    console.log("Created Session:", session);

    console.log("2. Adding checkpoints...");
    const cps = [];
    for (let i = 1; i <= 3; i++) {
      const cpRes = await axios.post(`${BASE_URL}/checkpoints`, {
        session_id: session.id,
        lat: 49.254602 + i * 0.001,
        lng: 7.040482 + i * 0.001,
        order_num: i,
        label: `Station Node ${i}`
      });
      cps.push(cpRes.data);
      console.log(`Added checkpoint ${i}:`, cpRes.data);
    }

    console.log("3. Joining as a team...");
    const joinRes = await axios.post(`${BASE_URL}/sessions/${session.join_code}/join`, {
      teamName: "Diagnostic Crew"
    });
    const { team } = joinRes.data;
    console.log("Joined Team:", team);

    console.log("4. Simulating task generation for Checkpoint ID:", cps[0].id, "Team ID:", team.id);
    const taskRes = await axios.get(`${BASE_URL}/task/${cps[0].id}/${team.id}`);
    console.log("Task generated successfully!");
    console.log("Task Data:", taskRes.data);

  } catch (err) {
    console.error("FLOW FAILED!");
    if (err.response) {
      console.error("Response status:", err.response.status);
      console.error("Response data:", err.response.data);
    } else {
      console.error("Error message:", err.message);
    }
  }
}

runFlow();
