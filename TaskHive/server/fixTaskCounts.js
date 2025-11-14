// Quick script to fix task counts
import axios from "axios";

const API_BASE_URL = "http://localhost:4000/api/v1/group";

async function fixTaskCounts() {
  try {
    console.log("🔧 Fixing task counts...");

    const response = await axios.post(
      `${API_BASE_URL}/fix-task-counts`,
      {},
      {
        withCredentials: true,
        headers: {
          Cookie: process.env.AUTH_COOKIE || "", // You'll need to provide your auth cookie
        },
      }
    );

    console.log("✅ Success:", response.data);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

fixTaskCounts();
