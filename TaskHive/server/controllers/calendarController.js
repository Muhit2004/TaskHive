// Import required modules
import { CalendarEvent } from "../models/calendarModels.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { predictTaskTime } from "../utils/aiService.js";

// ===============================
// CREATE EVENT
// ===============================

// Create a new calendar event for the authenticated user
export const createEvent = catchAsyncError(async (req, res, next) => {
  const {
    subject,
    description,
    startTime,
    endTime,
    isAllDay,
    categoryColor,
    category,
    location,
    priority,
    reminderMinutes,
    isPrivate,
    recurrenceRule,
    attendees,
  } = req.body;

  // Validation
  if (!subject || !startTime || !endTime) {
    return next(
      new ErrorHandler("Subject, start time, and end time are required", 400)
    );
  }

  // Validate date format and logic
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return next(new ErrorHandler("Invalid date format", 400));
  }

  if (start >= end) {
    return next(new ErrorHandler("End time must be after start time", 400));
  }

  // 🤖 AI: Predict task completion time (if description provided)
  let estimatedTime = null;
  if (description && description.trim().length > 10) {
    try {
      estimatedTime = await predictTaskTime(subject, description);
      console.log("🤖 AI Estimated Time:", estimatedTime);
    } catch (error) {
      console.warn(
        "⚠️ AI time prediction failed, continuing without it:",
        error.message
      );
    }
  }

  // Create new event
  const newEvent = await CalendarEvent.create({
    userId: req.user._id,
    subject: subject.trim(),
    description: description ? description.trim() : "",
    startTime: start,
    endTime: end,
    isAllDay: Boolean(isAllDay),
    categoryColor: categoryColor || "#4CAF50",
    category: category || "other",
    location: location ? location.trim() : "",
    priority: priority || "medium",
    reminderMinutes: reminderMinutes || 15,
    isPrivate: Boolean(isPrivate),
    recurrenceRule: recurrenceRule || null,
    attendees: attendees || [],
    lastModifiedBy: req.user._id,
    estimatedTime: estimatedTime,
  });

  res.status(201).json({
    success: true,
    message: "Calendar event created successfully",
    event: newEvent.toSyncfusionFormat(),
  });
});

// ===============================
// GET USER EVENTS
// ===============================

// Get all events for the authenticated user with pagination and filtering
export const getUserEvents = catchAsyncError(async (req, res, next) => {
  const {
    page = 1,
    limit = 50,
    category,
    status,
    priority,
    sortBy = "startTime",
    order = "asc",
    search,
  } = req.query;

  // Build query
  const query = { userId: req.user._id };

  // Add filters
  if (category) query.category = category;
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (search) {
    query.$or = [
      { subject: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  // Sort order
  const sortOrder = order === "desc" ? -1 : 1;
  const sortObject = { [sortBy]: sortOrder };

  // Execute query
  const events = await CalendarEvent.find(query)
    .sort(sortObject)
    .skip(skip)
    .limit(limitNum)
    .lean();

  // Get total count for pagination
  const totalEvents = await CalendarEvent.countDocuments(query);
  const totalPages = Math.ceil(totalEvents / limitNum);

  // Format events for Syncfusion
  const formattedEvents = events.map((event) => ({
    Id: event._id,
    Subject: event.subject,
    StartTime: event.startTime,
    EndTime: event.endTime,
    IsAllDay: event.isAllDay,
    Description: event.description,
    Location: event.location,
    CategoryColor: event.categoryColor,
    Category: event.category,
    Priority: event.priority,
    Status: event.status,
    IsPrivate: event.isPrivate,
  }));

  res.status(200).json({
    success: true,
    message: "Events retrieved successfully",
    events: formattedEvents,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalEvents,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1,
    },
  });
});

// ===============================
// GET EVENTS BY DATE RANGE
// ===============================

// Get events within a specific date range
export const getEventsByDateRange = catchAsyncError(async (req, res, next) => {
  const { startDate, endDate, timezone = "UTC" } = req.query;

  if (!startDate || !endDate) {
    return next(new ErrorHandler("Start date and end date are required", 400));
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return next(new ErrorHandler("Invalid date format", 400));
  }

  if (start >= end) {
    return next(new ErrorHandler("End date must be after start date", 400));
  }

  // Use the static method from the model
  const events = await CalendarEvent.findUserEventsInRange(
    req.user._id,
    start,
    end
  );

  // Format events for Syncfusion
  const formattedEvents = events.map((event) => event.toSyncfusionFormat());

  res.status(200).json({
    success: true,
    message: `Events retrieved for date range ${startDate} to ${endDate}`,
    events: formattedEvents,
    dateRange: { startDate, endDate, timezone },
    count: events.length,
  });
});

// ===============================
// GET UPCOMING EVENTS
// ===============================

// Get upcoming events for the user
export const getUpcomingEvents = catchAsyncError(async (req, res, next) => {
  const { limit = 10, days = 30 } = req.query;

  const events = await CalendarEvent.findUpcomingEvents(
    req.user._id,
    parseInt(limit)
  );

  // Filter by days if specified
  let filteredEvents = events;
  if (days) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));
    filteredEvents = events.filter((event) => event.startTime <= futureDate);
  }

  const formattedEvents = filteredEvents.map((event) =>
    event.toSyncfusionFormat()
  );

  res.status(200).json({
    success: true,
    message: "Upcoming events retrieved successfully",
    events: formattedEvents,
    count: formattedEvents.length,
  });
});

// ===============================
// GET EVENT BY ID
// ===============================

