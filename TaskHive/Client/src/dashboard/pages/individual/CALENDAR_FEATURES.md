# 📅 Individual Calendar Features Documentation

## Overview

This calendar component is fully integrated with your MongoDB database using the Syncfusion Scheduler. **Every action you take in the UI instantly syncs with your database.**

---

## 🔥 Core Features Implemented

### 1. **ScheduleComponent** - The Main Calendar UI

- **Purpose**: Base calendar container displaying all your events
- **What it does**: Renders the calendar interface with multiple view options
- **Database Sync**: Loads events from MongoDB on mount and refreshes after every change

```typescript
<ScheduleComponent
  height="700px"
  currentView="Month"
  selectedDate={currentDate}
  eventSettings={eventSettings} // 👈 Binds MongoDB events here
  actionBegin={onActionBegin}    // 👈 Intercepts create/edit/delete
  actionComplete={onActionComplete} // 👈 Fires after sync completes
  eventRendered={onEventRendered}   // 👈 Custom styling
  popupOpen={onPopupOpen}           // 👈 Custom form fields
>
```

---

### 2. **eventSettings={{ dataSource: events }}** - Display Events

- **Purpose**: Binds your MongoDB events to the calendar
- **What it does**:
  - Fetches events from API: `GET http://localhost:4000/api/v1/calendar/events`
  - Converts date strings to Date objects for Syncfusion
  - Updates UI whenever events state changes
- **Database Sync**: Real-time display of database events

```typescript
const eventSettings: EventSettingsModel = {
  dataSource: events, // 👈 MongoDB events array
  fields: {
    id: "Id",
    subject: { name: "Subject" },
    startTime: { name: "StartTime" },
    endTime: { name: "EndTime" },
    isAllDay: { name: "IsAllDay" },
    description: { name: "Description" },
    location: { name: "Location" },
  },
  allowAdding: true,
  allowEditing: true,
  allowDeleting: true,
  enableTooltip: true,
};
```

---

### 3. **actionBegin** - 🔥 MOST IMPORTANT FOR DATABASE SYNC

- **Purpose**: Intercepts EVERY user action (create/edit/delete) in the UI
- **What it does**:
  - Detects when user creates, edits, or deletes an event
  - Cancels Syncfusion's default action (`args.cancel = true`)
  - Calls your backend API instead
  - Shows loading indicators and toast notifications
- **Database Sync**: THIS IS WHERE THE MAGIC HAPPENS

#### How it Works:

**CREATE EVENT:**

```typescript
if (args.requestType === "eventCreate") {
  // User creates new event
  const newEvent = {
    subject: eventData.Subject,
    startTime: new Date(eventData.StartTime),
    endTime: new Date(eventData.EndTime),
    // ... other fields
  };

  // Call API: POST /api/v1/calendar/events
  await createEvent(newEvent);

  // Refresh events from database
  await fetchEvents();
}
```

**UPDATE EVENT:**

```typescript
if (args.requestType === "eventChange") {
  // User edits or drags an event
  const updateData = {
    subject: eventData.Subject,
    startTime: new Date(eventData.StartTime),
    // ... other fields
  };

  // Call API: PUT /api/v1/calendar/events/:id
  await updateEvent(eventData.Id, updateData);

  // Refresh events from database
  await fetchEvents();
}
```

**DELETE EVENT:**

```typescript
if (args.requestType === "eventRemove") {
  // User deletes an event

  // Call API: DELETE /api/v1/calendar/events/:id
  await deleteEvent(eventData.Id);

  // Refresh events from database
  await fetchEvents();
}
```

---

### 4. **actionComplete** - Post-Sync Notifications

- **Purpose**: Fires after database sync completes
- **What it does**:
  - Logs success messages
  - Can trigger additional UI updates
  - Useful for debugging and tracking

```typescript
const onActionComplete = (args: ActionEventArgs) => {
  if (args.requestType === "eventCreated") {
    console.log("Event successfully created and synced to database");
  }
  if (args.requestType === "eventChanged") {
    console.log("Event successfully updated and synced to database");
  }
  if (args.requestType === "eventRemoved") {
    console.log("Event successfully deleted from database");
  }
};
```

---

### 5. **Views** - Multiple Calendar Views

