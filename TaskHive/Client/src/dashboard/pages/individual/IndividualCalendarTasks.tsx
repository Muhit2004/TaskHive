import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
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
  EventRenderedArgs
} from '@syncfusion/ej2-react-schedule';
import { registerLicense } from '@syncfusion/ej2-base';
import { Context } from '../../../main';
import { toast } from 'react-toastify';
import { MdPerson, MdAddTask, MdAutoAwesome, MdFilterList, MdBarChart } from 'react-icons/md';
import axios from 'axios';
import '../../styles/calendar/IndividualCalendar.css';
import '../../styles/group/GroupCalendar.css';

// Register Syncfusion license

// Interface for calendar events from our API
interface CalendarEvent {
  Id: string;
  Subject: string;
  StartTime: string | Date;
  EndTime: string | Date;
  IsAllDay?: boolean;
  Description?: string;
  Location?: string;
  CategoryColor?: string;
  Category?: string;
  Priority?: string;
  Status?: string;
  IsPrivate?: boolean;
}

// Interface for new event creation
interface NewEventData {
  subject: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  isAllDay?: boolean;
  categoryColor?: string;
  category?: string;
  location?: string;
  priority?: string;
  isPrivate?: boolean;
}

const CalendarView: React.FC = () => {
  // State management
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // Filter States
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Task Form States (AI-powered)
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [predictedTime, setPredictedTime] = useState<string | null>(null);

  const suggestionTimerRef = useRef<any>(null);
  const scheduleRef = useRef<any>(null);
  
  // Get authentication context  
  const contextValue = useContext(Context) as any;
  const { isAuthenticated, user } = contextValue || { isAuthenticated: false, user: null };

  // AI task title suggestions with debouncing
  const handleTitleChange = async (e: any) => {
    setTaskTitle(e.target.value);
    if (suggestionTimerRef.current) clearTimeout(suggestionTimerRef.current);
    
    if (e.target.value.length > 3) {
      suggestionTimerRef.current = setTimeout(async () => {
        try {
          console.log("🔍 Fetching suggestions for:", e.target.value);
          const response = await fetch(
            "http://localhost:4000/api/v1/ai/suggest-title",
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ input: e.target.value }),
            }
          );
          const result = await response.json();
          console.log("AI Suggestions Response:", result);
          if (result.success && Array.isArray(result.suggestions)) {
            setSuggestions(result.suggestions);
          } else {
            setSuggestions([]);
          }
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setSuggestions([]);
        }
      }, 800);
    } else {
      setSuggestions([]);
    }
  };

  // AI-powered time estimation when description changes
  const handleDescriptionChange = async (e: any) => {
    setTaskDesc(e.target.value);
    
    // Predict task completion time if both title and description are available
    if (taskTitle.trim() && e.target.value.length > 10) {
      try {
        const res = await axios.post(`${API_BASE_URL}/task/predict-time`, 
          { 
            taskTitle, 
            taskDescription: e.target.value 
          }, 
          { withCredentials: true }
        );
        if (res.data.success && res.data.estimatedTime) {
          setPredictedTime(res.data.estimatedTime);
        }
      } catch (error) {
        console.error("Error predicting task time:", error);
      }
    }
  };

  // API base URL
  const API_BASE_URL = 'http://localhost:4000/api/v1/calendar';

  // ===============================
  // HELPER FUNCTIONS
  // ===============================

  // Get filtered events based on current filters
  const getFilteredEvents = (): CalendarEvent[] => {
    return events.filter(event => {
      if (filterStatus !== "all" && event.Status !== filterStatus) return false;
      if (filterPriority !== "all" && event.Priority !== filterPriority) return false;
      return true;
    });
  };

  // ===============================
  // API FUNCTIONS
  // ===============================

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Please log in to view your calendar');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Convert date strings to Date objects for Syncfusion
        const formattedEvents = data.events.map((event: CalendarEvent) => ({
          ...event,
          StartTime: new Date(event.StartTime),
          EndTime: new Date(event.EndTime),
        }));
        
        setEvents(formattedEvents);
        console.log('📅 Events loaded:', formattedEvents.length);
      } else {
        setError(data.message || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Create new event
  const createEvent = async (eventData: NewEventData): Promise<boolean> => {
    try {
      setIsSyncing(true); // Show syncing status
      toast.info('Creating event...', { autoClose: 1000 });

      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Event created:', data.event);
        toast.success('Event created successfully! 🎉');
        await fetchEvents(); // Refresh events from database
        return true;
      } else {
        setError(data.message || 'Failed to create event');
        toast.error(data.message || 'Failed to create event');
        return false;
      }
    } catch (error) {
      console.error('❌ Error creating event:', error);
      setError('Failed to create event');
      toast.error('Failed to sync with database');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Update existing event
  const updateEvent = async (eventId: string, eventData: Partial<NewEventData>): Promise<boolean> => {
    try {
      setIsSyncing(true); // Show syncing status
      toast.info('Updating event...', { autoClose: 1000 });

      console.log('📤 Sending update to backend:', {
        eventId,
        eventData
      });

      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      console.log('📥 Backend response status:', response.status);

      const data = await response.json();
      console.log('📥 Backend response data:', data);

      if (data.success) {
        console.log('✅ Event updated:', data.event);
        toast.success('Event updated successfully! ✏️');
        await fetchEvents(); // Refresh events from database
        return true;
      } else {
        console.error('❌ Backend error:', data.message);
        setError(data.message || 'Failed to update event');
        toast.error(data.message || 'Failed to update event');
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating event:', error);
      setError('Failed to update event');
      toast.error('Failed to sync with database');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete event
  const deleteEvent = async (eventId: string): Promise<boolean> => {
    try {
      setIsSyncing(true); // Show syncing status
      toast.info('Deleting event...', { autoClose: 1000 });

      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Event deleted:', data.deletedEvent);
        toast.success('Event deleted successfully! 🗑️');
        await fetchEvents(); // Refresh events from database
        return true;
      } else {
        setError(data.message || 'Failed to delete event');
        toast.error(data.message || 'Failed to delete event');
        return false;
      }
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      setError('Failed to delete event');
      toast.error('Failed to sync with database');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // ===============================
  // AI-POWERED TASK CREATION
  // ===============================

  // Create new task with AI assistance
  const handleCreateTask = async (e: any) => {
    e.preventDefault();

    if (!taskTitle.trim() || !taskDesc.trim()) {
      toast.error("Please fill in all fields");
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

      const taskData = {
        subject: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        isAllDay: false,
        location: '',
        category: 'work',
        categoryColor: taskPriority === 'high' || taskPriority === 'urgent' ? '#F44336' : taskPriority === 'medium' ? '#FF9800' : '#4CAF50',
        isPrivate: false,
      };

      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      const res = await response.json();

      if (res.success) {
        toast.success(`✅ Task created successfully!`);

        // Reset form
        setTaskTitle("");
        setTaskDesc("");
        setTaskPriority("medium");
        setTaskDueDate("");
        setSuggestions([]);
        setPredictedTime(null);
        setShowTaskForm(false);

        // Refresh tasks
        await fetchEvents();
      } else {
        toast.error(res.message || 'Failed to create task');
      }
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast.error(error.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // SYNCFUSION EVENT HANDLERS (CRITICAL FOR DATABASE SYNC)
  // ===============================

  /**
   * 🔥 MOST IMPORTANT FUNCTION - actionBegin
   * This intercepts ALL user actions (create/edit/delete) in the calendar UI
   * We cancel the default action and call our backend API instead
   * This ensures EVERY change syncs with MongoDB in real-time
   */
  const onActionBegin = async (args: ActionEventArgs) => {
    console.log('🔄 Action begin:', args.requestType, args);

    // CRITICAL: Capture custom fields from popup BEFORE processing the action
    if ((args.requestType === 'eventCreate' || args.requestType === 'eventChange') && args.data) {
      const categorySelect = document.getElementById('event-category') as HTMLSelectElement;
      const prioritySelect = document.getElementById('event-priority') as HTMLSelectElement;
      const statusSelect = document.getElementById('event-status') as HTMLSelectElement;
      const colorInput = document.getElementById('event-color') as HTMLInputElement;
      const privateCheckbox = document.getElementById('event-private') as HTMLInputElement;
      
      if (categorySelect || prioritySelect || statusSelect || colorInput || privateCheckbox) {
        const eventData = Array.isArray(args.data) ? args.data[0] : args.data;
        
        // Capture Category
        if (categorySelect) {
          eventData.Category = categorySelect.value;
          console.log('📂 Captured Category:', eventData.Category);
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
        
        // Capture Color
        if (colorInput) {
          eventData.CategoryColor = colorInput.value;
          console.log('🎨 Captured Color:', eventData.CategoryColor);
        }
        
        // Capture Private
        if (privateCheckbox) {
          eventData.IsPrivate = privateCheckbox.checked;
          console.log('🔒 Captured Private:', eventData.IsPrivate);
        }
        
        console.log('💾 Custom fields captured successfully:', {
          Category: eventData.Category,
          Priority: eventData.Priority,
          Status: eventData.Status,
          CategoryColor: eventData.CategoryColor,
          IsPrivate: eventData.IsPrivate
        });
      }
    }

    // ✅ CREATE NEW EVENT - When user creates an event
    if (args.requestType === 'eventCreate' && args.data) {
      args.cancel = true; // Cancel Syncfusion's default action
      
      const eventData = Array.isArray(args.data) ? args.data[0] : args.data;
      
      const newEvent: any = {
        subject: eventData.Subject || 'New Event',
        description: eventData.Description || '',
        startTime: new Date(eventData.StartTime),
        endTime: new Date(eventData.EndTime),
        isAllDay: eventData.IsAllDay || false,
        categoryColor: eventData.CategoryColor || '#4CAF50',
        category: eventData.Category || 'other',
        location: eventData.Location || '',
        priority: eventData.Priority || 'medium',
        status: eventData.Status || 'scheduled',
        isPrivate: eventData.IsPrivate || false,
      };

      const success = await createEvent(newEvent);
      if (!success) {
        // If API fails, revert the UI
        console.error('Failed to create event in database');
      }
    }

    // ✅ UPDATE EVENT - When user edits or drags an event
    if (args.requestType === 'eventChange' && args.data) {
      args.cancel = true; // Cancel Syncfusion's default action
      
      const eventData = Array.isArray(args.data) ? args.data[0] : args.data;
      
      console.log('🔍 Raw event data from Syncfusion:', eventData);
      
      // Build update data - only include fields that exist
      const updateData: any = {};
      
      if (eventData.Subject !== undefined) updateData.subject = eventData.Subject;
      if (eventData.Description !== undefined) updateData.description = eventData.Description;
      if (eventData.Status !== undefined) updateData.status = eventData.Status;
      
      // Always send both startTime and endTime together to avoid validation issues
      if (eventData.StartTime !== undefined || eventData.EndTime !== undefined) {
        updateData.startTime = new Date(eventData.StartTime);
        updateData.endTime = new Date(eventData.EndTime);
        
        // Validate dates before sending
        if (updateData.endTime <= updateData.startTime) {
          console.error('❌ Invalid dates detected:', {
            startTime: updateData.startTime,
            endTime: updateData.endTime
          });
          toast.error('Invalid event duration');
          return;
        }
      }
      
      if (eventData.IsAllDay !== undefined) updateData.isAllDay = eventData.IsAllDay;
      if (eventData.CategoryColor !== undefined) updateData.categoryColor = eventData.CategoryColor;
      if (eventData.Category !== undefined) updateData.category = eventData.Category;
      if (eventData.Location !== undefined) updateData.location = eventData.Location;
      if (eventData.Priority !== undefined) updateData.priority = eventData.Priority;
      if (eventData.IsPrivate !== undefined) updateData.isPrivate = eventData.IsPrivate;

      console.log('📝 Sending update with data:', updateData);

      const success = await updateEvent(eventData.Id, updateData);
      if (!success) {
        // If API fails, revert the UI
        console.error('Failed to update event in database');
        await fetchEvents(); // Refresh to revert UI to database state
      }
    }

    // ✅ DELETE EVENT - When user deletes an event
    if (args.requestType === 'eventRemove' && args.data) {
      args.cancel = true; // Cancel Syncfusion's default action
      
      const eventData = Array.isArray(args.data) ? args.data[0] : args.data;
      const success = await deleteEvent(eventData.Id);
      if (!success) {
        // If API fails, revert the UI
        console.error('Failed to delete event from database');
      }
    }
  };

  /**
   * 🎯 actionComplete - Fires after action completes
   * Used to refresh UI and show notifications after database sync
   */
  const onActionComplete = (args: ActionEventArgs) => {
    console.log('✅ Action completed:', args.requestType);
    
    // Log completion for debugging
    if (args.requestType === 'eventCreated') {
      console.log('Event successfully created and synced to database');
    }
    if (args.requestType === 'eventChanged') {
      console.log('Event successfully updated and synced to database');
    }
    if (args.requestType === 'eventRemoved') {
      console.log('Event successfully deleted from database');
    }
  };

  // Handle double-click on calendar cells to create new events
  const onCellDoubleClick = (args: CellClickEventArgs) => {
    console.log('📅 Cell double clicked:', args);
    // The calendar will automatically open the event creation popup
  };

  /**
   * 🎨 eventRendered - Customize event appearance
   * This runs for EVERY event displayed in the calendar
   * Perfect for adding visual indicators based on priority, category, status
   */
  const onEventRendered = (args: EventRenderedArgs) => {
    const eventData = args.data as CalendarEvent;
    
    // Apply custom styling based on event properties
    if (args.element) {
      // 🎨 Set background color from categoryColor with better text visibility
      if (eventData.CategoryColor) {
        args.element.style.backgroundColor = eventData.CategoryColor;
        args.element.style.color = '#ffffff'; // White text for better visibility
        args.element.style.fontWeight = '600'; // Bold text
        args.element.style.textShadow = '0 1px 3px rgba(0,0,0,0.4)'; // Text shadow for readability
        args.element.style.padding = '6px 10px'; // Better padding
        args.element.style.color = '#ffffff'; // White text for better visibility
        args.element.style.fontWeight = '600'; // Bold text
        args.element.style.textShadow = '0 1px 2px rgba(0,0,0,0.3)'; // Text shadow for readability
        args.element.style.padding = '4px 8px'; // Better padding
      }
      
      // 🔥 HIGH PRIORITY - Red border + bold text
      if (eventData.Priority === 'high' || eventData.Priority === 'urgent') {
        args.element.style.border = '3px solid #FF5722';
        args.element.style.borderRadius = '6px';
        args.element.style.fontWeight = 'bold';
        args.element.style.boxShadow = '0 2px 8px rgba(255, 87, 34, 0.3)';
      }
      
      // ⚡ MEDIUM PRIORITY - Yellow left border
      if (eventData.Priority === 'medium') {
        args.element.style.borderLeft = '4px solid #FFC107';
      }
      
      // 📌 LOW PRIORITY - Gray styling
      if (eventData.Priority === 'low') {
        args.element.style.opacity = '0.85';
        args.element.style.borderLeft = '3px solid #9E9E9E';
      }
      
      // ✅ STATUS STYLING
      if (eventData.Status === 'completed') {
        args.element.style.opacity = '0.6';
        args.element.style.textDecoration = 'line-through';
        args.element.style.backgroundColor = '#4CAF50';
        args.element.style.color = '#ffffff';
      }
      if (eventData.Status === 'cancelled') {
        args.element.style.opacity = '0.5';
        args.element.style.textDecoration = 'line-through';
        args.element.style.backgroundColor = '#F44336';
        args.element.style.color = '#ffffff';
      }
      if (eventData.Status === 'postponed') {
        args.element.style.opacity = '0.7';
        args.element.style.backgroundColor = '#FF9800';
        args.element.style.color = '#ffffff';
        args.element.style.borderLeft = '5px solid #FF5722';
      }
      
      // 🔒 PRIVATE EVENT - Purple left border + lock icon
      if (eventData.IsPrivate) {
        args.element.style.borderLeft = '5px solid #9C27B0';
        args.element.style.fontStyle = 'italic';
        // Add lock emoji to title
        const titleElement = args.element.querySelector('.e-subject');
        if (titleElement && !titleElement.textContent?.includes('🔒')) {
          titleElement.textContent = '🔒 ' + titleElement.textContent;
        }
      }
      
      // 📍 HAS LOCATION - Add location pin icon
      if (eventData.Location) {
        const titleElement = args.element.querySelector('.e-subject');
        if (titleElement && !titleElement.textContent?.includes('📍')) {
          titleElement.textContent = '📍 ' + titleElement.textContent;
        }
      }
    }
  };

  /**
   * 📝 popupOpen - Customize the event editor popup
   * Add custom fields for Category, Priority, Private toggle
   */
  const onPopupOpen = (args: PopupOpenEventArgs) => {
    console.log('📝 Popup opened:', args.type);
    
    if (args.type === 'Editor') {
      // Wait for the popup to fully render
      setTimeout(() => {
        const dialogContent = args.element?.querySelector('.e-schedule-dialog .e-dlg-content');
        
        if (dialogContent) {
          // Check if custom fields already exist
          if (!dialogContent.querySelector('#custom-fields-container')) {
            // Create custom fields container
            const customFieldsDiv = document.createElement('div');
            customFieldsDiv.id = 'custom-fields-container';
            customFieldsDiv.style.cssText = 'margin-top: 15px; padding: 15px; background: #f5f5f5; border-radius: 8px;';
            
            // Get current event data
            const eventData = args.data as CalendarEvent;
            
            // 🎨 CATEGORY FIELD WITH COLOR PICKER
            customFieldsDiv.innerHTML = `
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">
                  🎨 Event Color
                </label>
                <input type="color" id="event-color" value="${eventData?.CategoryColor || '#4CAF50'}" 
                  style="width: 100%; height: 45px; border: 2px solid #ddd; border-radius: 6px; cursor: pointer; padding: 4px;" />
              </div>
              
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">
                  📂 Category
                </label>
                <select id="event-category" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                  <option value="work" ${eventData?.Category === 'work' ? 'selected' : ''}>💼 Work</option>
                  <option value="personal" ${eventData?.Category === 'personal' ? 'selected' : ''}>👤 Personal</option>
                  <option value="meeting" ${eventData?.Category === 'meeting' ? 'selected' : ''}>🤝 Meeting</option>
                  <option value="deadline" ${eventData?.Category === 'deadline' ? 'selected' : ''}>⏰ Deadline</option>
                  <option value="reminder" ${eventData?.Category === 'reminder' ? 'selected' : ''}>🔔 Reminder</option>
                  <option value="other" ${eventData?.Category === 'other' ? 'selected' : ''}>📌 Other</option>
                </select>
              </div>
              
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">
                  ⚡ Priority
                </label>
                <select id="event-priority" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                  <option value="low" ${eventData?.Priority === 'low' ? 'selected' : ''}>🟢 Low</option>
                  <option value="medium" ${eventData?.Priority === 'medium' ? 'selected' : ''}>🟡 Medium</option>
                  <option value="high" ${eventData?.Priority === 'high' ? 'selected' : ''}>🔴 High</option>
                  <option value="urgent" ${eventData?.Priority === 'urgent' ? 'selected' : ''}>🚨 Urgent</option>
                </select>
              </div>
              
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">
                  📊 Status
                </label>
                <select id="event-status" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                  <option value="scheduled" ${eventData?.Status === 'scheduled' ? 'selected' : ''}>📅 Scheduled</option>
                  <option value="completed" ${eventData?.Status === 'completed' ? 'selected' : ''}>✅ Completed</option>
                  <option value="cancelled" ${eventData?.Status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                  <option value="postponed" ${eventData?.Status === 'postponed' ? 'selected' : ''}>⏸️ Postponed</option>
                </select>
              </div>
              
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">
                  🎨 Color
                </label>
                <select id="event-color" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                  <option value="#4CAF50" ${eventData?.CategoryColor === '#4CAF50' ? 'selected' : ''}>🟢 Green</option>
                  <option value="#2196F3" ${eventData?.CategoryColor === '#2196F3' ? 'selected' : ''}>🔵 Blue</option>
                  <option value="#FF9800" ${eventData?.CategoryColor === '#FF9800' ? 'selected' : ''}>🟠 Orange</option>
                  <option value="#F44336" ${eventData?.CategoryColor === '#F44336' ? 'selected' : ''}>🔴 Red</option>
                  <option value="#9C27B0" ${eventData?.CategoryColor === '#9C27B0' ? 'selected' : ''}>� Purple</option>
                  <option value="#607D8B" ${eventData?.CategoryColor === '#607D8B' ? 'selected' : ''}>⚪ Gray</option>
                </select>
              </div>
              
              <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: white; border-radius: 6px;">
                <input 
                  type="checkbox" 
                  id="event-private" 
                  ${eventData?.IsPrivate ? 'checked' : ''}
                  style="width: 18px; height: 18px; cursor: pointer;"
                />
                <label for="event-private" style="cursor: pointer; font-weight: 600; color: #555;">
                  🔒 Mark as Private
                </label>
              </div>
            `;
            
            // Insert custom fields before the save button
            const formContent = dialogContent.querySelector('.e-schedule-form');
            if (formContent) {
              formContent.appendChild(customFieldsDiv);
            }
          }
        }
      }, 100);
    }
  };

  // ===============================
  // EFFECTS
  // ===============================

  // Fetch events when component mounts or authentication changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Update calendar dataSource when filters change
  useEffect(() => {
    if (scheduleRef.current) {
      const filteredData = getFilteredEvents();
      scheduleRef.current.eventSettings.dataSource = filteredData;
      scheduleRef.current.dataBind();
      console.log('🔄 Calendar dataSource updated with filters:', {
        status: filterStatus,
        priority: filterPriority,
        totalEvents: events.length,
        filteredEvents: filteredData.length
      });
    }
  }, [filterStatus, filterPriority, events]);

  // ===============================
  // EVENT SETTINGS
  // ===============================

  const eventSettings: EventSettingsModel = {
    dataSource: events,
    fields: {
      id: 'Id',
      subject: { name: 'Subject' },
      startTime: { name: 'StartTime' },
      endTime: { name: 'EndTime' },
      isAllDay: { name: 'IsAllDay' },
      description: { name: 'Description' },
      location: { name: 'Location' },
    },
    allowAdding: true,
    allowEditing: true,
    allowDeleting: true,
    enableTooltip: true,
  };

  // ===============================
  // RENDER
  // ===============================

  // Show error if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        backgroundColor: '#f5f5f5',
        minHeight: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <h2 style={{ color: '#666', marginBottom: '16px' }}>🔒 Authentication Required</h2>
        <p style={{ color: '#888', fontSize: '16px' }}>
          Please log in to access your personal calendar
        </p>
      </div>
    );
  }

 

  // Show error state
  if (error) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        backgroundColor: '#ffebee',
        minHeight: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <h2 style={{ color: '#d32f2f', marginBottom: '16px' }}>❌ Error</h2>
        <p style={{ color: '#c62828', fontSize: '16px', marginBottom: '20px' }}>
          {error}
        </p>
        <button 
          onClick={fetchEvents}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  // Main calendar component
  return (
    <div className="group-tasks-page">
      {/* Modern Header */}
      <div className="page-header">
        <div className="header-content">
          <MdPerson className="header-icon" />
          <div>
            <h1>My Personal Calendar</h1>
            <p>Organize your tasks and schedule with AI assistance</p>
          </div>
        </div>

        <div className="header-right">
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

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1B2559' }}>Description</label>
                <textarea
                  placeholder="Enter task description..."
                  value={taskDesc}
                  onChange={handleDescriptionChange}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
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
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                    <option value="urgent">🚨 Urgent</option>
                  </select>
                </div>

                <div>
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

      {/* Event Stats */}
      <div className="team-stats">
        <div className="stat-card">
          <h3>Total Events</h3>
          <p className="stat-value">{events.length}</p>
        </div>
        <div className="stat-card">
          <h3>Scheduled</h3>
          <p className="stat-value">
            {events.filter((t) => t.Status === "scheduled").length}
          </p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p className="stat-value">
            {events.filter((t) => t.Status === "completed").length}
          </p>
        </div>
        <div className="stat-card">
          <h3>Cancelled</h3>
          <p className="stat-value">
            {events.filter((t) => t.Status === "cancelled").length}
          </p>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <div className="analytics-dashboard">
          <h3>📊 Personal Analytics</h3>
          
          <div className="analytics-grid">
            {/* Priority Breakdown */}
            <div className="analytics-card">
              <h4>⚡ Priority Breakdown</h4>
              <div className="priority-stats">
                <div className="priority-item">
                  <span className="priority-label">🚨 Urgent:</span>
                  <span className="priority-value">{events.filter(e => e.Priority === 'urgent').length}</span>
                </div>
                <div className="priority-item">
                  <span className="priority-label">🔴 High:</span>
                  <span className="priority-value">{events.filter(e => e.Priority === 'high').length}</span>
                </div>
                <div className="priority-item">
                  <span className="priority-label">🟡 Medium:</span>
                  <span className="priority-value">{events.filter(e => e.Priority === 'medium').length}</span>
                </div>
                <div className="priority-item">
                  <span className="priority-label">🟢 Low:</span>
                  <span className="priority-value">{events.filter(e => e.Priority === 'low').length}</span>
                </div>
              </div>
            </div>

            {/* Status Overview */}
            <div className="analytics-card">
              <h4>📊 Status Overview</h4>
              <div className="status-stats">
                <div className="status-item">
                  <span className="status-label">📅 Scheduled:</span>
                  <span className="status-value">{events.filter(e => e.Status === 'scheduled').length}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">✅ Completed:</span>
                  <span className="status-value">{events.filter(e => e.Status === 'completed').length}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">❌ Cancelled:</span>
                  <span className="status-value">{events.filter(e => e.Status === 'cancelled').length}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">⏸️ Postponed:</span>
                  <span className="status-value">{events.filter(e => e.Status === 'postponed').length}</span>
                </div>
              </div>
            </div>

            {/* Personal Performance */}
            <div className="analytics-card">
              <h4>🎯 Performance</h4>
              <div className="performance-stats">
                <div className="performance-metric">
                  <span className="metric-label">Total Events:</span>
                  <span className="metric-value">{events.length}</span>
                </div>
                <div className="performance-metric">
                  <span className="metric-label">Completion Rate:</span>
                  <span className="metric-value">
                    {events.length > 0 ? Math.round((events.filter(e => e.Status === 'completed').length / events.length) * 100) : 0}%
                  </span>
                </div>
                <div className="performance-metric">
                  <span className="metric-label">Scheduled Events:</span>
                  <span className="metric-value">
                    {events.filter(e => e.Status === 'scheduled').length}
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
            <label>📊 Status:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="postponed">Postponed</option>
            </select>
          </div>

          <div className="filter-group">
            <label>⚡ Priority:</label>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <button className="btn-clear-filters" onClick={() => {
            setFilterStatus("all");
            setFilterPriority("all");
          }}>
            Clear Filters
          </button>
        </div>
      )}

      {/* Calendar Component */}
      <div className="calendar-container">
        <ScheduleComponent
          ref={scheduleRef}
          height="700px"
          currentView="Month"
          selectedDate={currentDate}
          eventSettings={eventSettings}
          actionBegin={onActionBegin}
          actionComplete={onActionComplete}
          cellDoubleClick={onCellDoubleClick}
          eventRendered={onEventRendered}
          popupOpen={onPopupOpen}
          cssClass="custom-calendar"
          // 🎯 Enable Drag & Drop
          allowDragAndDrop={true}
          // 🎯 Enable Event Resize
          allowResizing={true}
          // 🎯 Enable Keyboard Interaction
          allowKeyboardInteraction={true}
          // 🎯 Time Scale for Day/Week views (30 min slots)
          timeScale={{ enable: true, interval: 30, slotCount: 2 }}
          // 🎯 Start/End Hour for Day/Week views (8 AM - 8 PM)
          startHour="08:00"
          endHour="20:00"
          // 🎯 Enable scroll in Day view
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

      {/* Quick Stats & Tips */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
          💡 <strong>Tips:</strong> Double-click any cell to create an event • 
          <strong>Drag & Drop</strong> events to reschedule • 
          <strong>Resize</strong> events to change duration • 
          Right-click events for more options • 
          All changes sync instantly with your database • 
          Day view has <strong>scrollable timeline</strong> (8 AM - 8 PM)
        </p>
      </div>

      {/* Feature Legend */}
      <div style={{
        marginTop: '15px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '14px' }}>
          🎨 Visual Indicators:
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '10px',
          fontSize: '12px',
          color: '#666'
        }}>
          <div>🔴 <strong>Red Border:</strong> High/Urgent Priority</div>
          <div>🟡 <strong>Yellow Border:</strong> Medium Priority</div>
          <div>🔒 <strong>Purple Border:</strong> Private Event</div>
          <div>📍 <strong>Location Pin:</strong> Has Location</div>
          <div>✅ <strong>Strikethrough:</strong> Completed</div>
          <div>🎨 <strong>Colors:</strong> Category Colors</div>
        </div>
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default CalendarView;