// Get a specific event by ID
export const getEventById = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const event = await CalendarEvent.findOne({
    _id: id,
    userId: req.user._id,
  });

  if (!event) {
    return next(new ErrorHandler("Event not found or access denied", 404));
  }

  res.status(200).json({
    success: true,
    message: "Event retrieved successfully",
    event: event.toSyncfusionFormat(),
  });
});

// ===============================
// UPDATE EVENT
// ===============================

// Update a specific event
export const updateEvent = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  console.log("📥 Update request received:", { id, updateData });

  // Remove fields that shouldn't be updated directly
  delete updateData._id;
  delete updateData.userId;
  delete updateData.createdAt;

  // Get the existing event first
  const event = await CalendarEvent.findOne({
    _id: id,
    userId: req.user._id,
  });

  if (!event) {
    return next(new ErrorHandler("Event not found or access denied", 404));
  }

  // Validate date logic if dates are being updated
  if (updateData.startTime || updateData.endTime) {
    // Use existing values if not provided
    const startTime = updateData.startTime
      ? new Date(updateData.startTime)
      : event.startTime;
    const endTime = updateData.endTime
      ? new Date(updateData.endTime)
      : event.endTime;

    // Validate dates
    if (isNaN(startTime.getTime())) {
      return next(new ErrorHandler("Invalid start time format", 400));
    }
    if (isNaN(endTime.getTime())) {
      return next(new ErrorHandler("Invalid end time format", 400));
    }

    // Check if end time is after start time (with 1 minute tolerance)
    if (endTime <= startTime) {
      console.error("❌ Date validation failed:", {
        startTime,
        endTime,
        diff: endTime - startTime,
      });
      return next(new ErrorHandler("End time must be after start time", 400));
    }
  }

  // Add metadata
  updateData.updatedAt = new Date();
  updateData.lastModifiedBy = req.user._id;

  console.log("✅ Updating event in database:", updateData);

  // Manually update each field (bypasses ALL validation)
  Object.keys(updateData).forEach((key) => {
    event[key] = updateData[key];
  });

  // Save with validation disabled
  const updatedEvent = await event.save({ validateBeforeSave: false });

  if (!updatedEvent) {
    return next(new ErrorHandler("Event not found or access denied", 404));
  }

  console.log("✅ Event updated successfully:", updatedEvent.subject);

  res.status(200).json({
    success: true,
    message: "Event updated successfully",
    event: updatedEvent.toSyncfusionFormat(),
  });
});

// ===============================
// UPDATE EVENT STATUS
// ===============================

// Update only the status of an event
export const updateEventStatus = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return next(new ErrorHandler("Status is required", 400));
  }

  const validStatuses = ["scheduled", "completed", "cancelled", "postponed"];
  if (!validStatuses.includes(status)) {
    return next(
      new ErrorHandler(
        `Invalid status. Valid statuses: ${validStatuses.join(", ")}`,
        400
      )
    );
  }

  const updatedEvent = await CalendarEvent.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    {
      status,
      updatedAt: new Date(),
      lastModifiedBy: req.user._id,
    },
    { new: true }
  );

  if (!updatedEvent) {
    return next(new ErrorHandler("Event not found or access denied", 404));
  }

  res.status(200).json({
    success: true,
    message: `Event status updated to ${status}`,
    event: updatedEvent.toSyncfusionFormat(),
  });
});

// ===============================
// DELETE EVENT
// ===============================

// Delete a specific event
export const deleteEvent = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const deletedEvent = await CalendarEvent.findOneAndDelete({
    _id: id,
    userId: req.user._id,
  });

  if (!deletedEvent) {
    return next(new ErrorHandler("Event not found or access denied", 404));
  }

  res.status(200).json({
    success: true,
    message: "Event deleted successfully",
    deletedEvent: {
      id: deletedEvent._id,
      subject: deletedEvent.subject,
      startTime: deletedEvent.startTime,
    },
  });
});

// ===============================
// DASHBOARD SUMMARY
// ===============================

// Get calendar dashboard summary
export const getDashboardSummary = catchAsyncError(async (req, res, next) => {
  const { period = "week" } = req.query;
  const userId = req.user._id;

  // Calculate date range based on period
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case "week":
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - now.getDay()
      );
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      return next(
        new ErrorHandler("Invalid period. Use 'week', 'month', or 'year'", 400)
      );
  }

  // Aggregate data
  const [
    totalEvents,
    completedEvents,
    upcomingEvents,
    categoryStats,
    priorityStats,
  ] = await Promise.all([
    // Total events in period
    CalendarEvent.countDocuments({
      userId,
      startTime: { $gte: startDate, $lte: endDate },
    }),

    // Completed events in period
    CalendarEvent.countDocuments({
      userId,
      startTime: { $gte: startDate, $lte: endDate },
      status: "completed",
    }),
    //68dc42068292be3b512a916d
    // 68d7f3e3bbbd896f05b68501
    // Upcoming events (from now)
    CalendarEvent.countDocuments({
      userId,
      startTime: { $gte: now },
      status: "scheduled",
    }),

    // Events by category
    CalendarEvent.aggregate([
      {
        $match: {
          userId,
          startTime: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]),

    // Events by priority
    CalendarEvent.aggregate([
      {
        $match: {
          userId,
          startTime: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  res.status(200).json({
    success: true,
    message: `Dashboard summary for ${period}`,
    summary: {
      period,
      dateRange: { startDate, endDate },
      totalEvents,
      completedEvents,
      upcomingEvents,
      completionRate:
        totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0,
      categoryBreakdown: categoryStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      priorityBreakdown: priorityStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    },
  });
});
