# Dashboard Structure Documentation

## 📁 Project Structure

```
Client/src/
├── dashboard/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DashboardLayout.jsx    # Main dashboard wrapper
│   │   │   ├── Sidebar.jsx            # Navigation sidebar
│   │   │   └── Header.jsx             # Top header with search & profile
│   │   │
│   │   ├── calendar/
│   │   │   └── MiniCalendar.jsx       # Compact calendar widget
│   │   │
│   │   ├── tasks/
│   │   │   ├── TaskList.jsx           # (To be implemented)
│   │   │   ├── TaskItem.jsx           # (To be implemented)
│   │   │   └── TaskForm.jsx           # (To be implemented)
│   │   │
│   │   ├── widgets/
│   │   │   ├── StatsCard.jsx          # Statistics card component
│   │   │   ├── ChartWidget.jsx        # Task performance chart
│   │   │   └── RecentActivity.jsx     # Activity timeline
│   │   │
│   │   └── common/
│   │       └── (Common components)
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx              # Main dashboard overview
│   │   ├── TasksPage.jsx              # Task management page
│   │   ├── CalendarPage.jsx           # Full calendar view (placeholder)
│   │   ├── SchedulePage.jsx           # Schedule management (placeholder)
│   │   ├── ProfilePage.jsx            # User profile (placeholder)
│   │   ├── SettingsPage.jsx           # App settings (placeholder)
│   │   ├── ReportsPage.jsx            # Analytics (placeholder)
│   │   │
│   │   ├── individual/
│   │   │   ├── IndividualCalendarTasks.jsx  # Personal calendar with Syncfusion
│   │   │   └── IndividualAIAssistant.jsx    # Personal AI helper
│   │   │
│   │   └── group/
│   │       ├── GroupCalendarTasks.jsx       # Team calendar with Syncfusion
│   │       ├── GroupAIAssistant.jsx         # AI task distribution
│   │       └── GroupAdmin.jsx               # Team management & permissions
│   │
│   ├── context/
│   │   ├── DashboardContext.jsx       # (To be implemented)
│   │   ├── TaskContext.jsx            # (To be implemented)
│   │   └── CalendarContext.jsx        # (To be implemented)
│   │
│   ├── hooks/
│   │   ├── useCalendar.js             # (To be implemented)
│   │   ├── useTasks.js                # (To be implemented)
│   │   └── useEvents.js               # (To be implemented)
│   │
│   ├── styles/
│   │   ├── dashboard/
│   │   │   ├── Dashboard.css          # Dashboard page styles
│   │   │   ├── Sidebar.css            # Sidebar styles
│   │   │   └── Header.css             # Header styles
│   │   ├── calendar/
│   │   │   ├── Calendar.css           # Calendar styles
│   │   │   └── IndividualCalendar.css # Individual calendar styles
│   │   ├── tasks/
│   │   │   └── Tasks.css              # Task management styles
│   │   ├── widgets/
│   │   │   └── Widgets.css            # Widget components styles
│   │   ├── individual/
│   │   │   └── AIAssistant.css        # Individual AI assistant styles
│   │   └── group/
│   │       ├── GroupCalendar.css      # Group calendar styles
│   │       ├── GroupAI.css            # Group AI assistant styles
│   │       └── GroupAdmin.css         # Group admin panel styles
│   │
│   └── utils/
│       └── (Utility functions)
│
└── shared/
    ├── components/
    ├── hooks/
    ├── utils/
    └── styles/
        └── common.css                  # Shared common styles
```

## 🎯 Implemented Features

### ✅ Core Dashboard Layout

- **DashboardLayout.jsx**: Responsive layout with sidebar toggle
- **Sidebar.jsx**: Navigation menu with routes for Individual, Group, and Main sections
- **Header.jsx**: Search, notifications, settings, and profile menu

### ✅ Dashboard Overview Page

- **Dashboard Stats Cards**: Total tasks, completed, pending, today's events
- **Task Performance Chart**: Weekly task completion visualization
- **Recent Tasks List**: Quick view of recent task activity
- **Mini Calendar**: Interactive date picker
- **Upcoming Events**: Event timeline with dates
- **Recent Activity Feed**: User activity tracking

### ✅ Task Management Page

- **Task Grid**: Card-based task display
- **Task Filters**: All, Pending, In Progress, Completed
- **Search Functionality**: Search tasks by title/description
- **Task Stats**: Total, completion rate, due today
- **Task Actions**: Complete, edit, delete tasks
- **Priority Indicators**: Critical, High, Medium, Low

### ✅ Widget Components

- **StatsCard**: Reusable statistics display
- **ChartWidget**: Bar chart for task performance
- **RecentActivity**: Timeline of recent actions
- **MiniCalendar**: Compact calendar with date selection

### ✅ Placeholder Pages

- CalendarPage
- SchedulePage
- ProfilePage
- SettingsPage
- ReportsPage

### ✅ Individual Section Pages

- **IndividualCalendarTasks.jsx**: Personal calendar with Syncfusion Scheduler
- **IndividualAIAssistant.jsx**: AI-powered personal productivity assistant

### ✅ Group Section Pages

- **GroupCalendarTasks.jsx**: Team calendar with member management and Syncfusion Scheduler
- **GroupAIAssistant.jsx**: AI-powered task distribution and team insights
- **GroupAdmin.jsx**: Team administration panel with member/permission management

## 🚀 Features to Implement

### Individual Section

