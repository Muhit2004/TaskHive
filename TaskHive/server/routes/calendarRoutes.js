// Import required modules
import express from "express";
import {
  createEvent,
  getUserEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsByDateRange,
  getUpcomingEvents,
  updateEventStatus,
  getDashboardSummary,
} from "../controllers/calendarController.js";
import {
  chatWithAIIndividual,
  suggestTaskTitle,
} from "../controllers/aiChatController.js";
import { isAuthenticated } from "../middlewares/auth.js";

// Create router instance
const router = express.Router();

// Apply authentication middleware to all calendar routes
router.use(isAuthenticated);

// ===============================
// CALENDAR EVENT ROUTES
// ===============================

// POST /api/calendar/events - Create a new calendar event
// Body: { subject, description, startTime, endTime, isAllDay, categoryColor, category, location, priority, reminderMinutes, isPrivate }
router.post("/events", createEvent);

// GET /api/calendar/events - Get all events for the authenticated user
// Query params: ?page=1&limit=50&category=work&status=scheduled&sortBy=startTime&order=asc
router.get("/events", getUserEvents);

// GET /api/calendar/events/range - Get events within a specific date range
// Query params: ?startDate=2024-01-01&endDate=2024-01-31&timezone=UTC
router.get("/events/range", getEventsByDateRange);

// GET /api/calendar/events/upcoming - Get upcoming events for the user
// Query params: ?limit=10&days=30
router.get("/events/upcoming", getUpcomingEvents);

// GET /api/calendar/events/:id - Get a specific event by ID
// Params: { id: eventId }
router.get("/events/:id", getEventById);

// PUT /api/calendar/events/:id - Update a specific event
// Params: { id: eventId }
// Body: { subject, description, startTime, endTime, ... } (partial update supported)
router.put("/events/:id", updateEvent);

// PATCH /api/calendar/events/:id/status - Update only the status of an event
// Params: { id: eventId }
// Body: { status: "completed" | "cancelled" | "postponed" | "scheduled" }
router.patch("/events/:id/status", updateEventStatus);

// DELETE /api/calendar/events/:id - Delete a specific event
// Params: { id: eventId }
router.delete("/events/:id", deleteEvent);

// ===============================
// AI CHAT ROUTES
// ===============================

// POST /api/calendar/ai/chat-individual - AI chat for individual task generation
// Body: { message: string }
router.post("/ai/chat-individual", chatWithAIIndividual);

// POST /api/calendar/task/suggest - AI task title suggestions
// Body: { input: string }
router.post("/task/suggest", suggestTaskTitle);

// POST /api/calendar/task/predict-time - AI task time prediction
// Body: { taskTitle: string, taskDescription: string }
router.post("/task/predict-time", async (req, res) => {
  try {
    const { predictTaskTime } = await import("../utils/aiService.js");
    const { taskTitle, taskDescription } = req.body;

    if (!taskTitle || !taskDescription) {
      return res.status(400).json({
        success: false,
        message: "Task title and description are required",
      });
    }

    const estimatedTime = await predictTaskTime(taskTitle, taskDescription);

    res.status(200).json({
      success: true,
      estimatedTime: estimatedTime,
    });
  } catch (error) {
    console.error("Error predicting task time:", error);
    res.status(200).json({
      success: true,
      estimatedTime: "2-3 hours", // Fallback
    });
  }
});

// ===============================
// DASHBOARD AND ANALYTICS ROUTES
// ===============================

// GET /api/calendar/dashboard - Get calendar dashboard summary
// Query params: ?period=week|month|year
router.get("/dashboard", getDashboardSummary);

// ===============================
// BULK OPERATIONS (Future Enhancement)
// ===============================

// POST /api/calendar/events/bulk - Create multiple events at once
// Body: { events: [...] }
router.post("/events/bulk", (req, res) => {
  res.status(501).json({
    success: false,
    message: "Bulk operations will be implemented in future versions",
  });
});

// DELETE /api/calendar/events/bulk - Delete multiple events
// Body: { eventIds: [...] }
router.delete("/events/bulk", (req, res) => {
  res.status(501).json({
    success: false,
    message: "Bulk operations will be implemented in future versions",
  });
});

// ===============================
// EXPORT AND IMPORT (Future Enhancement)
// ===============================

// GET /api/calendar/export - Export user's calendar events
// Query params: ?format=ical|json&startDate=...&endDate=...
router.get("/export", (req, res) => {
  res.status(501).json({
    success: false,
    message: "Calendar export will be implemented in future versions",
  });
});

// POST /api/calendar/import - Import calendar events
// Body: FormData with calendar file
router.post("/import", (req, res) => {
  res.status(501).json({
    success: false,
    message: "Calendar import will be implemented in future versions",
  });
});

// ===============================
// SHARING AND COLLABORATION (Future Enhancement)
// ===============================

// POST /api/calendar/events/:id/share - Share an event with other users
// Params: { id: eventId }
// Body: { emails: [...], permissions: "view" | "edit" }
router.post("/events/:id/share", (req, res) => {
  res.status(501).json({
    success: false,
    message: "Event sharing will be implemented in future versions",
  });
});

// GET /api/calendar/shared - Get events shared with the user
router.get("/shared", (req, res) => {
  res.status(501).json({
    success: false,
    message: "Shared events will be implemented in future versions",
  });
});

// ===============================
// REMINDERS AND NOTIFICATIONS (Future Enhancement)
// ===============================

// GET /api/calendar/reminders - Get active reminders for the user
router.get("/reminders", (req, res) => {
  res.status(501).json({
    success: false,
    message: "Reminders will be implemented in future versions",
  });
});

// POST /api/calendar/events/:id/snooze - Snooze a reminder
// Params: { id: eventId }
// Body: { snoozeMinutes: 10 }
router.post("/events/:id/snooze", (req, res) => {
  res.status(501).json({
    success: false,
    message: "Reminder snoozing will be implemented in future versions",
  });
});

// ===============================
// ERROR HANDLING MIDDLEWARE
// ===============================

// Handle 404 for calendar routes - catch any unmatched routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Calendar route ${req.originalUrl} not found`,
  });
});

export default router;
