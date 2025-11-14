import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Group, Student, GroupTask } from "../models/groupModels.js";
import { User } from "../models/userModels.js";
import {
  getTaskSuggestions,
  predictTaskTime,
  recommendEmployee,
} from "../utils/aiService.js";

// ===============================
// GROUP MANAGEMENT
// ===============================

// Create new group
export const createGroup = catchAsyncError(async (req, res, next) => {
  const { groupName, groupDescription } = req.body;

  const group = await Group.create({
    groupName,
    groupDescription,
    createdBy: req.user._id,
    members: [
      {
        userId: req.user._id,
        role: "admin",
      },
    ],
  });

  res.status(201).json({
    success: true,
    message: "Group created successfully",
    group,
  });
});

// Get all groups for logged-in user
export const getMyGroups = catchAsyncError(async (req, res, next) => {
  const groups = await Group.find({
    "members.userId": req.user._id,
  }).populate("createdBy", "name email");

  res.status(200).json({
    success: true,
    groups,
  });
});

// Get single group details
export const getGroupById = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const group = await Group.findById(id)
    .populate("createdBy", "name email")
    .populate("members.userId", "name email");

  if (!group) {
    return next(new ErrorHandler("Group not found", 404));
  }

  res.status(200).json({
    success: true,
    group,
  });
});

// Delete group (admin only)
export const deleteGroup = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const group = await Group.findById(id);
  if (!group) {
    return next(new ErrorHandler("Group not found", 404));
  }

  // Check if current user is admin of the group
  const member = group.members.find(
    (m) => m.userId.toString() === req.user._id.toString()
  );
  if (!member || member.role !== "admin") {
    return next(new ErrorHandler("Only group admins can delete groups", 403));
  }

  // Delete all related students
  await Student.deleteMany({ groupId: id });

  // Delete all related tasks
  await GroupTask.deleteMany({ groupId: id });

  // Delete the group
  await group.deleteOne();

  res.status(200).json({
    success: true,
    message: "Group and all related data deleted successfully",
  });
});

// ===============================
// STUDENT MANAGEMENT
// ===============================

// Add student to group by email
export const addStudent = catchAsyncError(async (req, res, next) => {
  const { email, groupId } = req.body;

  // Check if group exists
  const group = await Group.findById(groupId);
  if (!group) {
    return next(new ErrorHandler("Group not found", 404));
  }

  // Check if current user is admin of the group
  const member = group.members.find(
    (m) => m.userId.toString() === req.user._id.toString()
  );
  if (!member || member.role !== "admin") {
    return next(new ErrorHandler("Only group admins can add students", 403));
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("No user found with this email", 404));
  }

  // Check if student already exists in this group
  const existingStudent = await Student.findOne({ userId: user._id, groupId });
  if (existingStudent) {
    return next(new ErrorHandler("Student already exists in this group", 400));
  }

  // Add student to group
  const student = await Student.create({
    userId: user._id,
    email: user.email,
    name: user.name,
    groupId,
    role: "member",
  });

  // Also add to group members array
  group.members.push({
    userId: user._id,
    role: "member",
  });
  await group.save();

  res.status(201).json({
    success: true,
    message: `${user.name} added to group successfully`,
    student,
  });
});

// Get all students in a group
export const getStudentsByGroup = catchAsyncError(async (req, res, next) => {
  const { groupId } = req.params;

  // Get group to access all members (including admin)
  const group = await Group.findById(groupId).populate(
    "members.userId",
    "name email"
  );

  if (!group) {
    return next(new ErrorHandler("Group not found", 404));
  }

  // Get students from Student collection
  const students = await Student.find({ groupId })
    .populate("userId", "name email")
    .sort({ addedAt: -1 });

  // Create a map of existing students by userId for quick lookup
  const studentMap = new Map(students.map((s) => [s.userId._id.toString(), s]));

  // Add any group members (especially admins) who don't have Student documents
  const allMembers = [];

  for (const member of group.members) {
    const userIdStr = member.userId._id.toString();

    if (studentMap.has(userIdStr)) {
      // Student document exists, use it
      allMembers.push(studentMap.get(userIdStr));
    } else {
      // No Student document (likely admin), create a virtual student object
      allMembers.push({
        _id: member.userId._id,
        userId: member.userId._id,
        email: member.userId.email,
        name: member.userId.name,
        groupId: groupId,
        role: member.role,
        availability: 100,
        currentTasks: await GroupTask.countDocuments({
          groupId: groupId,
          "assignedTo.userId": member.userId._id,
          status: { $ne: "Done" },
        }),
        addedAt: member.joinedAt,
      });
    }
  }

  console.log(
    `👥 Found ${allMembers.length} total members (including admins) for group ${groupId}:`
  );
  allMembers.forEach((s, i) => {
    console.log(
      `  ${i + 1}. ${s.name} (${s.email}) [${s.role || "member"}] - ${
        s.currentTasks
      } tasks`
    );
  });

  res.status(200).json({
    success: true,
    students: allMembers,
  });
});

