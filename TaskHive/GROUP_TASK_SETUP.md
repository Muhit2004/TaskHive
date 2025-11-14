# 🎯 Group Task Management System - Setup Guide

## 📋 Overview

This system provides **AI-powered task management** for teams using:

- **Syncfusion Kanban Board** for visual task tracking
- **Google Gemini AI** for task suggestions, time predictions, and smart assignment
- **MongoDB** for data storage
- **Real-time collaboration** features

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
# Frontend (Client folder)
cd Client
npm install @syncfusion/ej2-react-kanban axios react-toastify

# Backend (server folder) - Already installed
cd ../server
```

### Step 2: Add Gemini API Key

Add to `server/config.env`:

```env
# Existing environment variables...
GOOGLE_PALM_API_KEY=your_gemini_api_key_here
# OR
GEMINI_API_KEY=your_gemini_api_key_here
```

**Get your API key:** [Google AI Studio](https://makersuite.google.com/app/apikey)

### Step 3: Start Servers

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd Client
npm run dev
```

---

## 📁 File Structure

```
server/
├── models/
│   └── groupModels.js          ✅ NEW - Group, Employee, Task schemas
├── controllers/
│   └── groupController.js      ✅ NEW - All group/task/employee logic
├── routes/
│   └── groupRoutes.js          ✅ NEW - API endpoints
├── utils/
│   └── aiService.js            ✅ NEW - AI integration (Gemini)
└── app.js                      ✅ UPDATED - Added group routes

Client/src/dashboard/
├── pages/group/
│   └── GroupCalendarTasks.jsx  ✅ UPDATED - Full Kanban implementation
└── styles/group/
    └── GroupTasks.css          ✅ NEW - Styling
```

---

## 🔌 API Endpoints

### Base URL: `http://localhost:4000/api/v1/group`

#### 📦 Group Management

| Method | Endpoint           | Description              |
| ------ | ------------------ | ------------------------ |
| POST   | `/group/create`    | Create new group         |
| GET    | `/group/my-groups` | Get all user's groups    |
| GET    | `/group/:id`       | Get single group details |

**Example: Create Group**

```javascript
POST /api/v1/group/group/create
Body: {
  "groupName": "Development Team",
  "groupDescription": "Frontend & Backend developers"
}
```

---

#### 👥 Employee Management

| Method | Endpoint                   | Description                |
| ------ | -------------------------- | -------------------------- |
| POST   | `/employee/add`            | Add employee to group      |
| GET    | `/employee/group/:groupId` | Get all employees in group |
| DELETE | `/employee/:id`            | Remove employee            |

**Example: Add Employee**

```javascript
POST /api/v1/group/employee/add
Body: {
  "empId": "EMP001",
  "empName": "John Doe",
  "empSkills": "React, Node.js, MongoDB",
  "email": "john@example.com",
  "groupId": "673abc123def456..."
}
```

---

#### 📋 Task Management (AI-Powered)

| Method | Endpoint                  | Description                    |
| ------ | ------------------------- | ------------------------------ |
| POST   | `/task/suggest`           | Get AI task suggestions        |
| POST   | `/task/create`            | Create task with AI prediction |
| GET    | `/task/group/:groupId`    | Get all tasks in group         |
| GET    | `/task/employee/:empName` | Get tasks by employee          |
| PUT    | `/task/:id`               | Update task status             |
| DELETE | `/task/:id`               | Delete task                    |

**Example: Get AI Suggestions**

```javascript
POST /api/v1/group/task/suggest
Body: {
  "input": "Fix bug"
}

Response: {
  "success": true,
  "suggestions": "1. Fix login bug\n2. Fix API bug\n3. Fix UI bug..."
}
```

**Example: Create Task with AI**

```javascript
POST /api/v1/group/task/create
Body: {
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication with bcrypt password hashing",
  "groupId": "673abc123def456...",
  "priority": "High",
  "dueDate": "2025-12-31",
  "assignedTo": {  // Optional - AI will assign if omitted
    "empName": "John Doe",
    "empId": "EMP001"
  }
}

Response: {
  "success": true,
  "task": {...},
  "estimatedTime": "4-6 hours",  // AI-generated
  "assignedTo": {  // AI-selected best employee
    "empName": "John Doe",
    "empId": "EMP001"
  }
}
```

**Example: Update Task Status (Drag & Drop)**

```javascript
PUT /api/v1/group/task/673xyz789...
Body: {
  "status": "In Progress"
}
```

---

## 🤖 AI Features

### 1. **Task Auto-Completion**

- Type 3+ characters in task title
- AI suggests 5 related task names
- Click to auto-fill

### 2. **Time Prediction**

- AI analyzes task description
- Predicts completion time (e.g., "2-3 hours")
- Displayed after task creation

### 3. **Smart Assignment**

- If no employee selected, AI chooses the best fit
- Considers:
  - Employee skills
  - Current workload (task count)
  - Availability percentage

