import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  createGroup,
  getMyGroups,
  getGroupById,
  deleteGroup,
  addStudent,
  getStudentsByGroup,
  removeStudent,
  leaveGroup,
  getAITaskSuggestions,
  createTask,
  getTasksByGroup,
  updateTaskStatus,
  deleteTask,
  getTasksByStudent,
  getMyTasks,
  createGroupCalendarEvent,
  getGroupCalendarEvents,
  getMyGroupCalendarEvents,
  updateGroupCalendarEvent,
  deleteGroupCalendarEvent,
  fixTaskCounts,
} from "../controllers/groupController.js";
import { chatWithAI } from "../controllers/aiChatController.js";

const router = express.Router();

// ===============================
// GROUP ROUTES
// ===============================
router.post("/group/create", isAuthenticated, createGroup);
router.get("/group/my-groups", isAuthenticated, getMyGroups);
router.get("/group/:id", isAuthenticated, getGroupById);
router.delete("/group/:id", isAuthenticated, deleteGroup);

// ===============================
// STUDENT ROUTES
// ===============================
router.post("/student/add", isAuthenticated, addStudent);
router.get("/student/group/:groupId", isAuthenticated, getStudentsByGroup);
router.delete("/student/:id", isAuthenticated, removeStudent);
router.post("/group/:groupId/leave", isAuthenticated, leaveGroup);

// ===============================
// TASK ROUTES (WITH AI)
// ===============================
router.post("/task/suggest", isAuthenticated, getAITaskSuggestions); // AI Suggestions
router.post("/ai/chat", isAuthenticated, chatWithAI); // AI Chat for Task Distribution
router.post("/task/create", isAuthenticated, createTask); // Create with AI
router.get("/task/my-tasks", isAuthenticated, getMyTasks); // Get my assigned tasks
router.get("/task/group/:groupId", isAuthenticated, getTasksByGroup);
router.get("/task/student/:userId", isAuthenticated, getTasksByStudent);
router.put("/task/:id", isAuthenticated, updateTaskStatus);
router.delete("/task/:id", isAuthenticated, deleteTask);

// ===============================
// GROUP CALENDAR ROUTES
// ===============================
router.post("/calendar/create", isAuthenticated, createGroupCalendarEvent);
router.get("/calendar/group/:groupId", isAuthenticated, getGroupCalendarEvents);
router.get("/calendar/my-events", isAuthenticated, getMyGroupCalendarEvents);
router.put("/calendar/:id", isAuthenticated, updateGroupCalendarEvent);
router.delete("/calendar/:id", isAuthenticated, deleteGroupCalendarEvent);

// ===============================
// UTILITY ROUTES
// ===============================
router.post("/fix-task-counts", isAuthenticated, fixTaskCounts);

export default router;