// Remove student from group
export const removeStudent = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const student = await Student.findById(id);

  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }

  // Check if user is admin
  const group = await Group.findById(student.groupId);
  const member = group.members.find(
    (m) => m.userId.toString() === req.user._id.toString()
  );
  if (!member || member.role !== "admin") {
    return next(new ErrorHandler("Only group admins can remove students", 403));
  }

  // Remove from group members array
  group.members = group.members.filter(
    (m) => m.userId.toString() !== student.userId.toString()
  );
  await group.save();

  // Delete student
  await student.deleteOne();

  res.status(200).json({
    success: true,
    message: "Student removed successfully",
  });
});

// Leave group (member removes themselves)
export const leaveGroup = catchAsyncError(async (req, res, next) => {
  const { groupId } = req.params;

  // Find the student record for current user in this group
  const student = await Student.findOne({
    groupId: groupId,
    userId: req.user._id,
  });

  if (!student) {
    return next(new ErrorHandler("You are not a member of this group", 404));
  }

  // Check if user is admin
  const group = await Group.findById(groupId);
  const member = group.members.find(
    (m) => m.userId.toString() === req.user._id.toString()
  );

  if (member && member.role === "admin") {
    return next(
      new ErrorHandler(
        "Admins cannot leave their own group. Please delete the group or transfer admin rights first.",
        403
      )
    );
  }

  // Remove from group members array
  group.members = group.members.filter(
    (m) => m.userId.toString() !== req.user._id.toString()
  );
  await group.save();

  // Delete student record
  await student.deleteOne();

  res.status(200).json({
    success: true,
    message: "You have left the group successfully",
  });
});

// ===============================
// TASK MANAGEMENT WITH AI
// ===============================

// 🤖 Get AI task suggestions
export const getAITaskSuggestions = catchAsyncError(async (req, res, next) => {
  const { input } = req.body;

  if (!input || input.length < 3) {
    return next(
      new ErrorHandler(
        "Input too short. Please provide at least 3 characters.",
        400
      )
    );
  }

  const suggestions = await getTaskSuggestions(input);

  res.status(200).json({
    success: true,
    suggestions,
  });
});

// 📝 Create task with AI time prediction and smart assignment
export const createTask = catchAsyncError(async (req, res, next) => {
  const { title, description, groupId, assignedTo, priority, dueDate, tags } =
    req.body;

  // Get all students in the group
  const students = await Student.find({ groupId }).populate(
    "userId",
    "name email"
  );

  if (students.length === 0) {
    return next(
      new ErrorHandler(
        "No students found in this group. Please add students first.",
        400
      )
    );
  }

  // 🤖 AI: Predict task completion time
  const estimatedTime = await predictTaskTime(title, description);

  // 🤖 AI: Recommend best student if not manually assigned
  let finalAssignee = assignedTo;
  if (!assignedTo || !assignedTo.name) {
    const recommendedStudent = await recommendEmployee(description, students);
    finalAssignee = {
      name: recommendedStudent.name,
      userId: recommendedStudent.userId,
      email: recommendedStudent.email,
    };
  }

  // Create task
  const task = await GroupTask.create({
    title,
    description,
    groupId,
    assignedTo: finalAssignee,
    priority: priority || "Medium",
    estimatedTime,
    dueDate,
    tags,
    createdBy: req.user._id,
  });

  // Update student's current task count
  await Student.findOneAndUpdate(
    { userId: finalAssignee.userId },
    { $inc: { currentTasks: 1 } }
  );

  res.status(201).json({
    success: true,
    message: "Task created successfully",
    task,
    estimatedTime,
    assignedTo: finalAssignee,
  });
});

