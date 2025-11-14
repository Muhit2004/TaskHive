import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { CalendarEvent } from "../models/calendarModels.js";
import { GroupTask } from "../models/groupModels.js";
import ErrorHandler from "../middlewares/error.js";

// Get Dashboard Stats
export const getDashboardStats = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);

  // --- Fetch BOTH individual calendar events AND group tasks ---
  const individualEvents = await CalendarEvent.find({ userId }).lean();
  const groupTasks = await GroupTask.find({ "assignedTo.userId": userId })
    .populate("groupId", "groupName")
    .lean();

  // --- Calculate Quick Stats (matching IndividualCalendar logic) ---
  // Total tasks = both individual events + group tasks
  const totalTasks = individualEvents.length + groupTasks.length;

  // Scheduled events (not completed/cancelled/postponed)
  const scheduledCount = individualEvents.filter(
    (e) => e.status === "scheduled"
  ).length;

  // Completed events
  const completedCount = individualEvents.filter(
    (e) => e.status === "completed"
  ).length;

  // Cancelled events
  const cancelledCount = individualEvents.filter(
    (e) => e.status === "cancelled"
  ).length;

  // Postponed events
  const postponedCount = individualEvents.filter(
    (e) => e.status === "postponed"
  ).length;

  // Tasks due today = events that END today AND not completed
  const tasksDueToday =
    individualEvents.filter((e) => {
      const endDate = new Date(e.endTime);
      return (
        endDate >= today &&
        endDate < tomorrow &&
        e.status !== "completed" &&
        e.status !== "cancelled"
      );
    }).length +
    groupTasks.filter((t) => {
      const endDate = new Date(t.endTime);
      return endDate >= today && endDate < tomorrow && t.status !== "Done";
    }).length;

  // Completed this week (both individual + group)
  const completedThisWeek =
    individualEvents.filter((e) => {
      const endDate = new Date(e.endTime);
      return (
        endDate >= today && endDate <= endOfWeek && e.status === "completed"
      );
    }).length +
    groupTasks.filter((t) => {
      const endDate = new Date(t.endTime);
      return endDate >= today && endDate <= endOfWeek && t.status === "Done";
    }).length;

  // Pending group tasks (not Done)
  const groupTasksPending = groupTasks.filter(
    (t) => t.status !== "Done"
  ).length;

  // --- Prepare Data for Charts ---
  // --- Pie Chart: Pending vs Completed (individual events only to match analytics) ---
  const taskStatusData = [
    {
      name: "Pending",
      value: scheduledCount + postponedCount,
      color: "#FF7A00",
    },
    {
      name: "Completed",
      value: completedCount,
      color: "#05CD99",
    },
  ];

  // --- Bar Chart: Priority Distribution ---
  // Individual events use: low, medium, high, urgent
  // Group tasks use: Low, Medium, High, Critical
  const taskPriorityData = [
    {
      name: "Low",
      value:
        individualEvents.filter((e) => e.priority === "low").length +
        groupTasks.filter((t) => t.priority === "Low").length,
      color: "#05CD99",
    },
    {
      name: "Medium",
      value:
        individualEvents.filter((e) => e.priority === "medium").length +
        groupTasks.filter((t) => t.priority === "Medium").length,
      color: "#00B2FF",
    },
    {
      name: "High",
      value:
        individualEvents.filter((e) => e.priority === "high").length +
        groupTasks.filter((t) => t.priority === "High").length,
      color: "#FF7A00",
    },
    {
      name: "Critical",
      value:
        individualEvents.filter((e) => e.priority === "urgent").length +
        groupTasks.filter((t) => t.priority === "Critical").length,
      color: "#E53E3E",
    },
  ];

  // --- Prepare Agenda (Today's Events) ---
  const individualAgenda = individualEvents
    .filter((e) => {
      const startDate = new Date(e.startTime);
      return startDate >= today && startDate < tomorrow;
    })
    .map((e) => ({
      id: e._id,
      type: e.isAllDay ? "task" : "event",
      title: e.subject,
      time: new Date(e.startTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      group: "Personal",
    }));

  const groupAgenda = groupTasks
    .filter((t) => {
      const startDate = new Date(t.startTime);
      return startDate >= today && startDate < tomorrow;
    })
    .map((t) => ({
      id: t._id,
      type: t.isAllDay ? "task" : "event",
      title: t.title,
      time: new Date(t.startTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      group: t.groupId?.groupName || "Group",
    }));

  const agenda = [...individualAgenda, ...groupAgenda]
    .sort((a, b) => {
      const timeA = a.time.split(":").map(Number);
      const timeB = b.time.split(":").map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    })
    .slice(0, 5);

  // --- Prepare Upcoming (This Week, Not Done) ---
  const individualUpcoming = individualEvents
    .filter((e) => {
      const endDate = new Date(e.endTime);
      return (
        endDate > tomorrow && endDate <= endOfWeek && e.status !== "completed"
      );
    })
    .map((e) => ({
      id: e._id,
      title: e.subject,
      dueDate: new Date(e.endTime),
    }));

  const groupUpcoming = groupTasks
    .filter((t) => {
      const endDate = new Date(t.endTime);
      return endDate > tomorrow && endDate <= endOfWeek && t.status !== "Done";
    })
    .map((t) => ({
      id: t._id,
      title: t.title,
      dueDate: new Date(t.endTime),
    }));

  const upcoming = [...individualUpcoming, ...groupUpcoming]
    .sort((a, b) => a.dueDate - b.dueDate)
    .slice(0, 5);

  res.status(200).json({
    success: true,
    stats: {
      totalTasks,
      scheduledCount,
      completedCount,
      tasksDueToday,
      completedThisWeek,
      groupTasksPending,
    },
    taskStatusData,
    taskPriorityData,
    agenda,
    upcoming,
  });
});