**AI Assignment Logic:**

```javascript
Task: "Fix React component bug"
Employees:
- Alice (Skills: React, JavaScript | 80% available | 3 tasks)
- Bob (Skills: Python, Django | 90% available | 2 tasks)

AI Recommendation: Alice ✅ (better skill match)
```

---

## 📊 Syncfusion Kanban Board

### Features

1. **Drag & Drop**: Move tasks between columns
2. **Swimlanes**: Group by assignee
3. **Status Columns**:
   - Open
   - Ready
   - In Progress
   - Review
   - Done

### Card Template

Each task card shows:

- Title
- Description
- Priority (colored)
- Assignee
- Estimated time
- Due date
- Tags

### Customization

Edit `GroupCalendarTasks.jsx`:

```javascript
const kanbanTasks = res.data.tasks.map((task) => ({
  Id: task._id,
  Title: task.title,
  Status: task.status,
  Summary: task.description,
  Priority: task.priority,
  Assignee: task.assignedTo?.empName,
  // Add custom fields here
}));
```

---

## 🎨 Frontend Components

### 1. Task Creation Modal

```javascript
// Open modal
setShowTaskForm(true);

// Features:
// - AI task suggestions
// - Auto-assign or manual assign
// - Priority selection
// - Due date picker
// - Estimated time display
```

### 2. Employee Management Modal

```javascript
// Open modal
setShowEmployeeForm(true);

// Fields:
// - Employee ID
// - Name
// - Skills (comma-separated)
// - Email (optional)
```

### 3. Team Statistics

```javascript
<div className="team-stats">
  <div className="stat-card">
    <h3>Team Members</h3>
    <p className="stat-value">{employees.length}</p>
  </div>
  {/* More stats... */}
</div>
```

---

## 🔐 Authentication

All endpoints require authentication:

```javascript
axios.get(API_URL, {
  withCredentials: true, // Send JWT cookie
});
```

The `isAuthenticated` middleware checks:

- Valid JWT token in cookies
- User exists in database
- Adds `req.user` with user details

---

## 🛠️ Customization

### Change AI Provider

Edit `server/utils/aiService.js`:

```javascript
// Current: Google Gemini
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/...";

// Switch to OpenAI:
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export const getTaskSuggestions = async (inputText) => {
  const response = await axios.post(
    OPENAI_API_URL,
    {
      model: "gpt-4",
      messages: [{ role: "user", content: `Suggest tasks for: ${inputText}` }],
    },
    {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    }
  );
  return response.data.choices[0].message.content;
};
```

### Add New Task Fields

1. **Update Model** (`server/models/groupModels.js`):

```javascript
const taskSchema = new mongoose.Schema({
  // Existing fields...
  department: { type: String, default: "" },
  isUrgent: { type: Boolean, default: false },
});
```

2. **Update Frontend Form**:

```javascript
<div className="form-group">
  <label>Department</label>
  <select value={department} onChange={(e) => setDepartment(e.target.value)}>
    <option>Engineering</option>
    <option>Design</option>
  </select>
</div>
```

3. **Update Controller**:

```javascript
const task = await GroupTask.create({
  // Existing fields...
  department: req.body.department,
  isUrgent: req.body.isUrgent,
});
```

---

## 🐛 Troubleshooting

### Issue: AI not working

**Solution:**

```bash
# Check API key in config.env
GOOGLE_PALM_API_KEY=AIza...

# Restart server
cd server
npm run dev
```

### Issue: Kanban board not displaying

**Solution:**

```bash
# Install Syncfusion Kanban
cd Client
npm install @syncfusion/ej2-react-kanban

# Check import in GroupCalendarTasks.jsx
import { KanbanComponent } from "@syncfusion/ej2-react-kanban";
```

### Issue: "Group not found" error

**Solution:**

```javascript
// Create a group first
POST /api/v1/group/group/create
Body: {
  "groupName": "Test Group",
  "groupDescription": "Test"
}

// Then add employees and tasks
```

### Issue: Tasks not updating

**Solution:**

```javascript
// Check browser console for errors
// Verify withCredentials is set:
axios.put(url, data, { withCredentials: true });

// Check network tab - should see cookies being sent
```

---

## 📚 Additional Resources

- [Syncfusion Kanban Docs](https://ej2.syncfusion.com/react/documentation/kanban/getting-started/)
- [Google Gemini API](https://ai.google.dev/docs)
- [MongoDB Mongoose](https://mongoosejs.com/docs/guide.html)

---

## 🎉 You're All Set!

Your Group Task Management System is now ready with:

- ✅ AI-powered task suggestions
- ✅ Smart employee assignment
- ✅ Time predictions
- ✅ Visual Kanban board
- ✅ Real-time collaboration

**Next Steps:**

1. Create your first group
2. Add team members
3. Create AI-powered tasks
4. Drag & drop to manage workflow!