// Get all tasks for a group
export const getTasksByGroup = catchAsyncError(async (req, res, next) => {
  const { groupId } = req.params;

  const tasks = await GroupTask.find({ groupId }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    tasks,
  });
});

// Update task status
export const updateTaskStatus = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { status, assignedTo } = req.body;

  const task = await GroupTask.findById(id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  // If reassigning, update student counts
  if (assignedTo && assignedTo.userId !== task.assignedTo.userId) {
    // Decrease old assignee count
    await Student.findOneAndUpdate(
      { userId: task.assignedTo.userId },
      { $inc: { currentTasks: -1 } }
    );

    // Increase new assignee count
    await Student.findOneAndUpdate(
      { userId: assignedTo.userId },
      { $inc: { currentTasks: 1 } }
    );

    task.assignedTo = assignedTo;
  }

  if (status) {
    // If task is marked as Done, decrease assignee's task count
    if (status === "Done" && task.status !== "Done") {
      await Student.findOneAndUpdate(
        { userId: task.assignedTo.userId },
        { $inc: { currentTasks: -1 } }
      );
    }

    task.status = status;
  }

  await task.save();

  res.status(200).json({
    success: true,
    message: "Task updated successfully",
    task,
  });
});

// Delete task
export const deleteTask = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const task = await GroupTask.findById(id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  // Decrease student's task count
  await Student.findOneAndUpdate(
    { userId: task.assignedTo.userId },
    { $inc: { currentTasks: -1 } }
  );

  await task.deleteOne();

  res.status(200).json({
    success: true,
    message: "Task deleted successfully",
  });
});

// Get tasks assigned to a specific student
export const getTasksByStudent = catchAsyncError(async (req, res, next) => {
  const { userId } = req.params;

  const tasks = await GroupTask.find({ "assignedTo.userId": userId });

  res.status(200).json({
    success: true,
    tasks,
  });
});

// Get tasks assigned to the logged-in user (MY TASKS)
export const getMyTasks = catchAsyncError(async (req, res, next) => {
  const tasks = await GroupTask.find({ "assignedTo.userId": req.user._id })
    .populate("groupId", "groupName")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    tasks,
  });
});

// ===============================
// GROUP CALENDAR EVENTS
// ===============================

// Create group calendar event
export const createGroupCalendarEvent = catchAsyncError(
  async (req, res, next) => {
    const {
      title,
      description,
      startTime,
      endTime,
      isAllDay,
      priority,
      status,
      groupId,
      assignedTo,
      location,
      estimatedTime,
    } = req.body;

    // Validation
    if (!title || !startTime || !endTime) {
      return next(
        new ErrorHandler("Title, start time, and end time are required", 400)
      );
    }

    if (!groupId) {
      return next(new ErrorHandler("Group ID is required", 400));
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

    // Create new task with calendar fields
    const task = await GroupTask.create({
      title,
      description: description || "",
      startTime: start,
      endTime: end,
      isAllDay: Boolean(isAllDay),
      location: location || "",
      priority: priority || "Medium",
      status: status || "Open",
      estimatedTime: estimatedTime || "",
      groupId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
    });

    // Update student's task count if assigned
    if (assignedTo && assignedTo.userId) {
      await Student.findOneAndUpdate(
        { userId: assignedTo.userId, groupId },
        { $inc: { currentTasks: 1 } }
      );
    }

    res.status(201).json({
      success: true,
      message: "Group calendar event created successfully",
      event: task,
    });
  }
);

// Get all calendar events for a group
export const getGroupCalendarEvents = catchAsyncError(
  async (req, res, next) => {
    const { groupId } = req.params;

    const events = await GroupTask.find({ groupId }).sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      events,
    });
  }
);

// Get my calendar events across all groups
export const getMyGroupCalendarEvents = catchAsyncError(
  async (req, res, next) => {
    const events = await GroupTask.find({ "assignedTo.userId": req.user._id })
      .populate("groupId", "groupName")
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      events,
    });
  }
);

