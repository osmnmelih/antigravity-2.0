import axios from 'axios';

async function testTaskRoute() {
  const url = 'https://antigravity-2-0-seven.vercel.app/api/task/37/21';
  try {
    const res = await axios.get(url);
    console.log("Status:", res.status);
    console.log("Headers:", res.headers);
    console.log("Response Body:", res.data);
  } catch (err) {
    if (err.response) {
      console.error("Error Status:", err.response.status);
      console.error("Error Data:", err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  }
}

testTaskRoute();
