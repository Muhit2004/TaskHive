import axios from "axios";
import { config } from "dotenv";

// Load environment variables
config({ path: "./config.env" });

// ===============================
// AI SERVICE - Google Gemini Integration
// ===============================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Debug: Log API key status on module load
console.log(
  "🔑 GEMINI_API_KEY loaded:",
  GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : "NOT FOUND"
);
console.log("🌐 GEMINI_API_URL:", GEMINI_API_URL.substring(0, 80) + "...");

// � Simple In-Memory Cache for Suggestions (5 minute TTL)
const suggestionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedSuggestions = (input) => {
  const cached = suggestionCache.get(input.toLowerCase());
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("✅ Using cached suggestions for:", input);
    return cached.data;
  }
  return null;
};

const setCachedSuggestions = (input, data) => {
  suggestionCache.set(input.toLowerCase(), {
    data,
    timestamp: Date.now(),
  });
};

// �🔄 Retry Helper with Exponential Backoff
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isOverloaded = error?.response?.data?.error?.code === 503;
      const isLastAttempt = attempt === maxRetries;

      if (isOverloaded && !isLastAttempt) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // 1s, 2s, 4s
        console.log(
          `⏳ Retry attempt ${attempt}/${maxRetries} in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error; // Re-throw if not overloaded or last attempt
      }
    }
  }
};

// ✨ Auto-Completion: Suggest task names based on input
export const getTaskSuggestions = async (inputText) => {
  try {
    if (!GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY not found in environment variables");
      return "Error: API key not configured.";
    }

    // Check cache first
    const cached = getCachedSuggestions(inputText);
    if (cached) return cached;

    const result = await retryWithBackoff(async () => {
      const response = await axios.post(
        GEMINI_API_URL,
        {
          contents: [
            {
              parts: [
                {
                  text: `Suggest 5 related task names for: "${inputText}". Format as a numbered list.`,
                },
              ],
            },
          ],
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000, // 10 second timeout
        }
      );

      return (
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No suggestions found."
      );
    });

    // Cache the result
    setCachedSuggestions(inputText, result);
    return result;
  } catch (error) {
    console.error(
      "❌ Error in Gemini API (Task Suggestions):",
      error?.response?.data || error.message
    );
    return "Unable to fetch suggestions. Please try again later.";
  }
};

// ⏱️ Task Time Prediction: Estimate completion time
export const predictTaskTime = async (taskTitle, taskDescription) => {
  try {
    if (!GEMINI_API_KEY) {
      return "2-3 hours"; // Fallback
    }

    const result = await retryWithBackoff(async () => {
      const response = await axios.post(
        GEMINI_API_URL,
        {
          contents: [
            {
              parts: [
                {
                  text: `Estimate the time required to complete this task in hours and minutes (answer in one line only):
Title: ${taskTitle}
Description: ${taskDescription}`,
                },
              ],
            },
          ],
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000, // 10 second timeout
        }
      );

      return (
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Unable to estimate time."
      );
    });

    return result;
  } catch (error) {
    console.error(
      "❌ Error in Gemini API (Time Prediction):",
      error?.response?.data || error.message
    );
    return "2-3 hours"; // Fallback to default
  }
};

// 🤖 Smart Task Assignment: Recommend best student based on availability
export const recommendEmployee = async (taskDescription, employees) => {
  try {
    if (!GEMINI_API_KEY) {
      // Fallback: Pick student with least tasks
      return employees.sort((a, b) => a.currentTasks - b.currentTasks)[0];
    }

    const employeeList = employees
      .map(
        (emp) =>
          `${emp.name} (Email: ${emp.email}, Current Tasks: ${emp.currentTasks})`
      )
      .join("\n");

    const result = await retryWithBackoff(async () => {
      const response = await axios.post(
        GEMINI_API_URL,
        {
          contents: [
            {
              parts: [
                {
                  text: `Based on the following task and student information, recommend the BEST student to assign this task to. Return ONLY the student name, nothing else.

Task: ${taskDescription}

Students:
${employeeList}`,
                },
              ],
            },
          ],
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000, // 10 second timeout
        }
      );

      const recommendedName =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

      // Find matching student
      const matchedEmployee = employees.find((emp) =>
        recommendedName.toLowerCase().includes(emp.name.toLowerCase())
      );

      return matchedEmployee || employees[0]; // Fallback to first student
    });

    return result;
  } catch (error) {
    console.error(
      "❌ Error in Gemini API (Student Recommendation):",
      error?.response?.data || error.message
    );
    // Fallback: Pick student with least tasks
    return employees.sort((a, b) => a.currentTasks - b.currentTasks)[0];
  }
};

// 📝 Grammar Check using LanguageTool
export const checkGrammar = async (text) => {
  try {
    const response = await axios.post(
      "https://api.languagetool.org/v2/check",
      null,
      {
        params: {
          text: text,
          language: "en-US",
        },
      }
    );

    return response.data.matches.map((match) => ({
      error: match.message,
      replacements: match.replacements.map((r) => r.value),
    }));
  } catch (error) {
    console.error("❌ Error in LanguageTool API:", error);
    return [];
  }
};
