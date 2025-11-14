import mongoose from "mongoose";

// ===============================
// GROUP SCHEMA
// ===============================
const groupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: [true, "Group name is required"],
    trim: true,
  },
  groupDescription: {
    type: String,
    default: "",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      role: {
        type: String,
        enum: ["admin", "member"],
        default: "member",
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ===============================
// STUDENT SCHEMA (Group Members/Students)
// ===============================
const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
  },
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "member"],
    default: "member",
  },
  availability: {
    type: Number, // 0-100 (percentage of capacity)
    default: 100,
  },
  currentTasks: {
    type: Number,
    default: 0,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// ===============================
// TASK SCHEMA (Group Tasks with AI Predictions + Calendar Support)
// ===============================
const taskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    unique: true,
  },
  title: {
    type: String,
    required: [true, "Task title is required"],
  },
  description: {
    type: String,
    default: "",
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  assignedTo: {
    name: String,
    userId: mongoose.Schema.Types.ObjectId,
    email: String,
  },
  status: {
    type: String,
    enum: ["Open", "Ready", "In Progress", "Review", "Done"],
    default: "Open",
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Medium",
  },
  estimatedTime: {
    type: String, // AI-generated: "2-3 hours"
    default: "",
  },
  // Calendar-specific fields
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  isAllDay: {
    type: Boolean,
    default: false,
  },
  location: {
    type: String,
    default: "",
  },
  // Legacy field for backward compatibility
  dueDate: {
    type: Date,
  },
  tags: [String], // ["frontend", "bug-fix", "urgent"]
  color: {
    type: String,
    default: "#4318FF",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-increment task ID
taskSchema.pre("save", async function (next) {
  if (!this.taskId) {
    // Use timestamp + random to avoid race conditions
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    this.taskId = `TASK-${timestamp}${random}`;
    console.log("🔢 Generated unique taskId:", this.taskId);
  }
  next();
});

// Update timestamp on save
groupSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

taskSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export const Group = mongoose.model("Group", groupSchema);
export const Student = mongoose.model("Student", studentSchema);
export const GroupTask = mongoose.model("GroupTask", taskSchema);