- **Purpose**: Allow switching between different calendar layouts
- **Available Views**:
  - 📅 **Day View**: Shows events for a single day
  - 📅 **Week View**: Shows 7 days at once
  - 📅 **WorkWeek View**: Shows Monday-Friday
  - 📅 **Month View**: Shows entire month with events
  - 📅 **Agenda View**: List view of upcoming events

```typescript
<ViewsDirective>
  <ViewDirective option="Day" />
  <ViewDirective option="Week" />
  <ViewDirective option="WorkWeek" />
  <ViewDirective option="Month" />
  <ViewDirective option="Agenda" />
</ViewsDirective>
```

---

### 6. **Inject** - Required View Modules

- **Purpose**: Injects view modules into Syncfusion
- **What it does**: Enables the view options you want to use
- **Required**: Without this, views won't work

```typescript
<Inject services={[Day, Week, WorkWeek, Month, Agenda]} />
```

---

### 7. **eventRendered** - 🎨 Custom Visual Styling

- **Purpose**: Customize how events look based on their properties
- **What it does**:
  - Runs for EVERY event displayed in the calendar
  - Adds visual indicators for priority, status, privacy
  - Changes colors, borders, shadows dynamically

#### Visual Indicators:

**🔥 High/Urgent Priority:**

```typescript
if (eventData.Priority === "high" || eventData.Priority === "urgent") {
  args.element.style.border = "3px solid #FF5722";
  args.element.style.fontWeight = "bold";
  args.element.style.boxShadow = "0 2px 8px rgba(255, 87, 34, 0.3)";
}
```

**⚡ Medium Priority:**

```typescript
if (eventData.Priority === "medium") {
  args.element.style.borderLeft = "4px solid #FFC107";
}
```

**📌 Low Priority:**

```typescript
if (eventData.Priority === "low") {
  args.element.style.opacity = "0.85";
  args.element.style.borderLeft = "3px solid #9E9E9E";
}
```

**✅ Completed Status:**

```typescript
if (eventData.Status === "completed") {
  args.element.style.opacity = "0.6";
  args.element.style.textDecoration = "line-through";
  args.element.style.backgroundColor = "#E8F5E9";
}
```

**🔒 Private Event:**

```typescript
if (eventData.IsPrivate) {
  args.element.style.borderLeft = "5px solid #9C27B0";
  args.element.style.fontStyle = "italic";
  // Adds 🔒 emoji to title
}
```

**📍 Has Location:**

```typescript
if (eventData.Location) {
  // Adds 📍 emoji to title
}
```

---

### 8. **popupOpen** - 📝 Custom Form Fields

- **Purpose**: Add custom fields to the event editor popup
- **What it does**:
  - Detects when editor popup opens
  - Injects custom HTML for Category, Priority, Color, Private toggle
  - Captures values when user saves

#### Custom Fields Added:

**1. Category Dropdown:**

- 💼 Work
- 👤 Personal
- 🤝 Meeting
- ⏰ Deadline
- 🔔 Reminder
- 📌 Other

**2. Priority Dropdown:**

- 🟢 Low
- 🟡 Medium
- 🔴 High
- 🚨 Urgent

**3. Color Picker:**

