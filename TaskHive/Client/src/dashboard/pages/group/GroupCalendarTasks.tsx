import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import {
  ScheduleComponent,
  Day,
  Week,
  WorkWeek,
  Month,
  Agenda,
  DragAndDrop,
  Resize,
  Inject,
  ViewsDirective,
  ViewDirective,
  EventSettingsModel,
  ActionEventArgs,
  CellClickEventArgs,
  PopupOpenEventArgs,
  EventRenderedArgs,
} from "@syncfusion/ej2-react-schedule";
import axios from "axios";
import { toast } from "react-toastify";
import { MdGroup, MdAddTask, MdAutoAwesome, MdFilterList, MdPerson, MdBarChart } from "react-icons/md";
import { Context } from "../../../main";
import "../../styles/group/GroupCalendar.css";
import { registerLicense } from "@syncfusion/ej2-base";

registerLicense(
  "Ngo9BigBOggjGyl/Vkd+XU9FcVRDX3xIfEx0RWFcb1d6dlJMY19BNQtUQF1hTH9Sd0djUHxbdXRdRGZdWkd3"
);

const API_BASE_URL = "http://localhost:4000/api/v1/group";

// Define TypeScript interfaces
interface CalendarEvent {
  Id: string;
  Subject: string;
  StartTime: Date;
  EndTime: Date;
  IsAllDay?: boolean;
  Description?: string;
  Location?: string;
  CategoryColor?: string;
  Priority?: string;
  Status?: string;
  AssignedTo?: any;
  AssigneeName?: string;
  AssigneeEmail?: string;
  EstimatedTime?: string;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  userId: string;
  currentTasks: number;
  availability: number;
}

