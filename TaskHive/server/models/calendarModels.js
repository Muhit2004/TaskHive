// Import required packages
import mongoose from "mongoose"; // MongoDB object modeling

// Define the structure of calendar event data in the database
const calendarEventSchema = mongoose.Schema({
  // Reference to the user who owns this event
  userId: {
    type: mongoose.Schema.Types.ObjectId, // MongoDB ObjectId
    ref: "User", // References the User model
    required: [true, "User ID is required"], // Event must belong to a user
    index: true, // Create index for faster queries
  },

  // Event details
  subject: {
    type: String,
    required: [true, "Event subject is required"],
    trim: true, // Remove whitespace
    maxLength: [200, "Subject cannot exceed 200 characters"],
  },

  description: {
    type: String,
    trim: true,
    maxLength: [1000, "Description cannot exceed 1000 characters"],
    default: "",
  },

  // Event timing
  startTime: {
    type: Date,
    required: [true, "Start time is required"],
    index: true, // Index for date queries
  },

  endTime: {
    type: Date,
    required: [true, "End time is required"],
    // Validation removed - handled in controller for better flexibility
    // This prevents issues with partial updates during drag & drop
  },

  isAllDay: {
    type: Boolean,
    default: false,
  },

  // Event categorization and styling
  categoryColor: {
    type: String,
    default: "#4CAF50", // Default green color
    match: [
      /^#[0-9A-F]{6}$/i,
      "Invalid color format. Use hex format like #FF5722",
    ],
  },

  category: {
    type: String,
    enum: ["work", "personal", "meeting", "deadline", "reminder", "other"],
    default: "other",
  },

  // Event location and additional details
  location: {
    type: String,
    trim: true,
    maxLength: [300, "Location cannot exceed 300 characters"],
    default: "",
  },

  // Event recurrence (for future enhancement)
  isRecurring: {
    type: Boolean,
    default: false,
  },

  recurrenceRule: {
    type: String, // Store recurrence pattern (RRULE format)
    default: null,
  },

  // Event priority
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },

  // Event status
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled", "postponed"],
    default: "scheduled",
  },

  // AI-predicted task completion time
  estimatedTime: {
    type: String,
    default: null,
  },

  // Reminders and notifications
  reminderMinutes: {
    type: Number,
    default: 15, // Reminder 15 minutes before event
    min: [0, "Reminder cannot be negative"],
    max: [10080, "Reminder cannot exceed 7 days (10080 minutes)"],
  },

  // Attendees (for future enhancement)
  attendees: [
    {
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      name: {
        type: String,
        trim: true,
      },
      status: {
        type: String,
        enum: ["pending", "accepted", "declined"],
        default: "pending",
      },
    },
  ],

  // Event visibility
  isPrivate: {
    type: Boolean,
    default: false,
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },

  // Track event modifications
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: function () {
      return this.userId;
    },
  },
});

// Indexes for better query performance
calendarEventSchema.index({ userId: 1, startTime: 1 }); // Compound index for user events by date
calendarEventSchema.index({ userId: 1, status: 1 }); // Index for user events by status
calendarEventSchema.index({ startTime: 1, endTime: 1 }); // Index for time range queries

// Middleware to update the updatedAt field before saving
calendarEventSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual field to calculate event duration in minutes
calendarEventSchema.virtual("durationMinutes").get(function () {
  if (this.startTime && this.endTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  return 0;
});

// Virtual field to check if event is happening today
calendarEventSchema.virtual("isToday").get(function () {
  const today = new Date();
  const eventDate = new Date(this.startTime);
  return eventDate.toDateString() === today.toDateString();
});

// Virtual field to check if event is in the past
calendarEventSchema.virtual("isPast").get(function () {
  return new Date() > this.endTime;
});

// Instance method to check if user owns this event
calendarEventSchema.methods.isOwnedBy = function (userId) {
  return this.userId.toString() === userId.toString();
};

// Instance method to format event for Syncfusion calendar
calendarEventSchema.methods.toSyncfusionFormat = function () {
  return {
    Id: this._id,
    Subject: this.subject,
    StartTime: this.startTime,
    EndTime: this.endTime,
    IsAllDay: this.isAllDay,
    Description: this.description,
    Location: this.location,
    CategoryColor: this.categoryColor,
    Category: this.category,
    Priority: this.priority,
    Status: this.status,
    IsPrivate: this.isPrivate,
  };
};

// Static method to find events for a specific user in a date range
calendarEventSchema.statics.findUserEventsInRange = function (
  userId,
  startDate,
  endDate
) {
  return this.find({
    userId: userId,
    $or: [
      // Events that start within the range
      { startTime: { $gte: startDate, $lte: endDate } },
      // Events that end within the range
      { endTime: { $gte: startDate, $lte: endDate } },
      // Events that span the entire range
      { startTime: { $lte: startDate }, endTime: { $gte: endDate } },
    ],
  }).sort({ startTime: 1 });
};

// Static method to find upcoming events for a user
calendarEventSchema.statics.findUpcomingEvents = function (userId, limit = 10) {
  const now = new Date();
  return this.find({
    userId: userId,
    startTime: { $gte: now },
    status: { $in: ["scheduled"] },
  })
    .sort({ startTime: 1 })
    .limit(limit);
};

// Create CalendarEvent model from schema
export const CalendarEvent = mongoose.model(
  "CalendarEvent",
  calendarEventSchema
);