- 🟢 Green (#4CAF50)
- 🔵 Blue (#2196F3)
- 🟠 Orange (#FF9800)
- 🔴 Red (#F44336)
- 🟣 Purple (#9C27B0)
- ⚪ Gray (#607D8B)

**4. Private Toggle:**

- 🔒 Mark as Private checkbox

```typescript
const onPopupOpen = (args: PopupOpenEventArgs) => {
  if (args.type === "Editor") {
    // Inject custom HTML fields
    customFieldsDiv.innerHTML = `
      <select id="event-category">...</select>
      <select id="event-priority">...</select>
      <select id="event-color">...</select>
      <input type="checkbox" id="event-private" />
    `;

    // Capture values on save
    saveButton.addEventListener("click", () => {
      args.data.Category = categorySelect.value;
      args.data.Priority = prioritySelect.value;
      args.data.CategoryColor = colorSelect.value;
      args.data.IsPrivate = privateCheckbox.checked;
    });
  }
};
```

---

## 🔄 Database Synchronization Flow

### Creating an Event:

1. User double-clicks calendar cell or clicks "New Event"
2. Event editor popup opens with custom fields
3. User fills in details (title, time, category, priority, etc.)
4. User clicks "Save"
5. `popupOpen` captures custom field values
6. `actionBegin` intercepts the save action
7. Shows toast: "Creating event..." 🔄
8. Calls API: `POST /api/v1/calendar/events` with event data
9. Backend saves to MongoDB
10. Shows toast: "Event created successfully! 🎉"
11. `fetchEvents()` refreshes from database
12. `eventRendered` applies custom styling
13. Event appears in calendar with visual indicators

### Editing an Event:

1. User clicks event or drags it to new time
2. `actionBegin` intercepts the change
3. Shows toast: "Updating event..." 🔄
4. Calls API: `PUT /api/v1/calendar/events/:id`
5. Backend updates in MongoDB
6. Shows toast: "Event updated successfully! ✏️"
7. `fetchEvents()` refreshes from database
8. `eventRendered` applies updated styling
9. `actionComplete` logs success

### Deleting an Event:

1. User clicks event → Delete button
2. `actionBegin` intercepts the delete
3. Shows toast: "Deleting event..." 🔄
4. Calls API: `DELETE /api/v1/calendar/events/:id`
5. Backend removes from MongoDB
6. Shows toast: "Event deleted successfully! 🗑️"
7. `fetchEvents()` refreshes from database
8. Event removed from UI

---

## 🎨 Visual Indicators Guide

| Indicator            | Meaning              | Style                                      |
| -------------------- | -------------------- | ------------------------------------------ |
| 🔴 **Red Border**    | High/Urgent Priority | 3px solid red border + bold + shadow       |
| 🟡 **Yellow Border** | Medium Priority      | 4px left yellow border                     |
| 🟢 **Gray Border**   | Low Priority         | 3px left gray border + faded               |
| 🔒 **Purple Border** | Private Event        | 5px left purple border + italic + 🔒 emoji |
| 📍 **Pin Icon**      | Has Location         | 📍 emoji in title                          |
| ✅ **Strikethrough** | Completed            | Faded + strikethrough + green background   |
| 🎨 **Colors**        | Category Colors      | User-selected background color             |

---

## 🚀 User Actions & Database Updates

### What Syncs to Database:

- ✅ Creating new events
- ✅ Editing event details
- ✅ Dragging events to new times
- ✅ Resizing event duration
- ✅ Deleting events
- ✅ Changing category/priority/color
- ✅ Marking as private
- ✅ Adding/editing location
- ✅ Making all-day events

### Real-Time Features:

- 🔄 **Loading Indicator**: Shows "Syncing with database..." during operations
- 🎉 **Toast Notifications**: Success/error messages for every action
- ⚡ **Instant Refresh**: Calendar updates immediately after database sync
- 🎨 **Live Styling**: Visual indicators update in real-time

---

## 📝 API Endpoints Used

| Method | Endpoint                      | Purpose               |
| ------ | ----------------------------- | --------------------- |
| GET    | `/api/v1/calendar/events`     | Fetch all user events |
| POST   | `/api/v1/calendar/events`     | Create new event      |
| PUT    | `/api/v1/calendar/events/:id` | Update existing event |
| DELETE | `/api/v1/calendar/events/:id` | Delete event          |

---

## 🎯 Key Takeaways

1. **actionBegin is the heart of database sync** - It intercepts every UI action and calls your API
2. **args.cancel = true** - Essential to prevent Syncfusion's default behavior
3. **fetchEvents() after every change** - Ensures UI matches database state
4. **eventRendered adds visual flair** - Makes priority/status/privacy instantly visible
5. **popupOpen adds custom fields** - Category, Priority, Color, Private toggle
6. **Toast notifications provide feedback** - User knows when sync succeeds/fails
7. **Everything syncs instantly** - No manual refresh needed

---

## 🐛 Debugging Tips

**Event not saving?**

- Check browser console for API errors
- Verify backend is running on `http://localhost:4000`
- Check if `isAuthenticated` is true
- Look for toast error messages

**Visual indicators not showing?**

- Verify event has Priority/Category/IsPrivate properties
- Check if CSS is imported
- Inspect element styling in browser DevTools

**Custom fields not appearing?**

- Check browser console for errors in `popupOpen`
- Verify popup HTML is being injected
- Try closing and reopening the event editor

---

## 📚 Next Steps

Want to add more features? Consider:

- 🔔 Reminders/Notifications
- 👥 Sharing events with other users
- 🔁 Recurring events
- 📎 File attachments
- 💬 Event comments
- 📊 Analytics dashboard

---

**Created by**: Your Development Team  
**Last Updated**: November 10, 2025  
**Version**: 1.0.0