const GroupCalendarTasks = () => {
  const { isAuthenticated, user } = useContext(Context) as any;

  // State Management
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("all"); // "all" or "my"
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter States
  const [filterMember, setFilterMember] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Task Form States
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskStartTime, setTaskStartTime] = useState("");
  const [taskEndTime, setTaskEndTime] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [predictedTime, setPredictedTime] = useState<string | null>(null);

  // Color mapping for assignees
  const [assigneeColors, setAssigneeColors] = useState<Map<string, string>>(new Map());
  
  // Role-based permissions
  const [userRole, setUserRole] = useState<'admin' | 'member' | null>(null);

  // ===============================
  // PERMISSION HELPERS
  // ===============================
  
  // Get current user's role in selected group
  const getCurrentUserRole = useCallback(() => {
    if (!selectedGroup || !user) return null;
    
    const currentGroup = myGroups.find(g => g._id === selectedGroup);
    if (!currentGroup) return null;
    
    const member = currentGroup.members?.find((m: any) => m.userId._id === user._id || m.userId === user._id);
    return member?.role || null;
  }, [selectedGroup, user, myGroups]);
  
  // Check if user is admin
  const isAdmin = useCallback(() => {
    return userRole === 'admin';
  }, [userRole]);
  
  // Check if user can edit/delete a specific event
  const canEditEvent = useCallback((event: CalendarEvent) => {
    if (userRole === 'admin') return true; // Admin can edit anything
    if (userRole === 'member') {
      // Members can only edit their own tasks
      return event.AssigneeEmail === user?.email;
    }
    return false;
  }, [userRole, user]);
  
  // Check if user can delete a specific event
  const canDeleteEvent = useCallback((event: CalendarEvent) => {
    return userRole === 'admin'; // Only admin can delete
  }, [userRole]);

  // ===============================
  // FETCH DATA
  // ===============================

  // Fetch user's groups
  useEffect(() => {
    if (isAuthenticated) {
      fetchMyGroups();
    }
  }, [isAuthenticated]);

  // Fetch tasks and students when group is selected or view mode changes
  useEffect(() => {
    if (viewMode === "my" || selectedGroup) {
      fetchTasks();
    }
    if (selectedGroup) {
      fetchStudents();
      // Update user role when group changes
      const role = getCurrentUserRole();
      setUserRole(role);
      console.log('👤 Current user role:', role);
    }
  }, [selectedGroup, viewMode, getCurrentUserRole]);

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
      console.error("Error fetching groups:", error);
      toast.error("Failed to load groups");
    }
  };

  const fetchTasks = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      let res;

      if (viewMode === "my") {
        // Fetch only my tasks
        res = await axios.get(`${API_BASE_URL}/calendar/my-events`, {
          withCredentials: true,
        });
      } else {
        // Fetch all group calendar events
        if (!selectedGroup) return;
        res = await axios.get(`${API_BASE_URL}/calendar/group/${selectedGroup}`, {
          withCredentials: true,
        });
      }

      // Convert to Syncfusion Calendar format
      const calendarEvents: CalendarEvent[] = res.data.events.map((task: any) => {
        const assigneeName = task.assignedTo?.name || "Unassigned";
        
        // Generate consistent color for this assignee
        if (!assigneeColors.has(assigneeName)) {
          const newColor = generateColorForUser(assigneeName);
          setAssigneeColors(prev => new Map(prev).set(assigneeName, newColor));
        }

        return {
          Id: task._id,
          Subject: task.title,
          StartTime: new Date(task.startTime || task.dueDate || Date.now()),
          EndTime: new Date(task.endTime || task.dueDate || Date.now() + 3600000), // 1 hour default
          IsAllDay: task.isAllDay || false,
          Description: task.description,
          Location: task.location || "",
          CategoryColor: assigneeColors.get(assigneeName) || generateColorForUser(assigneeName),
          Priority: task.priority,
          Status: task.status,
          AssignedTo: task.assignedTo,
          AssigneeName: assigneeName,
          AssigneeEmail: task.assignedTo?.email || "",
          EstimatedTime: task.estimatedTime || "",
        };
      });

      setEvents(calendarEvents);
      console.log('📅 Group calendar events loaded:', calendarEvents.length);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      toast.error("Failed to load calendar events");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, viewMode, selectedGroup, assigneeColors]);

  const fetchStudents = async () => {
    if (!selectedGroup) return;

    try {
      const res = await axios.get(
        `${API_BASE_URL}/student/group/${selectedGroup}`,
        {
          withCredentials: true,
        }
      );

      console.log('👥 Fetched students:', res.data.students);
      console.log('📊 Number of students:', res.data.students?.length);
      setStudents(res.data.students);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  // ===============================
  // HELPER FUNCTIONS
  // ===============================

  // Generate consistent color for each user
  const generateColorForUser = (name: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Get filtered events based on current filters
  const getFilteredEvents = (): CalendarEvent[] => {
    return events.filter(event => {
      // Filter by member email
      if (filterMember !== "all") {
        if (filterMember === "Unassigned") {
          if (event.AssigneeEmail) return false; // Has assignee, so exclude
        } else {
          if (event.AssigneeEmail !== filterMember) return false; // Email doesn't match
        }
      }
      if (filterStatus !== "all" && event.Status !== filterStatus) return false;
      if (filterPriority !== "all" && event.Priority !== filterPriority) return false;
      return true;
    });
  };

  // ===============================
  // TASK OPERATIONS
  // ===============================

  // Debounce timer ref to prevent rapid API calls
  const suggestionTimerRef = useRef<any>(null);

  // Get AI task suggestions with debouncing
  const handleTitleChange = async (e: any) => {
    setTaskTitle(e.target.value);

    // Clear previous timer
    if (suggestionTimerRef.current) {
      clearTimeout(suggestionTimerRef.current);
    }

    if (e.target.value.length > 3) {
      // Wait 800ms after user stops typing before calling API
      suggestionTimerRef.current = setTimeout(async () => {
        try {
          const res = await axios.post(
            `${API_BASE_URL}/task/suggest`,
            { input: e.target.value },
            { withCredentials: true }
          );

          const suggestionList = res.data.suggestions
            .split("\n")
            .filter((s: string) => s.trim());
          setSuggestions(suggestionList);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setSuggestions([]); // Clear suggestions on error
        }
      }, 800); // 800ms debounce delay
    } else {
      setSuggestions([]);
    }
  };

  // Create new task with AI
  const handleCreateTask = async (e: any) => {
    e.preventDefault();

    if (!taskTitle.trim() || !taskDesc.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!selectedGroup) {
      toast.error("Please select a group first");
      return;
    }

    if (!taskDueDate) {
      toast.error("Please select a due date");
      return;
    }

    setLoading(true);

    try {
      // Parse the due date and create start/end times
      const dueDateTime = new Date(taskDueDate);
      const startTime = new Date(dueDateTime);
      startTime.setHours(9, 0, 0, 0); // Default 9 AM start
      const endTime = new Date(dueDateTime);
      endTime.setHours(17, 0, 0, 0); // Default 5 PM end

      const taskData: any = {
        title: taskTitle,
        description: taskDesc,
        groupId: selectedGroup,
        priority: taskPriority,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        isAllDay: false,
        location: '',
        status: 'Open',
      };

      // Add assignee if selected
      if (selectedStudent) {
        const student = students.find((s) => s._id === selectedStudent);
        if (student) {
          taskData.assignedTo = {
            name: student.name,
            userId: student.userId,
            email: student.email,
          };
        }
      }

      const res = await axios.post(`${API_BASE_URL}/calendar/create`, taskData, {
        withCredentials: true,
      });

      if (res.data.success) {
        const assignedName = res.data.event?.assignedTo?.name || 'Unassigned';
        toast.success(`✅ Task created! Assigned to: ${assignedName}`);
        if (res.data.event?.estimatedTime) {
          toast.info(`⏱️ Estimated time: ${res.data.event.estimatedTime}`);
        }

        // Reset form
        setTaskTitle("");
        setTaskDesc("");
        setSelectedStudent("");
        setTaskPriority("Medium");
        setTaskDueDate("");
        setSuggestions([]);
        setPredictedTime(null);
        setShowTaskForm(false);

        // Refresh tasks
        await fetchTasks();
        await fetchStudents();
      } else {
        toast.error(res.data.message || 'Failed to create task');
      }
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast.error(error.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // SYNCFUSION EVENT HANDLERS
  // ===============================

  // Create new calendar event
  const createCalendarEvent = async (eventData: any): Promise<boolean> => {
    try {
      // Prevent duplicate submissions while syncing
      if (isSyncing) {
        console.warn('⚠️ Already syncing, ignoring duplicate create request');
        return false;
      }

      setIsSyncing(true);
      toast.info('Creating event...', { autoClose: 1000 });

      const newEvent = {
        title: eventData.Subject || 'New Task',
        description: eventData.Description || '',
        startTime: new Date(eventData.StartTime),
        endTime: new Date(eventData.EndTime),
        isAllDay: eventData.IsAllDay || false,
        priority: eventData.Priority || 'Medium',
        status: eventData.Status || 'Open',
        groupId: selectedGroup,
        assignedTo: eventData.AssignedTo || null,
        location: eventData.Location || '',
        estimatedTime: eventData.EstimatedTime || '',
      };

      console.log('📤 Creating event with data:', newEvent);

      const res = await axios.post(`${API_BASE_URL}/calendar/create`, newEvent, {
        withCredentials: true,
      });

      if (res.data.success) {
        toast.success('Task created successfully! 🎉');
        await fetchTasks();
        await fetchStudents();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error creating event:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to create event');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Update existing calendar event
  const updateCalendarEvent = async (eventId: string, eventData: any): Promise<boolean> => {
    try {
      setIsSyncing(true);
      toast.info('Updating event...', { autoClose: 1000 });

      console.log('📝 RAW event data received:', JSON.stringify(eventData, null, 2));

      const updateData: any = {};
      
      // Map Syncfusion field names to backend field names
      if (eventData.Subject !== undefined) updateData.title = eventData.Subject;
      if (eventData.Description !== undefined) updateData.description = eventData.Description;
      if (eventData.StartTime !== undefined) updateData.startTime = new Date(eventData.StartTime);
      if (eventData.EndTime !== undefined) updateData.endTime = new Date(eventData.EndTime);
      if (eventData.IsAllDay !== undefined) updateData.isAllDay = eventData.IsAllDay;
      if (eventData.Location !== undefined) updateData.location = eventData.Location;
      
      // Handle custom fields (these come from the popup editor)
      if (eventData.Priority !== undefined) updateData.priority = eventData.Priority;
      if (eventData.Status !== undefined) updateData.status = eventData.Status;
      if (eventData.AssignedTo !== undefined) updateData.assignedTo = eventData.AssignedTo;

      console.log('📤 Mapped update data for backend:', JSON.stringify(updateData, null, 2));

      const res = await axios.put(`${API_BASE_URL}/calendar/${eventId}`, updateData, {
        withCredentials: true,
      });

      if (res.data.success) {
        toast.success('Task updated successfully! ✏️');
        await fetchTasks();
        await fetchStudents();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast.error(error.response?.data?.message || 'Failed to update event');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete calendar event
  const deleteCalendarEvent = async (eventId: string): Promise<boolean> => {
    try {
      setIsSyncing(true);
      toast.info('Deleting event...', { autoClose: 1000 });

      const res = await axios.delete(`${API_BASE_URL}/calendar/${eventId}`, {
        withCredentials: true,
      });

      if (res.data.success) {
        toast.success('Task deleted successfully! 🗑️');
        await fetchTasks();
        await fetchStudents();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast.error(error.response?.data?.message || 'Failed to delete event');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle all calendar actions
  const onActionBegin = async (args: any) => {
    console.log('🔄 Action begin:', args.requestType, args);
    console.log('📦 Event data BEFORE custom fields:', args.data);

    // PERMISSION CHECK: Validate user permissions before any action
    if (args.requestType === 'eventChange' && args.data) {
      const eventData = Array.isArray(args.data) ? args.data[0] : args.data;
      const originalEvent = events.find(e => e.Id === eventData.Id);
      
      if (originalEvent && !canEditEvent(originalEvent)) {
        args.cancel = true;
        toast.error('❌ Permission denied! Members can only edit their own tasks.');
        return;
      }
    }
    
    if (args.requestType === 'eventRemove' && args.data) {
      const eventData = Array.isArray(args.data) ? args.data[0] : args.data;
      const originalEvent = events.find(e => e.Id === eventData.Id);
      
      if (originalEvent && !canDeleteEvent(originalEvent)) {
        args.cancel = true;
        toast.error('❌ Permission denied! Only admins can delete events.');
        return;
      }
    }

    // CRITICAL: Capture custom fields from popup BEFORE processing the action
    if ((args.requestType === 'eventCreate' || args.requestType === 'eventChange') && args.data) {
      const assigneeSelect = document.getElementById('event-assignee') as HTMLSelectElement;
      const prioritySelect = document.getElementById('event-priority') as HTMLSelectElement;
      const statusSelect = document.getElementById('event-status') as HTMLSelectElement;
      
      if (assigneeSelect || prioritySelect || statusSelect) {
        const eventData = Array.isArray(args.data) ? args.data[0] : args.data;
        
        // Capture Assign To
        if (assigneeSelect) {
          const selectedStudentId = assigneeSelect.value;
          const selectedStudent = students.find(s => s._id === selectedStudentId);
          eventData.AssignedTo = selectedStudent ? {
            name: selectedStudent.name,
            userId: selectedStudent.userId,
            email: selectedStudent.email,
          } : null;
          console.log('👤 Captured AssignedTo:', eventData.AssignedTo);
        }
        
        // Capture Priority
        if (prioritySelect) {
          eventData.Priority = prioritySelect.value;
          console.log('⚡ Captured Priority:', eventData.Priority);
        }
        
        // Capture Status
        if (statusSelect) {
          eventData.Status = statusSelect.value;
          console.log('📊 Captured Status:', eventData.Status);
        }
        
        console.log('💾 Custom fields captured successfully:', {
          AssignedTo: eventData.AssignedTo,
          Priority: eventData.Priority,
          Status: eventData.Status
        });
      }
    }

    if (args.requestType === 'eventCreate' && args.data) {
      args.cancel = true;
      const eventData = Array.isArray(args.data) ? args.data[0] : args.data;
      await createCalendarEvent(eventData);
    }

    if (args.requestType === 'eventChange' && args.data) {
      args.cancel = true;
      const eventData = Array.isArray(args.data) ? args.data[0] : args.data;
      console.log('🔄 Updating event with captured fields:', eventData);
      await updateCalendarEvent(eventData.Id, eventData);
    }

    if (args.requestType === 'eventRemove' && args.data) {
      args.cancel = true;
      const eventData = Array.isArray(args.data) ? args.data[0] : args.data;
      await deleteCalendarEvent(eventData.Id);
    }
  };

  const onActionComplete = (args: any) => {
    console.log('✅ Action completed:', args.requestType);
  };

  const onCellDoubleClick = (args: any) => {
    console.log('📅 Cell double clicked:', args);
  };

  // Customize event appearance with assignee colors and badges
  const onEventRendered = (args: any) => {
    const eventData = args.data as CalendarEvent;
    
    if (args.element) {
      const assigneeName = eventData.AssigneeName || 'Unassigned';
      const assigneeColor = assigneeColors.get(assigneeName) || generateColorForUser(assigneeName);
      
      // Set background color based on assignee
      args.element.style.backgroundColor = assigneeColor;
      args.element.style.borderLeft = `5px solid ${assigneeColor}`;
      
      // Add priority border
      if (eventData.Priority === 'Critical' || eventData.Priority === 'High') {
        args.element.style.border = `3px solid #FF5722`;
        args.element.style.fontWeight = 'bold';
      }
      
      // Add status indicator
      if (eventData.Status === 'Done') {
        args.element.style.opacity = '0.7';
        args.element.style.textDecoration = 'line-through';
      }
      
      // Add permission indicator for members (show lock icon on others' tasks)
      if (userRole === 'member' && !canEditEvent(eventData)) {
        args.element.style.cursor = 'not-allowed';
        args.element.style.opacity = '0.85';
        args.element.style.border = '2px dashed #999';
      }
      
      // Add assignee badge to title
      const titleElement = args.element.querySelector('.e-subject');
      if (titleElement && !titleElement.textContent?.includes('👤')) {
        const lockIcon = (userRole === 'member' && !canEditEvent(eventData)) ? '🔒 ' : '';
        titleElement.textContent = `${lockIcon}👤 ${assigneeName}: ${titleElement.textContent}`;
      }
    }
  };

  // Customize the event editor popup
  const onPopupOpen = (args: any) => {
    console.log('📝 Popup opened:', args.type);
    
    // PERMISSION CHECK: Disable editing for members on others' tasks
    if (args.type === 'Editor' && args.data) {
      const eventData = args.data as CalendarEvent;
      
      if (eventData.Id) { // Existing event (not new)
        if (!canEditEvent(eventData)) {
          args.cancel = true;
          toast.error('❌ Permission denied! Members can only edit their own tasks.');
          return;
        }
      }
    }
    
    // PERMISSION CHECK: Hide delete button for members
    if (args.type === 'DeleteAlert' || args.type === 'QuickInfo') {
      const eventData = args.data as CalendarEvent;
      if (!canDeleteEvent(eventData)) {
        // Hide delete button in QuickInfo popup
        setTimeout(() => {
          const deleteBtn = args.element?.querySelector('.e-event-delete');
          if (deleteBtn) {
            (deleteBtn as HTMLElement).style.display = 'none';
          }
        }, 0);
      }
    }
    
    if (args.type === 'Editor') {
      setTimeout(() => {
        const dialogContent = args.element?.querySelector('.e-schedule-dialog .e-dlg-content');
        
        if (dialogContent && !dialogContent.querySelector('#custom-group-fields')) {
          const eventData = args.data as CalendarEvent;
          
          const customFieldsDiv = document.createElement('div');
          customFieldsDiv.id = 'custom-group-fields';
          customFieldsDiv.style.cssText = 'margin-top: 15px; padding: 15px; background: #f5f5f5; border-radius: 8px;';
          
          customFieldsDiv.innerHTML = `
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">
                👤 Assign To
              </label>
              <select id="event-assignee" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                <option value="">Unassigned</option>
                ${students.map(student => `
                  <option value="${student._id}" ${eventData?.AssignedTo?.userId === student.userId ? 'selected' : ''}>
                    ${student.name} (${student.email}) - ${student.currentTasks} tasks
                  </option>
                `).join('')}
              </select>
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">
                ⚡ Priority
              </label>
              <select id="event-priority" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                <option value="Low" ${eventData?.Priority === 'Low' ? 'selected' : ''}>🟢 Low</option>
                <option value="Medium" ${eventData?.Priority === 'Medium' ? 'selected' : ''}>🟡 Medium</option>
                <option value="High" ${eventData?.Priority === 'High' ? 'selected' : ''}>🔴 High</option>
                <option value="Critical" ${eventData?.Priority === 'Critical' ? 'selected' : ''}>🚨 Critical</option>
              </select>
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">
                📊 Status
              </label>
              <select id="event-status" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                <option value="Open" ${eventData?.Status === 'Open' ? 'selected' : ''}>📝 Open</option>
                <option value="In Progress" ${eventData?.Status === 'In Progress' ? 'selected' : ''}>🔄 In Progress</option>
                <option value="Review" ${eventData?.Status === 'Review' ? 'selected' : ''}>👀 Review</option>
                <option value="Done" ${eventData?.Status === 'Done' ? 'selected' : ''}>✅ Done</option>
              </select>
            </div>
          `;
          
          const formContent = dialogContent.querySelector('.e-schedule-form');
          if (formContent) {
            formContent.appendChild(customFieldsDiv);
            console.log('✅ Custom fields injected into editor');
          }
        }
      }, 100);
    }
  };

  // ===============================
  // RENDER
  // ===============================

  return (
    <div className="group-tasks-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <MdGroup className="header-icon" />
          <div>
            <h1>Team Task Board</h1>
            <p>Collaborate with AI-powered task management</p>
          </div>
        </div>

        <div className="header-right">
         

          {/* Group Selector - Only show in "All Tasks" mode */}
          {viewMode === "all" && myGroups.length > 0 && (
            <div className="group-selector">
              <label>Group:</label>
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

          <button
            className="btn-filter"
            onClick={() => setShowFilters(!showFilters)}>
            <MdFilterList />
            <span>Filters</span>
          </button>

          

          <button
            className="btn-analytics"
            onClick={() => setShowAnalytics(!showAnalytics)}>
            <MdBarChart />
            <span>Analytics</span>
          </button>

          <button
            className="btn-add-task"
            onClick={() => setShowTaskForm(!showTaskForm)}>
            <MdAddTask />
            <span>Create Task</span>
          </button>
          
          {/* Role Badge */}
          
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="modal-overlay" onClick={() => setShowTaskForm(false)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: '#1B2559' }}>
              <MdAutoAwesome /> Create AI-Powered Task
            </h2>

            <form onSubmit={handleCreateTask}>
              {/* Task Title */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1B2559' }}>Task Title</label>
                <input
                  type="text"
                  placeholder="Enter task title..."
                  value={taskTitle}
                  onChange={handleTitleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #E9EDF7',
                    borderRadius: '10px',
                    fontSize: '14px'
                  }}
                />
                {/* AI Suggestions */}
                {suggestions.length > 0 && (
                  <div style={{
                    marginTop: '10px',
                    padding: '12px',
                    background: '#F4F7FE',
                    borderRadius: '10px',
                    border: '2px solid #4318FF'
                  }}>
                    <p style={{ fontWeight: 600, color: '#4318FF', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MdAutoAwesome /> AI Suggestions:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {suggestions.map((s, i) => (
                        <li
                          key={i}
                          onClick={() => {
                            setTaskTitle(s.replace(/^\d+\.\s*/, ""));
                            setSuggestions([]);
                          }}
                          style={{
                            cursor: 'pointer',
                            padding: '6px 0',
                            color: '#68769F',
                            transition: 'color 0.3s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#4318FF'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#68769F'}
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1B2559' }}>Description</label>
                <textarea
                  placeholder="Enter task description..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={4}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #E9EDF7',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Assign To, Priority, Due Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1B2559' }}>Assign To</label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #E9EDF7',
                      borderRadius: '10px',
                      fontSize: '14px'
                    }}>
                    <option value="">Auto-assign with AI 🤖</option>
                    {students.map((student) => (
                      <option value={student._id} key={student._id}>
                        {student.name} ({student.email}) - {student.currentTasks || 0} tasks
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1B2559' }}>Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #E9EDF7',
                      borderRadius: '10px',
                      fontSize: '14px'
                    }}>
                    <option value="Low">🟢 Low</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="High">🔴 High</option>
                    <option value="Critical">🚨 Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1B2559' }}>Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #E9EDF7',
                    borderRadius: '10px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {predictedTime && (
                <div style={{
                  padding: '12px',
                  background: '#F4F7FE',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#4318FF',
                  fontWeight: 600
                }}>
                  <MdAutoAwesome /> Estimated Time: {predictedTime}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#F4F7FE',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 600,
                    color: '#A3AED0',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 600,
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: loading ? 0.7 : 1
                  }}>
                  {loading ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Stats */}
      <div className="team-stats">
        <div className="stat-card">
          <h3>Team Members</h3>
          <p className="stat-value">{students.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Tasks</h3>
          <p className="stat-value">{events.length}</p>
        </div>
        <div className="stat-card">
          <h3>In Progress</h3>
          <p className="stat-value">
            {events.filter((t) => t.Status === "In Progress").length}
          </p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p className="stat-value">
            {events.filter((t) => t.Status === "Done").length}
          </p>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <div className="analytics-dashboard">
          <h3>📊 Team Analytics & Workload</h3>
          
          <div className="analytics-grid">
            {/* Workload Distribution */}
            <div className="analytics-card">
              <h4>👥 Workload Distribution</h4>
              <div className="workload-bars">
                {students.map((student) => {
                  const studentTasks = events.filter(e => e.AssigneeEmail === student.email);
                  const percentage = students.length > 0 ? (studentTasks.length / Math.max(events.length, 1)) * 100 : 0;
                  
                  return (
                    <div key={student._id} className="workload-item">
                      <div className="workload-header">
                        <span className="student-name">{student.name}</span>
                        <span className="task-count-badge">{studentTasks.length} tasks</span>
                      </div>
                      <div className="workload-bar-container">
                        <div 
                          className="workload-bar" 
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: assigneeColors.get(student.name) || generateColorForUser(student.name)
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Priority Breakdown */}
            <div className="analytics-card">
              <h4>⚡ Priority Breakdown</h4>
              <div className="priority-stats">
                <div className="priority-item">
                  <span className="priority-label">🚨 Critical:</span>
                  <span className="priority-value">{events.filter(e => e.Priority === 'Critical').length}</span>
                </div>
                <div className="priority-item">
                  <span className="priority-label">🔴 High:</span>
                  <span className="priority-value">{events.filter(e => e.Priority === 'High').length}</span>
                </div>
                <div className="priority-item">
                  <span className="priority-label">🟡 Medium:</span>
                  <span className="priority-value">{events.filter(e => e.Priority === 'Medium').length}</span>
                </div>
                <div className="priority-item">
                  <span className="priority-label">🟢 Low:</span>
                  <span className="priority-value">{events.filter(e => e.Priority === 'Low').length}</span>
                </div>
              </div>
            </div>

            {/* Status Overview */}
            <div className="analytics-card">
              <h4>📊 Status Overview</h4>
              <div className="status-stats">
                <div className="status-item">
                  <span className="status-label">📝 Open:</span>
                  <span className="status-value">{events.filter(e => e.Status === 'Open').length}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">🔄 In Progress:</span>
                  <span className="status-value">{events.filter(e => e.Status === 'In Progress').length}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">👀 Review:</span>
                  <span className="status-value">{events.filter(e => e.Status === 'Review').length}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">✅ Done:</span>
                  <span className="status-value">{events.filter(e => e.Status === 'Done').length}</span>
                </div>
              </div>
            </div>

            {/* Team Performance */}
            <div className="analytics-card">
              <h4>🎯 Team Performance</h4>
              <div className="performance-stats">
                <div className="performance-metric">
                  <span className="metric-label">Total Tasks:</span>
                  <span className="metric-value">{events.length}</span>
                </div>
                <div className="performance-metric">
                  <span className="metric-label">Completion Rate:</span>
                  <span className="metric-value">
                    {events.length > 0 ? Math.round((events.filter(e => e.Status === 'Done').length / events.length) * 100) : 0}%
                  </span>
                </div>
                <div className="performance-metric">
                  <span className="metric-label">Average per Member:</span>
                  <span className="metric-value">
                    {students.length > 0 ? Math.round(events.length / students.length) : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      {showFilters && (
        <div className="filter-bar">
          <div className="filter-group">
            <label>👤 Team Member:</label>
            <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)}>
              <option value="all">All Members</option>
              {students.map((student) => (
                <option key={student._id} value={student.email}>
                  {student.name} ({student.email})
                </option>
              ))}
              <option value="Unassigned">Unassigned</option>
            </select>
          </div>

          <div className="filter-group">
            <label>📊 Status:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div className="filter-group">
            <label>⚡ Priority:</label>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="all">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <button className="btn-clear-filters" onClick={() => {
            setFilterMember("all");
            setFilterStatus("all");
            setFilterPriority("all");
          }}>
            Clear Filters
          </button>
        </div>
      )}

      {/* Calendar Component */}
      <div className="calendar-container">
        {loading ? (
          <div className="loading">Loading calendar...</div>
        ) : !selectedGroup ? (
          <div className="empty-state">
            <MdGroup size={64} />
            <h3>No group selected</h3>
            <p>Please select a group to view the calendar</p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', position: 'relative' }}>
            
            <ScheduleComponent
              height="700px"
              currentView="Month"
              selectedDate={currentDate}
              eventSettings={{
                dataSource: getFilteredEvents(),
                fields: {
                  id: 'Id',
                  subject: { name: 'Subject' },
                  startTime: { name: 'StartTime' },
                  endTime: { name: 'EndTime' },
                  isAllDay: { name: 'IsAllDay' },
                  description: { name: 'Description' },
                  location: { name: 'Location' },
                },
                allowAdding: true, // Everyone can create
                allowEditing: true, // Permission check in onActionBegin
                allowDeleting: true, // Permission check in onActionBegin
                enableTooltip: true,
              }}
              actionBegin={onActionBegin} // Enforces role-based permissions
              actionComplete={onActionComplete}
              cellDoubleClick={onCellDoubleClick}
              eventRendered={onEventRendered}
              popupOpen={onPopupOpen}
              cssClass="custom-group-calendar"
              allowDragAndDrop={true}
              allowResizing={true}
              allowKeyboardInteraction={true}
              timeScale={{ enable: true, interval: 30, slotCount: 2 }}
              startHour="08:00"
              endHour="20:00"
              showTimeIndicator={true}
            >
              <ViewsDirective>
                <ViewDirective option="Day" />
                <ViewDirective option="Week" />
                <ViewDirective option="WorkWeek" />
                <ViewDirective option="Month" />
                <ViewDirective option="Agenda" />
              </ViewsDirective>
              <Inject services={[Day, Week, WorkWeek, Month, Agenda, DragAndDrop, Resize]} />
            </ScheduleComponent>
          </div>
        )}
      </div>

      {/* Legend */}
     
    </div>
  );
};

export default GroupCalendarTasks;
