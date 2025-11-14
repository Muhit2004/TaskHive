import React, { useState, useContext, useEffect, useRef } from "react";
import {
  MdSmartToy,
  MdSend,
  MdPerson,
  MdAdd,
  MdClose,
  MdRefresh,
} from "react-icons/md";
import axios from "axios";
import { toast } from "react-toastify";
import "../../styles/group/GroupAI.css";
import { Context } from "../../../main";

const API_BASE_URL = "http://localhost:4000/api/v1/group";

const GroupAIAssistant = () => {
  const { isAuthenticated, user } = useContext(Context);

  // Local state for groups and students
  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [events, setEvents] = useState([]);

  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Hi! I'm your AI assistant. Tell me about your schedule and I'll help distribute tasks among your team members.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [aiExplanation, setAiExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [memberData, setMemberData] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState({});

  const chatEndRef = useRef(null);
  // selectedGroup is already the group ID, not an index
  const currentGroupId = selectedGroup;

  // Helper function to get task count for a member from events
  const getTaskCountForMember = (memberEmail) => {
    return events.filter((e) => e.assignedTo?.email === memberEmail).length;
  };

  // Load chat messages from localStorage on mount and when group changes
  useEffect(() => {
    if (selectedGroup && user) {
      const storageKey = `ai_chat_${user._id}_${selectedGroup}`;
      const savedChats = localStorage.getItem(storageKey);
      if (savedChats) {
        try {
          setChatMessages(JSON.parse(savedChats));
        } catch (error) {
          console.error("Error loading chat history:", error);
        }
      } else {
        // Reset to default welcome message for new group
        setChatMessages([
          {
            role: "assistant",
            content:
              "👋 Hi! I'm your AI assistant. Tell me about your schedule and I'll help distribute tasks among your team members.",
            timestamp: new Date().toISOString(),
          },
        ]);
      }

      // Load generated tasks from localStorage
      const tasksStorageKey = `ai_tasks_${user._id}_${selectedGroup}`;
      const savedTasks = localStorage.getItem(tasksStorageKey);
      if (savedTasks) {
        try {
          const parsedTasks = JSON.parse(savedTasks);
          setGeneratedTasks(parsedTasks.tasks || []);
          setAiExplanation(parsedTasks.explanation || "");
          setSelectedAssignees(parsedTasks.selectedAssignees || {});
          console.log(
            "📋 Loaded generated tasks from localStorage:",
            parsedTasks.tasks?.length
          );
        } catch (error) {
          console.error("Error loading generated tasks:", error);
        }
      } else {
        // Reset tasks for new group
        setGeneratedTasks([]);
        setAiExplanation("");
        setSelectedAssignees({});
      }
    }
  }, [selectedGroup, user]);

  // Save chat messages to localStorage whenever they change
  useEffect(() => {
    if (selectedGroup && user && chatMessages.length > 0) {
      const storageKey = `ai_chat_${user._id}_${selectedGroup}`;
      localStorage.setItem(storageKey, JSON.stringify(chatMessages));
    }
  }, [chatMessages, selectedGroup, user]);

  // Save generated tasks to localStorage whenever they change
  useEffect(() => {
    if (selectedGroup && user) {
      const tasksStorageKey = `ai_tasks_${user._id}_${selectedGroup}`;
      const tasksData = {
        tasks: generatedTasks,
        explanation: aiExplanation,
        selectedAssignees: selectedAssignees,
      };
      localStorage.setItem(tasksStorageKey, JSON.stringify(tasksData));
      console.log(
        "💾 Saved generated tasks to localStorage:",
        generatedTasks.length
      );
    }
  }, [generatedTasks, aiExplanation, selectedAssignees, selectedGroup, user]);

  // Fetch user's groups
  useEffect(() => {
    if (isAuthenticated) {
      fetchMyGroups();
    }
  }, [isAuthenticated]);

  // Fetch calendar events to calculate accurate task counts
  const fetchEvents = React.useCallback(async () => {
    if (!selectedGroup) return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}/calendar/group/${selectedGroup}`,
        { withCredentials: true }
      );
      setEvents(res.data.events || []);
      console.log("📅 Fetched calendar events:", res.data.events?.length);
    } catch (error) {
      console.error("❌ Error fetching events:", error);
    }
  }, [selectedGroup]);

  // Fetch students with accurate task counts when group is selected
  const fetchStudentsWithTaskCounts = React.useCallback(async () => {
    if (!selectedGroup) return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}/student/group/${selectedGroup}`,
        { withCredentials: true }
      );
      const studentsData = res.data.students || [];
      setMemberData(studentsData);
      console.log("👥 Fetched students:", studentsData);
    } catch (error) {
      console.error("❌ Error fetching students:", error);
      toast.error("Failed to load team members");
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedGroup) {
      fetchStudentsWithTaskCounts();
      fetchEvents();
    }
  }, [selectedGroup, fetchStudentsWithTaskCounts, fetchEvents]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const fetchMyGroups = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/group/my-groups`, {
        withCredentials: true,
      });
      setMyGroups(res.data.groups);
      // Auto-select first group
      if (res.data.groups.length > 0) {
        setSelectedGroup(res.data.groups[0]._id);
      }
    } catch (error) {
      console.error("❌ Error fetching groups:", error);
      toast.error("Failed to load groups");
    }
  };

  // Handle sending message to AI
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentGroupId) {
      toast.error("Please enter a message");
      return;
    }

    const userMessage = {
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/ai/chat`,
        {
          groupId: currentGroupId,
          message: inputMessage,
        },
        { withCredentials: true }
      );

      const { explanation, tasks, memberData: members } = response.data;

      // Add AI response to chat
      const aiMessage = {
        role: "assistant",
        content: explanation,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, aiMessage]);

      // Set generated tasks and AI explanation
      setGeneratedTasks(tasks || []);
      setAiExplanation(explanation);

      // Initialize selected assignees with suggested ones
      const initialAssignees = {};
      tasks.forEach((task, idx) => {
        initialAssignees[idx] = task.suggestedAssignee || members[0]?.email;
      });
      setSelectedAssignees(initialAssignees);

      // Refresh member data to get latest task counts from database
      await fetchStudentsWithTaskCounts();

      toast.success("AI generated tasks successfully!");
    } catch (error) {
      console.error("❌ Error chatting with AI:", error);

      // Get error message from backend
      const backendError =
        error.response?.data?.message ||
        "Failed to get AI response. Please try again.";

      // Show user-friendly error toast
      if (
        backendError.includes("high traffic") ||
        backendError.includes("overloaded")
      ) {
        toast.error("🔥 AI is busy right now. Try again in 10-20 seconds!", {
          autoClose: 5000,
        });
      } else if (backendError.includes("Rate limit")) {
        toast.error("⏰ Please wait 30 seconds before trying again", {
          autoClose: 5000,
        });
      } else {
        toast.error(backendError, { autoClose: 4000 });
      }

      // Add helpful error message to chat
      let chatErrorMessage = "Sorry, I encountered an error. ";

      if (
        backendError.includes("high traffic") ||
        backendError.includes("overloaded")
      ) {
        chatErrorMessage =
          "🔥 I'm experiencing high traffic right now. Please wait 10-20 seconds and try again. Tip: Try asking for fewer tasks (e.g., '3 tasks') or a simpler question.";
      } else if (backendError.includes("Rate limit")) {
        chatErrorMessage =
          "⏰ Rate limit reached. Please wait 30 seconds before sending another message.";
      } else {
        chatErrorMessage += "Please try again or rephrase your question.";
      }

      const errorMessage = {
        role: "assistant",
        content: chatErrorMessage,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle assigning task to member
  const handleAssignTask = async (taskIndex) => {
    const task = generatedTasks[taskIndex];
    const assigneeEmail = selectedAssignees[taskIndex];

    if (!assigneeEmail) {
      toast.error("Please select a team member");
      return;
    }

    const assignee = memberData.find((m) => m.email === assigneeEmail);
    if (!assignee) {
      toast.error("Invalid team member selected");
      return;
    }

    try {
      // Create calendar event
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (task.estimatedDays || 3));

      const eventData = {
        title: task.title,
        description: task.description || "",
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        isAllDay: false,
        location: "",
        priority: task.priority || "Medium",
        status: "Open",
        groupId: currentGroupId,
        assignedTo: {
          name: assignee.name,
          userId: assignee.userId,
          email: assignee.email,
        },
      };

      await axios.post(`${API_BASE_URL}/calendar/create`, eventData, {
        withCredentials: true,
      });

      toast.success(`✅ Task assigned to ${assignee.name}!`);

      // Remove the task from generated tasks
      setGeneratedTasks((prev) => prev.filter((_, idx) => idx !== taskIndex));

      // Refresh both events and student data to get accurate task counts
      await fetchEvents();
      await fetchStudentsWithTaskCounts();
    } catch (error) {
      console.error("❌ Error assigning task:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to assign task. Please try again."
      );
    }
  };

  // Handle dismissing a task
  const handleDismissTask = (taskIndex) => {
    setGeneratedTasks((prev) => prev.filter((_, idx) => idx !== taskIndex));
    toast.info("Task dismissed");
  };

  // Handle key press in input
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle starting a new chat (clear history)
  const handleNewChat = () => {
    if (selectedGroup && user) {
      // Clear chat messages from localStorage
      const chatStorageKey = `ai_chat_${user._id}_${selectedGroup}`;
      localStorage.removeItem(chatStorageKey);

      // Clear generated tasks from localStorage
      const tasksStorageKey = `ai_tasks_${user._id}_${selectedGroup}`;
      localStorage.removeItem(tasksStorageKey);

      // Reset state to default
      setChatMessages([
        {
          role: "assistant",
          content:
            "👋 Hi! I'm your AI assistant. Tell me about your schedule and I'll help distribute tasks among your team members.",
          timestamp: new Date().toISOString(),
        },
      ]);
      setGeneratedTasks([]);
      setAiExplanation("");
      setSelectedAssignees({});
      setInputMessage("");

      toast.success("✨ Started a new chat!");
      console.log("🆕 Cleared chat and tasks from localStorage");
    }
  };

  return (
    <div className="group-ai-page">
      <div className="page-header">
        <div className="header-content">
          <MdSmartToy className="header-icon" />
          <div>
            <h1>AI Task Distribution</h1>
            <p>Chat with AI to analyze schedules and generate tasks</p>
          </div>
        </div>

        {/* Project/Group Selector */}
        {myGroups.length > 0 && (
          <div className="group-selector">
            <label>📁 Project:</label>
            <select
              value={selectedGroup || ""}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="group-dropdown">
              {myGroups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.groupName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="ai-chat-container">
        {/* LEFT PANEL: Chat Interface */}
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-header-left">
              <MdSmartToy />
              <span>AI Assistant</span>
            </div>
            <button
              className="new-chat-btn"
              onClick={handleNewChat}
              title="Start a new chat (clears history and tasks)">
              <MdRefresh /> New Chat
            </button>
          </div>

          <div className="chat-messages">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-message ${
                  msg.role === "user" ? "user-message" : "ai-message"
                }`}>
                <div className="message-icon">
                  {msg.role === "user" ? <MdPerson /> : <MdSmartToy />}
                </div>
                <div className="message-content">
                  <p>{msg.content}</p>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message ai-message">
                <div className="message-icon">
                  <MdSmartToy />
                </div>
                <div className="message-content">
                  <p className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </p>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-container">
            <textarea
              className="chat-input"
              placeholder="Describe your schedule or ask for help distributing tasks..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={3}
              disabled={isLoading}
            />
            <button
              className="send-button"
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}>
              <MdSend />
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Generated Tasks */}
        <div className="tasks-panel">
          <div className="tasks-header">
            <h3>Generated Tasks ({generatedTasks.length})</h3>
            {aiExplanation && <p className="ai-explanation">{aiExplanation}</p>}
          </div>

          <div className="tasks-list">
            {generatedTasks.length === 0 ? (
              <div className="empty-tasks">
                <MdSmartToy className="empty-icon" />
                <p>No tasks generated yet</p>
                <span>
                  Chat with AI to generate tasks based on your schedule
                </span>
              </div>
            ) : (
              generatedTasks.map((task, idx) => (
                <div key={idx} className="task-card">
                  <div className="task-header">
                    <h4>{task.title}</h4>
                    <button
                      className="dismiss-btn"
                      onClick={() => handleDismissTask(idx)}
                      title="Dismiss task">
                      <MdClose />
                    </button>
                  </div>
                  {/* Show which project this task belongs to */}
                  <div className="task-project">
                    📁{" "}
                    {myGroups.find((g) => g._id === selectedGroup)?.groupName ||
                      "Project"}
                  </div>
                  <p className="task-description">{task.description}</p>{" "}
                  <div className="task-meta">
                    <span
                      className={`priority-badge priority-${task.priority?.toLowerCase()}`}>
                      {task.priority || "Medium"}
                    </span>
                    <span className="estimated-days">
                      ~{task.estimatedDays || 3} days
                    </span>
                  </div>
                  <div className="task-timing">
                    <span className="timing-label">📅 Start:</span>
                    <span className="timing-value">
                      {new Date().toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="timing-separator">→</span>
                    <span className="timing-label">End:</span>
                    <span className="timing-value">
                      {new Date(
                        new Date().getTime() +
                          (task.estimatedDays || 3) * 24 * 60 * 60 * 1000
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="task-actions">
                    <select
                      className="assignee-select"
                      value={selectedAssignees[idx] || ""}
                      onChange={(e) =>
                        setSelectedAssignees((prev) => ({
                          ...prev,
                          [idx]: e.target.value,
                        }))
                      }>
                      <option value="">Select Member</option>
                      {memberData.map((member) => (
                        <option key={member.email} value={member.email}>
                          {member.name} ({getTaskCountForMember(member.email)}{" "}
                          tasks)
                        </option>
                      ))}
                    </select>

                    <button
                      className="assign-btn"
                      onClick={() => handleAssignTask(idx)}
                      disabled={!selectedAssignees[idx]}>
                      <MdAdd /> Assign Task
                    </button>
                  </div>
                  {task.suggestedAssignee && (
                    <div className="ai-suggestion">
                      💡 AI suggests:{" "}
                      {
                        memberData.find(
                          (m) => m.email === task.suggestedAssignee
                        )?.name
                      }
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Team Overview - Compact Version */}
          {memberData.length > 0 && generatedTasks.length === 0 && (
            <div className="team-overview-compact">
              <h4>👥 Team Overview</h4>
              <div className="members-compact-list">
                {memberData.map((member) => {
                  const taskCount = getTaskCountForMember(member.email);
                  return (
                    <div key={member.email} className="member-compact-item">
                      <div className="member-compact-info">
                        <span className="member-name">{member.name}</span>
                        <span className="task-count-badge">
                          {taskCount} tasks
                        </span>
                      </div>
                      <div className="workload-bar-small">
                        <div
                          className="workload-fill"
                          style={{
                            width: `${Math.min(taskCount * 10, 100)}%`,
                            backgroundColor:
                              taskCount > 8
                                ? "#ef4444"
                                : taskCount > 5
                                ? "#f59e0b"
                                : "#10b981",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupAIAssistant;
