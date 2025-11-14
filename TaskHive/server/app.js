// CRITICAL: Load environment variables FIRST before any imports that use them
import { config } from "dotenv"; // Load environment variables from config.env
config({ path: "config.env" }); // Load env vars IMMEDIATELY

// Import required packages and modules
import express from "express"; // Web framework for Node.js
import cors from "cors"; // Enable cross-origin requests between frontend and backend
import cookieParser from "cookie-parser"; // Parse cookies from HTTP requests
import { connection } from "./database/dbConnection.js"; // Database connection function
import { errorMiddleware } from "./middlewares/error.js"; // Custom error handler
import userRoutes from "./routes/userRoutes.js"; // All user-related API routes
import calendarRoutes from "./routes/calendarRoutes.js"; // All calendar-related API routes
import groupRoutes from "./routes/groupRoutes.js"; // All group-related API routes (tasks, employees)
import aiRoutes from "./routes/aiRoutes.js"; // All AI-related API routes
import dashboardRoutes from "./routes/dashboardRoutes.js"; // All dashboard-related API routes
import { removeUnverifiedAccounts } from "./automation/removeUnverifiedAccounts.js"; // Cleanup unverified accounts

// Create Express application instance
export const app = express(); // This is the main server app

// Configure CORS - allows frontend to communicate with backend
app.use(
  cors({
    origin: [process.env.FRONTEND_URL], // Only allow requests from our frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"], // Allow these HTTP methods
    credentials: true, // Allow cookies to be sent with requests
  })
);

// Middleware to parse different types of incoming data
app.use(express.json()); // Parse JSON data from request body
app.use(cookieParser()); // Parse cookies from requests (for JWT tokens)
app.use(express.urlencoded({ extended: true })); // Parse form data from HTML forms

// Register API routes - all user endpoints will start with /api/v1/user
app.use("/api/v1/user", userRoutes); // Examples: /api/v1/user/register, /api/v1/user/login

// Register calendar API routes - all calendar endpoints will start with /api/v1/calendar
app.use("/api/v1/calendar", calendarRoutes); // Examples: /api/v1/calendar/events, /api/v1/calendar/dashboard

// Register group API routes - all group endpoints will start with /api/v1/group
app.use("/api/v1/group", groupRoutes); // Examples: /api/v1/group/task/create, /api/v1/group/employee/add

// Register AI API routes
app.use("/api/v1/ai", aiRoutes);

// Register Dashboard API routes
app.use("/api/v1/dashboard", dashboardRoutes);

// Start automated cleanup task
removeUnverifiedAccounts(); // Remove old unverified accounts periodically

// Connect to MongoDB database
connection(); // Establish database connection before handling requests

// Error handling middleware - MUST be last middleware
app.use(errorMiddleware); // Catches all errors and sends proper error responses
