# 📅 Personal Calendar System Documentation

## Overview

A complete calendar management system integrated with your existing authentication app. Users can create, view, edit, and delete personal calendar events stored in MongoDB.

## 🏗️ Architecture

### Backend Components

- **Model**: `server/models/calendarModels.js` - MongoDB schema for calendar events
- **Routes**: `server/routes/calendarRoutes.js` - API endpoints for calendar operations
- **Controller**: `server/controllers/calendarController.js` - Business logic for calendar operations
- **Server**: `server/app.js` - Updated to include calendar routes

### Frontend Components

- **Calendar View**: `Client/src/calander/CalanderView.tsx` - Main calendar component with Syncfusion integration

## 🔗 API Endpoints

### Base URL: `http://localhost:4000/api/v1/calendar`

#### Event Management

**Create Event**

```http
POST /events
Authorization: Required (JWT cookie)
Content-Type: application/json

Body:
{
  "subject": "Meeting with Team",
  "description": "Discuss project milestones",
  "startTime": "2024-12-01T10:00:00Z",
  "endTime": "2024-12-01T11:30:00Z",
  "isAllDay": false,
  "categoryColor": "#4CAF50",
  "category": "work",
  "location": "Conference Room A",
  "priority": "high",
  "reminderMinutes": 15,
  "isPrivate": false
}
```

**Get User Events**

```http
GET /events?page=1&limit=50&category=work&status=scheduled
Authorization: Required (JWT cookie)

Query Parameters:
- page: Page number (default: 1)
- limit: Events per page (default: 50)
- category: Filter by category (work, personal, meeting, etc.)
- status: Filter by status (scheduled, completed, cancelled, postponed)
- priority: Filter by priority (low, medium, high, urgent)
- sortBy: Sort field (default: startTime)
- order: Sort order (asc, desc)
- search: Search in subject, description, location
```

**Get Events by Date Range**

```http
GET /events/range?startDate=2024-12-01&endDate=2024-12-31
Authorization: Required (JWT cookie)

Query Parameters:
- startDate: Start date (YYYY-MM-DD)
- endDate: End date (YYYY-MM-DD)
- timezone: Timezone (default: UTC)
```

**Get Upcoming Events**

```http
GET /events/upcoming?limit=10&days=30
Authorization: Required (JWT cookie)

Query Parameters:
- limit: Number of events (default: 10)
- days: Days ahead to look (default: 30)
```

**Get Event by ID**

```http
GET /events/:id
Authorization: Required (JWT cookie)
```

**Update Event**

```http
PUT /events/:id
Authorization: Required (JWT cookie)
Content-Type: application/json

Body: (partial update supported)
{
  "subject": "Updated Meeting Title",
  "startTime": "2024-12-01T14:00:00Z",
  "endTime": "2024-12-01T15:30:00Z"
}
```

**Update Event Status**

```http
PATCH /events/:id/status
Authorization: Required (JWT cookie)
Content-Type: application/json

Body:
{
  "status": "completed"
}
```

**Delete Event**

```http
DELETE /events/:id
Authorization: Required (JWT cookie)
```

#### Dashboard

**Get Dashboard Summary**

```http
GET /dashboard?period=week
Authorization: Required (JWT cookie)

Query Parameters:
- period: week | month | year
```

## 📊 Data Models

### CalendarEvent Schema

```javascript
{
  userId: ObjectId,           // Reference to User
  subject: String,            // Event title (required)
  description: String,        // Event description
  startTime: Date,           // Start time (required)
  endTime: Date,             // End time (required)
  isAllDay: Boolean,         // All-day event flag
  categoryColor: String,     // Hex color code
  category: String,          // work, personal, meeting, etc.
  location: String,          // Event location
  priority: String,          // low, medium, high, urgent
  status: String,            // scheduled, completed, cancelled, postponed
  reminderMinutes: Number,   // Reminder time before event
  isPrivate: Boolean,        // Private event flag
  attendees: Array,          // Event attendees (future)
  createdAt: Date,           // Creation timestamp
  updatedAt: Date,           // Last update timestamp
  lastModifiedBy: ObjectId   // User who last modified
}
```

