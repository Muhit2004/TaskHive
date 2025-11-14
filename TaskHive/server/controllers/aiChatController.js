import axios from "axios";
import { getTaskSuggestions, predictTaskTime } from "../utils/aiService.js";
import { Group, Student, GroupTask } from "../models/groupModels.js";
import { CalendarEvent } from "../models/calendarModels.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";

// ===============================
// AI CHAT CONTROLLER - Gemini Integration
// ===============================

// Helper to get API key dynamically
const getGeminiConfig = () => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  return { GEMINI_API_KEY, GEMINI_API_URL };
};

// ⏳ Retry Helper with Exponential Backoff (longer delays for 503 errors)
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 2000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isOverloaded = error?.response?.data?.error?.code === 503;
      const isRateLimited = error?.response?.data?.error?.code === 429;
      const shouldRetry =
        (isOverloaded || isRateLimited) && attempt < maxRetries;

      if (shouldRetry) {
        // Exponential backoff: 2s, 4s, 8s
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(
          `⏳ AI Chat Retry ${attempt}/${maxRetries} in ${delay}ms... (Reason: ${
            isOverloaded ? "Model overloaded" : "Rate limited"
          })`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};

// 🤖 AI Chat for Task Distribution
export const chatWithAI = catchAsyncError(async (req, res, next) => {
  const { groupId, message } = req.body;

  if (!groupId || !message) {
    return next(new ErrorHandler("Group ID and message are required", 400));
  }

  const { GEMINI_API_KEY, GEMINI_API_URL } = getGeminiConfig();

  if (!GEMINI_API_KEY) {
    return next(new ErrorHandler("AI service not configured", 500));
  }

  try {
    // 1. Fetch group with members
    const group = await Group.findById(groupId).populate("members.userId");
    if (!group) {
      return next(new ErrorHandler("Group not found", 404));
    }

    // 2. Get all students (including admin)
    const students = await Student.find({ groupId: groupId }).lean();

    // 3. Create member list with task counts
    const memberDataPromises = group.members.map(async (member) => {
      const student = students.find(
        (s) => s.userId.toString() === member.userId._id.toString()
      );

      const taskCount = await GroupTask.countDocuments({
        GroupId: groupId,
        AssigneeEmail: member.userId.email,
      });

      return {
        name: member.userId.name,
        email: member.userId.email,
        role: member.role || "member",
        currentTasks: taskCount,
        availability: student?.availability || 100,
      };
    });

    const memberData = await Promise.all(memberDataPromises);

    // 4. Get existing tasks for context
    const existingTasks = await GroupTask.find({ GroupId: groupId })
      .sort({ StartTime: 1 })
      .limit(20)
      .lean();

    const taskSummary = existingTasks
      .map(
        (t) =>
          `- ${t.Subject} (Assigned to: ${t.AssigneeName}, Status: ${t.Status}, Priority: ${t.Priority})`
      )
      .join("\n");

    // 5. Build AI prompt with full context
    const memberList = memberData
      .map(
        (m) =>
          `- ${m.name} (${m.email}): ${m.currentTasks} current tasks, ${m.availability}% availability, Role: ${m.role}`
      )
      .join("\n");

    const systemPrompt = `You are an AI assistant helping a team manage their schedule and distribute tasks efficiently.

**Team Members:**
${memberList}

**Current Tasks (${existingTasks.length}):**
${taskSummary || "No tasks yet"}

**User Message:**
"${message}"

**Instructions:**
Analyze the user's message and the team's current workload. Generate 3-4 actionable tasks that would help the team. Keep descriptions concise (1-2 sentences max). For each task, recommend the best team member to assign it to based on their current workload and availability.

IMPORTANT: Return ONLY valid JSON, no extra text before or after. Keep task descriptions brief.

Respond in this EXACT JSON format:
{
  "explanation": "Brief analysis (max 2 sentences)",
  "tasks": [
    {
      "title": "Short task title",
      "description": "Brief description (1-2 sentences)",
      "suggestedAssignee": "member@email.com",
      "priority": "High|Medium|Low",
      "estimatedDays": 3
    }
  ]
}`;

    // 6. Call Gemini API with retry
    const result = await retryWithBackoff(async () => {
      const response = await axios.post(
        GEMINI_API_URL,
        {
          contents: [
            {
              parts: [
                {
                  text: systemPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096, // Increased from 2048 to allow longer responses
            responseMimeType: "application/json", // Force JSON output - NO markdown blocks!
          },
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 20000, // Increased to 20 seconds for longer responses
        }
      );

      return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    });

    // 7. Parse JSON response (with responseMimeType set, should always be valid JSON)
    let parsedResponse;
    try {
      // With responseMimeType: "application/json", Gemini returns pure JSON (no markdown)
      const cleanedResponse = result.trim();

      console.log(
        "📥 Raw AI response:",
        cleanedResponse.substring(0, 200) + "..."
      );

      parsedResponse = JSON.parse(cleanedResponse);

      console.log("✅ Successfully parsed JSON response");
    } catch (parseError) {
      console.error("❌ Failed to parse AI response:", result);
      console.error("Parse error details:", parseError.message);

      // If JSON parsing fails, try to auto-fix incomplete JSON
      try {
        console.log("⚠️ Attempting to fix incomplete JSON...");
        let fixedResponse = result.trim();

        // Remove any markdown blocks (shouldn't happen with responseMimeType, but just in case)
        fixedResponse = fixedResponse
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "");

        // Count open/close braces and brackets
        const openBraces = (fixedResponse.match(/{/g) || []).length;
        const closeBraces = (fixedResponse.match(/}/g) || []).length;
        const openBrackets = (fixedResponse.match(/\[/g) || []).length;
        const closeBrackets = (fixedResponse.match(/\]/g) || []).length;

        // Add missing closing brackets/braces
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          fixedResponse += "\n    }\n  ]";
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          fixedResponse += "\n}";
        }

        parsedResponse = JSON.parse(fixedResponse);
        console.log("✅ Successfully fixed and parsed JSON");
      } catch (fixError) {
        console.error("❌ Auto-fix failed:", fixError.message);
        return next(
          new ErrorHandler(
            "AI response was incomplete or invalid. Please try rephrasing your question or asking for fewer tasks.",
            500
          )
        );
      }
    }

    // 8. Return structured response
    res.status(200).json({
      success: true,
      explanation: parsedResponse.explanation || "Tasks generated successfully",
      tasks: parsedResponse.tasks || [],
      memberData: memberData, // Include member data for frontend dropdown
    });
  } catch (error) {
    console.error(
      "❌ Error in AI Chat:",
      error?.response?.data || error.message
    );

    // Handle specific error types with user-friendly messages
    const errorCode = error?.response?.data?.error?.code;
    let errorMessage = "Failed to process AI request. Please try again.";

    if (errorCode === 503) {
      errorMessage =
        "🔥 AI service is currently experiencing high traffic. Please wait a few moments and try again. You can also try asking for fewer tasks or a simpler question.";
    } else if (errorCode === 429) {
      errorMessage =
        "⏰ Rate limit reached. Please wait 30 seconds before trying again.";
    } else if (error?.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    }

    return next(new ErrorHandler(errorMessage, 500));
  }
});

// 🤖 AI Chat for Individual Task Generation
export const chatWithAIIndividual = catchAsyncError(async (req, res, next) => {
  const { message } = req.body;
  const userId = req.user._id;

  if (!message) {
    return next(new ErrorHandler("Message is required", 400));
  }

  const { GEMINI_API_KEY, GEMINI_API_URL } = getGeminiConfig();

  if (!GEMINI_API_KEY) {
    return next(new ErrorHandler("AI service not configured", 500));
  }

  try {
    // Get user's existing tasks for context
    const existingTasks = await CalendarEvent.find({ userId })
      .sort({ startTime: 1 })
      .limit(20)
      .lean();

    const taskSummary = existingTasks
      .map(
        (t) => `- ${t.subject} (Status: ${t.status}, Priority: ${t.priority})`
      )
      .join("\n");

    // Build AI prompt
    const systemPrompt = `You are an AI assistant helping a user manage their personal schedule and tasks.

**User's Current Tasks (${existingTasks.length}):**
${taskSummary || "No tasks yet"}

**User Message:**
"${message}"

**Instructions:**
Analyze the user's message and current workload. Generate 3-4 actionable personal tasks. Keep descriptions concise (1-2 sentences max).

IMPORTANT: Return ONLY valid JSON, no extra text.

Respond in this EXACT JSON format:
{
  "explanation": "Brief analysis (max 2 sentences)",
  "tasks": [
    {
      "title": "Short task title",
      "description": "Brief description (1-2 sentences)",
      "priority": "High|Medium|Low",
      "estimatedDays": 3
    }
  ]
}`;

    // Call Gemini API with retry
    const result = await retryWithBackoff(async () => {
      const response = await axios.post(
        GEMINI_API_URL,
        {
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 20000,
        }
      );
      return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    });

    // Parse JSON response
    let parsedResponse;
    try {
      const cleanedResponse = result.trim();
      console.log(
        "📥 Raw AI response:",
        cleanedResponse.substring(0, 200) + "..."
      );
      parsedResponse = JSON.parse(cleanedResponse);
      console.log("✅ Successfully parsed JSON response");
    } catch (parseError) {
      console.error("❌ Failed to parse AI response:", result);
      console.error("Parse error details:", parseError.message);

      // Try to auto-fix incomplete JSON
      try {
        console.log("⚠️ Attempting to fix incomplete JSON...");
        let fixedResponse = result
          .trim()
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "");

        const openBraces = (fixedResponse.match(/{/g) || []).length;
        const closeBraces = (fixedResponse.match(/}/g) || []).length;
        const openBrackets = (fixedResponse.match(/\[/g) || []).length;
        const closeBrackets = (fixedResponse.match(/\]/g) || []).length;

        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          fixedResponse += "\n    }\n  ]";
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          fixedResponse += "\n}";
        }

        parsedResponse = JSON.parse(fixedResponse);
        console.log("✅ Successfully fixed and parsed JSON");
      } catch (fixError) {
        console.error("❌ Auto-fix failed:", fixError.message);
        return next(
          new ErrorHandler(
            "AI response was incomplete. Please try rephrasing your question.",
            500
          )
        );
      }
    }

    res.status(200).json({
      success: true,
      explanation: parsedResponse.explanation || "Tasks generated successfully",
      tasks: parsedResponse.tasks || [],
    });
  } catch (error) {
    console.error(
      "❌ Error in AI Chat:",
      error?.response?.data || error.message
    );

    const errorCode = error?.response?.data?.error?.code;
    let errorMessage = "Failed to process AI request. Please try again.";

    if (errorCode === 503) {
      errorMessage =
        "🔥 AI service is currently experiencing high traffic. Please try again in a moment.";
    } else if (errorCode === 429) {
      errorMessage = "⏰ Rate limit reached. Please wait 30 seconds.";
    } else if (error?.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    }

    return next(new ErrorHandler(errorMessage, 500));
  }
});

// 🤖 AI Task Title Suggestions
export const suggestTaskTitle = catchAsyncError(async (req, res, next) => {
  const { input } = req.body;

  if (!input || input.length < 3) {
    return res.status(200).json({
      success: true,
      suggestions: [], // Return empty array
    });
  }

  try {
    console.log("🧠 Calling getTaskSuggestions from aiService.js for:", input);
    const suggestionsText = await getTaskSuggestions(input);

    // The service returns a single string with newlines. Split it into an array.
    const suggestionArray = suggestionsText
      .split("\n")
      .map((s) => s.replace(/^\d+\.\s*/, "").trim()) // Remove numbering and trim whitespace
      .filter((s) => s !== ""); // Remove any empty strings

    console.log(
      "✅ Suggestions received from aiService, sending to frontend:",
      suggestionArray
    );

    res.status(200).json({
      success: true,
      suggestions: suggestionArray, // Send as an array
    });
  } catch (error) {
    console.error("❌ Error in suggestTaskTitle controller:", error.message);
    // Pass the error to the error handling middleware
    return next(new ErrorHandler("Failed to get AI suggestions.", 500));
  }
});