// Update group calendar event
export const updateGroupCalendarEvent = catchAsyncError(
  async (req, res, next) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    console.log("📥 Received update request for task:", id);
    console.log("📦 Update data:", JSON.stringify(updateData, null, 2));

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdBy;
    delete updateData.createdAt;
    delete updateData.taskId;

    const task = await GroupTask.findById(id);

    console.log("📋 Current task status:", task?.status);
    console.log("🔄 New status:", updateData.status);

    if (!task) {
      return next(new ErrorHandler("Event not found", 404));
    }

    // Validate date logic if dates are being updated
    if (updateData.startTime || updateData.endTime) {
      const startTime = updateData.startTime
        ? new Date(updateData.startTime)
        : task.startTime;
      const endTime = updateData.endTime
        ? new Date(updateData.endTime)
        : task.endTime;

      if (isNaN(startTime.getTime())) {
        return next(new ErrorHandler("Invalid start time format", 400));
      }
      if (isNaN(endTime.getTime())) {
        return next(new ErrorHandler("Invalid end time format", 400));
      }

      if (endTime <= startTime) {
        return next(new ErrorHandler("End time must be after start time", 400));
      }
    }

    // Handle reassignment
    if (updateData.assignedTo) {
      const oldAssignee = task.assignedTo;
      const newAssignee = updateData.assignedTo;

      // If reassigning to a different person
      if (oldAssignee?.userId?.toString() !== newAssignee?.userId?.toString()) {
        // Decrease old assignee count
        if (oldAssignee && oldAssignee.userId) {
          await Student.findOneAndUpdate(
            { userId: oldAssignee.userId, groupId: task.groupId },
            { $inc: { currentTasks: -1 } }
          );
        }

        // Increase new assignee count
        if (newAssignee && newAssignee.userId) {
          await Student.findOneAndUpdate(
            { userId: newAssignee.userId, groupId: task.groupId },
            { $inc: { currentTasks: 1 } }
          );
        }
      }
    }

    // Handle status change to Done (only if task was NOT already Done)
    if (updateData.status === "Done" && task.status !== "Done") {
      if (task.assignedTo && task.assignedTo.userId) {
        await Student.findOneAndUpdate(
          { userId: task.assignedTo.userId, groupId: task.groupId },
          { $inc: { currentTasks: -1 } }
        );
      }
    }

    // Handle status change from Done to something else (add the task back)
    if (
      task.status === "Done" &&
      updateData.status &&
      updateData.status !== "Done"
    ) {
      if (task.assignedTo && task.assignedTo.userId) {
        await Student.findOneAndUpdate(
          { userId: task.assignedTo.userId, groupId: task.groupId },
          { $inc: { currentTasks: 1 } }
        );
      }
    }

    // Update task
    Object.keys(updateData).forEach((key) => {
      task[key] = updateData[key];
    });

    task.updatedAt = new Date();
    await task.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event: task,
    });
  }
);

// Delete group calendar event
export const deleteGroupCalendarEvent = catchAsyncError(
  async (req, res, next) => {
    const { id } = req.params;

    const task = await GroupTask.findById(id);

    if (!task) {
      return next(new ErrorHandler("Event not found", 404));
    }

    // Decrease student's task count if assigned
    if (task.assignedTo && task.assignedTo.userId) {
      await Student.findOneAndUpdate(
        { userId: task.assignedTo.userId, groupId: task.groupId },
        { $inc: { currentTasks: -1 } }
      );
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
      deletedEvent: {
        id: task._id,
        title: task.title,
        startTime: task.startTime,
      },
    });
  }
);

// Fix task counts (recalculate currentTasks for all students based on actual tasks)
export const fixTaskCounts = catchAsyncError(async (req, res, next) => {
  try {
    const allStudents = await Student.find({});
    let fixed = 0;

    for (const student of allStudents) {
      // Count actual tasks assigned to this student that are NOT done
      const actualTaskCount = await GroupTask.countDocuments({
        "assignedTo.userId": student.userId,
        groupId: student.groupId,
        status: { $ne: "Done" },
      });

      // Update if different
      if (student.currentTasks !== actualTaskCount) {
        student.currentTasks = actualTaskCount;
        await student.save();
        fixed++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Fixed task counts for ${fixed} students`,
      totalStudents: allStudents.length,
      fixed,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});