## 🎨 Frontend Features

### Syncfusion Calendar Integration

- **Multiple Views**: Day, Week, Work Week, Month, Agenda
- **Event Creation**: Double-click any cell to create events
- **Event Editing**: Click events to edit details
- **Drag & Drop**: Drag events to reschedule
- **Visual Indicators**:
  - Priority: High/urgent events have red borders
  - Status: Completed events are crossed out
  - Privacy: Private events have purple left border
  - Colors: Custom category colors

### User Interface

- **Authentication**: Login required to access calendar
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages
- **Real-time Updates**: Events refresh after operations
- **Responsive Design**: Works on different screen sizes

## 🔧 Setup Instructions

### 1. Database Setup

The calendar events are stored in MongoDB using the existing connection. No additional database setup required.

### 2. Server Configuration

Calendar routes are automatically included when you start the server:

```bash
cd server
npm start
```

### 3. Frontend Access

Navigate to the calendar in your React app. The component will:

- Check authentication status
- Fetch user's events from the API
- Display events in the Syncfusion calendar
- Handle all CRUD operations

## 🚀 Usage Examples

### Creating an Event

1. Double-click any calendar cell
2. Fill in event details in the popup
3. Click Save
4. Event is created and stored in database

### Viewing Events

- Events automatically load when calendar opens
- Switch between different views (Day, Week, Month, etc.)
- Events show with custom colors and indicators

### Editing Events

1. Click on any event
2. Modify details in the popup
3. Save changes
4. Event is updated in database

### Deleting Events

1. Right-click on event or open event details
2. Click delete option
3. Event is removed from database

## 🔒 Security

### Authentication

- All calendar endpoints require JWT authentication
- Users can only access their own events
- User ID is automatically attached to all events

### Data Validation

- Server-side validation for all input data
- Date validation (end time must be after start time)
- Input sanitization and length limits
- MongoDB schema validation

### Error Handling

- Comprehensive error messages
- Proper HTTP status codes
- Client-side error display
- Server-side error logging

## 📈 Performance Features

### Database Optimization

- Indexed fields for faster queries
- Compound indexes for common query patterns
- Efficient date range queries
- Pagination support

### Frontend Optimization

- Event caching to reduce API calls
- Efficient re-rendering with React hooks
- Lazy loading for large datasets
- Optimized Syncfusion configuration

## 🔮 Future Enhancements

### Planned Features

- **Recurring Events**: Support for repeating events
- **Event Sharing**: Share events with other users
- **Notifications**: Email/SMS reminders
- **Calendar Import/Export**: iCal format support
- **Bulk Operations**: Create/edit multiple events
- **Advanced Filtering**: More filter options
- **Calendar Views**: Timeline and custom views
- **Collaboration**: Multi-user event editing

### API Extensions

- Bulk event operations
- Calendar sharing endpoints
- Notification management
- Advanced search capabilities
- Event templates
- Calendar synchronization

## 🛠️ Troubleshooting

### Common Issues

**Events not displaying:**

- Check authentication status
- Verify API connection in browser console
- Ensure server is running on port 4000

**Event creation fails:**

- Check required fields (subject, startTime, endTime)
- Verify date format (ISO 8601)
- Check user authentication

**Calendar styling issues:**

- Ensure Syncfusion CSS is properly imported
- Check for CSS conflicts
- Verify Syncfusion license registration

### Debug Information

Check browser console for:

- API request/response logs
- Event loading status
- Error messages
- Calendar component status

## 📞 Support

For issues or questions:

1. Check browser console for error messages
2. Verify server logs for API errors
3. Ensure all dependencies are installed
4. Check authentication status
5. Verify database connection

---

**Total Implementation**: 5 new files, 1 updated file, complete MongoDB integration, full CRUD operations, user authentication, and comprehensive error handling.

The calendar system is now fully functional and integrated with your existing authentication system! 🎉