- [x] Individual Calendar & Tasks page with Syncfusion Scheduler
- [x] AI Assistant with chat interface and productivity insights

### Group Section

- [x] Team Calendar & Tasks with Syncfusion Scheduler
- [x] Team member invitation and management
- [x] AI Task Distribution with workload balancing
- [x] Admin Panel with permissions and settings management
- [x] Role-based permissions (Admin vs Member)

#### 🔒 Role-Based Permissions

**Admin Permissions:**

- ✅ Full access to all features
- ✅ View, create, edit, and delete ALL events/tasks
- ✅ Manage team members
- ✅ Edit group settings
- ✅ Assign tasks to any member
- ✅ Change priorities and statuses on all tasks

**Member Permissions:**

- ✅ View all team events/tasks
- ✅ Create new events/tasks
- ✅ Edit ONLY their own assigned tasks
- ❌ Cannot edit other members' tasks (locked with 🔒 icon)
- ❌ Cannot delete any events (only admins can delete)
- ❌ Cannot manage team members
- ❌ Cannot edit group settings

**Visual Indicators:**

- **Role Badge**: Displays "👑 Admin" or "👤 Member" in header
- **Locked Tasks**: Members see 🔒 icon on others' tasks with dashed border
- **Permission Errors**: Toast notifications when attempting unauthorized actions

### Task Management

- [ ] Task creation modal
- [ ] Task editing functionality
- [ ] Task deletion with confirmation
- [ ] Task priority management
- [ ] Task categories/tags
- [ ] Due date management
- [ ] Task attachments

### Calendar Integration

- [x] Syncfusion Scheduler integrated in Individual section
- [x] Syncfusion Scheduler integrated in Group section
- [ ] Event creation/editing modals
- [ ] Event reminders
- [ ] Calendar synchronization with backend
- [ ] Calendar data persistence

### Backend Integration

- [ ] Connect to calendar API
- [ ] Connect to tasks API
- [ ] Real-time updates
- [ ] User authentication
- [ ] Data persistence

## 🎨 Design System

### Colors

- **Primary**: #4318FF (Purple gradient)
- **Success**: #01B574 (Green)
- **Warning**: #FFB547 (Orange)
- **Danger**: #E53E3E (Red)
- **Text**: #1B2559 (Dark blue)
- **Secondary Text**: #A3AED0 (Gray)
- **Background**: #F4F7FE (Light gray)

### Typography

- **Font Family**: 'DM Sans', sans-serif
- **Heading Sizes**: 32px, 24px, 20px, 16px
- **Body Text**: 14px, 13px, 12px

### Spacing

- **Container Padding**: 20px
- **Card Padding**: 24px
- **Component Gaps**: 12px, 16px, 20px

### Border Radius

- **Cards**: 20px, 16px
- **Buttons**: 12px, 10px
- **Small Elements**: 8px, 6px

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔗 Route Structure

```javascript
// Main Section
/dashboard                                  # Main dashboard overview
/dashboard/calendar                         # Full calendar view (placeholder)
/dashboard/tasks                            # Task management
/dashboard/schedule                         # Schedule management (placeholder)

// Individual Section
/dashboard/individual/calendar-tasks        # Personal calendar with Syncfusion
/dashboard/individual/ai-assistant          # AI productivity assistant

// Group Section
/dashboard/group/calendar-tasks             # Team calendar with Syncfusion
/dashboard/group/ai-assistant               # AI task distribution & insights
/dashboard/group/admin                      # Team administration panel

// Account Section
/dashboard/profile                          # User profile (placeholder)
/dashboard/reports                          # Analytics & reports (placeholder)
/dashboard/settings                         # App settings (placeholder)
```

## 🛠️ Technologies Used

### Frontend

- **React 18**: UI framework
- **React Router**: Navigation
- **React Icons**: Icon library
- **CSS3**: Styling (no external UI framework)

### To Be Integrated

- **Syncfusion Schedule**: Calendar component
- **Axios**: HTTP client
- **Context API**: State management

## 📋 Next Steps

1. **Implement Context Providers**

   - DashboardContext for global state
   - TaskContext for task management
   - CalendarContext for events

2. **Create Custom Hooks**

   - useCalendar for calendar operations
   - useTasks for task operations
   - useEvents for event management

3. **Backend Integration**

   - Connect to existing calendar API
   - Connect to task management API
   - Implement real-time updates

4. **Complete Task Management**

   - Task CRUD modals
   - Task filtering and sorting
   - Task categories and tags

5. **Calendar Integration**

   - Full Syncfusion calendar setup
   - Event management
   - Calendar sync

6. **Individual & Group Features**
   - Implement individual section
   - Prepare group collaboration features
   - AI assistant integration planning

## 📝 Notes

- **Syncfusion Scheduler**: Integrated in both Individual and Group calendar pages
- **Individual Section**: Personal calendar and AI assistant are fully implemented
- **Group Section**: Team calendar, AI distribution, and admin panel are fully implemented
- **Main Dashboard**: Shows overview stats, recent tasks, and upcoming events
- **Task Management**: Full CRUD interface with filters and search
- **Modular Architecture**: Easy to extend with new features
- **Backend Integration**: Ready to connect with existing authentication and calendar APIs

## 🔧 Installation Requirements

```bash
# Install Syncfusion Scheduler
npm install @syncfusion/ej2-react-schedule

# Register for Syncfusion license (Community or Trial)
# Add license key in your index.js/main.jsx
```

---

Created: November 2025
Last Updated: November 2025
