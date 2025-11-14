# 🗺️ Dashboard URL Guide - Where to Go

## 📍 Complete URL Map

```
http://localhost:5173/
├── /                                    → Home/Auth Page ✅
├── /Auth                                → Login/Register ✅
├── /calendar                            → Old Calendar View ✅
│
└── /dashboard                           → DASHBOARD STARTS HERE! 🎯
    ├── (index)                          → Main Dashboard Overview
    │   └── Shows: Stats, Charts, Tasks, Events
    │
    ├── /calendar                        → Full Calendar (Placeholder)
    ├── /tasks                           → Task Management Page
    ├── /schedule                        → Schedule (Placeholder)
    │
    ├── /individual                      → PERSONAL SECTION
    │   ├── /calendar-tasks              → Personal Syncfusion Calendar 📅
    │   └── /ai-assistant                → Personal AI Helper 🤖
    │
    ├── /group                           → TEAM SECTION
    │   ├── /calendar-tasks              → Team Syncfusion Calendar 👥
    │   ├── /ai-assistant                → AI Task Distribution 🤖
    │   └── /admin                       → Team Admin Panel ⚙️
    │
    └── /account
        ├── /profile                     → User Profile (Placeholder)
        ├── /reports                     → Analytics (Placeholder)
        └── /settings                    → Settings (Placeholder)
```

---

## 🎯 Copy-Paste These URLs

### Main Dashboard

```
http://localhost:5173/dashboard
```

**What you'll see**: Stats cards, task chart, mini calendar, recent activity

---

### Individual Section (Your Personal Workspace)

**Personal Calendar with Syncfusion:**

```
http://localhost:5173/dashboard/individual/calendar-tasks
```

**What you'll see**: Full Syncfusion scheduler for your personal events

**AI Assistant:**

```
http://localhost:5173/dashboard/individual/ai-assistant
```

**What you'll see**: Chat interface with AI productivity helper

---

### Group Section (Team Collaboration)

**Team Calendar:**

```
http://localhost:5173/dashboard/group/calendar-tasks
```

**What you'll see**: Team calendar with member list and invite button

**AI Task Distribution:**

```
http://localhost:5173/dashboard/group/ai-assistant
```

**What you'll see**: AI-powered workload distribution and insights

**Admin Panel:**

```
http://localhost:5173/dashboard/group/admin
```

**What you'll see**: Member management, permissions, settings tabs

---

### Other Pages

**Task Management:**

```
http://localhost:5173/dashboard/tasks
```

**What you'll see**: Task cards with filters (All/Pending/In Progress/Completed)

**Calendar Page (Placeholder):**

```
http://localhost:5173/dashboard/calendar
```

**What you'll see**: "Coming Soon" message

**Schedule Page (Placeholder):**

```
http://localhost:5173/dashboard/schedule
```

**Profile Page (Placeholder):**

```
http://localhost:5173/dashboard/profile
```

**Reports Page (Placeholder):**

```
http://localhost:5173/dashboard/reports
```

**Settings Page (Placeholder):**

```
http://localhost:5173/dashboard/settings
```

---

## 🚫 Common Mistakes

### ❌ Wrong URLs (These Won't Work)

```
http://localhost:5173/Dashboard          # Capital D - won't work
http://localhost:5173/dashboard/         # Trailing slash might cause issues
http://localhost:5173/individual         # Missing /dashboard prefix
http://localhost:5173/group              # Missing /dashboard prefix
```

### ✅ Correct URLs

```
http://localhost:5173/dashboard          # Lowercase, no trailing slash
http://localhost:5173/dashboard/individual/calendar-tasks
http://localhost:5173/dashboard/group/calendar-tasks
```

---

## 🧭 Navigation Flow

### Start Here:

```
1. Open: http://localhost:5173/dashboard
   ↓
2. See sidebar on left with menu items
   ↓
3. Click any menu item
   ↓
4. URL changes and content updates
```

### Example Navigation:

```
Click "My Calendar & Tasks" in sidebar
   ↓
URL becomes: /dashboard/individual/calendar-tasks
   ↓
Syncfusion calendar appears
```

---

## 📱 Testing Different Routes

### Quick Test Script

Open these URLs one by one and check what you see:

1. **Main Dashboard**

   ```
   http://localhost:5173/dashboard
   ```

   ✅ Expected: Stats cards, charts, sidebar

2. **Personal Calendar**

   ```
   http://localhost:5173/dashboard/individual/calendar-tasks
   ```

   ✅ Expected: Syncfusion scheduler

3. **Team Calendar**

   ```
   http://localhost:5173/dashboard/group/calendar-tasks
   ```

   ✅ Expected: Team calendar with members

4. **Task Management**

   ```
   http://localhost:5173/dashboard/tasks
   ```

   ✅ Expected: Task cards with filters

5. **AI Assistant**
   ```
   http://localhost:5173/dashboard/individual/ai-assistant
   ```
   ✅ Expected: Chat interface

---

## 🔍 How to Know What Page You're On

### Check URL Bar:

```
/dashboard                           → Main Dashboard
/dashboard/individual/calendar-tasks → Personal Calendar
/dashboard/group/admin              → Admin Panel
```

### Check Sidebar:

- Active link is **highlighted in purple**
- Inactive links are gray

### Check Page Header:

- Each page has a title at the top
- "Dashboard Overview"
- "My Calendar & Tasks"
- "Team Calendar & Tasks"
- etc.

---

## 💡 Quick Access Links

Create browser bookmarks:

**Development Bookmarks:**

```
Main Dashboard         → http://localhost:5173/dashboard
Personal Calendar      → http://localhost:5173/dashboard/individual/calendar-tasks
Team Calendar          → http://localhost:5173/dashboard/group/calendar-tasks
Task Management        → http://localhost:5173/dashboard/tasks
AI Assistant          → http://localhost:5173/dashboard/individual/ai-assistant
Admin Panel           → http://localhost:5173/dashboard/group/admin
```

---

## 🎨 Visual Guide

### When You Type: `http://localhost:5173/`

```
┌────────────────────────────────┐
│  Home Page - Authentication    │
│  [Login] [Register]            │
│  ↓                             │
│  After login → redirect to     │
│  /dashboard                    │
└────────────────────────────────┘
```

### When You Type: `http://localhost:5173/dashboard`

```
┌─────────────────────────────────────────────┐
│ [Sidebar]     Dashboard Overview            │
│ Dashboard  ┌──┐ ┌──┐ ┌──┐ ┌──┐             │
│ Calendar   │📊│ │✓ │ │⏱ │ │📅│             │
│ Tasks      └──┘ └──┘ └──┘ └──┘             │
│ Schedule   [Chart] [Tasks] [Calendar]       │
│            [Recent Activity]                │
│ Individual                                  │
│ ├ Calendar ← Click to go to:              │
│ └ AI         /dashboard/individual/...     │
│                                            │
│ Group                                      │
│ ├ Calendar ← Click to go to:              │
│ ├ AI         /dashboard/group/...         │
│ └ Admin                                    │
└─────────────────────────────────────────────┘
```

### When You Type: `http://localhost:5173/dashboard/individual/calendar-tasks`

```
┌─────────────────────────────────────────────┐
│ [Sidebar]     My Calendar & Tasks           │
│            ┌────────────────────────────┐   │
│ Individual │   November 2025            │   │
│ ├ Calendar │   ┌─┬─┬─┬─┬─┬─┬─┐         │   │
│ └ AI       │   │M│T│W│T│F│S│S│         │   │
│            │   ├─┼─┼─┼─┼─┼─┼─┤         │   │
│            │   │ │ │ │ │1│2│3│         │   │
│            │   └─┴─┴─┴─┴─┴─┴─┘         │   │
│            │   [Events listed below]    │   │
│            └────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## ⚡ Keyboard Shortcuts (Future Enhancement)

These could be added later:

```
Ctrl+Shift+D  → Go to Dashboard
Ctrl+Shift+T  → Go to Tasks
Ctrl+Shift+C  → Go to Calendar
```

---

## 📝 Developer Notes

### Route Structure in Code:

```javascript
// In App.jsx:
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<Dashboard />} />                    // /dashboard
  <Route path="calendar" element={<CalendarPage />} />       // /dashboard/calendar
  <Route path="individual">
    <Route path="calendar-tasks" ... />                      // /dashboard/individual/calendar-tasks
  </Route>
</Route>
```

### How Nested Routes Work:

1. `/dashboard` → Renders `<DashboardLayout />`
2. DashboardLayout has `<Outlet />` component
3. Child routes render inside the `<Outlet />`
4. Sidebar stays visible, content area changes

---

## ✅ Checklist: Am I On The Right Page?

**Main Dashboard:**

- [ ] URL: `/dashboard`
- [ ] See: 4 stat cards at top
- [ ] See: Chart with bars
- [ ] See: Mini calendar widget
- [ ] See: Sidebar on left

**Personal Calendar:**

- [ ] URL: `/dashboard/individual/calendar-tasks`
- [ ] See: "My Calendar & Tasks" header
- [ ] See: Syncfusion calendar/scheduler
- [ ] See: Month/Week/Day view buttons

**Team Calendar:**

- [ ] URL: `/dashboard/group/calendar-tasks`
- [ ] See: "Team Calendar & Tasks" header
- [ ] See: Member list on right side
- [ ] See: "Invite Member" button
- [ ] See: Syncfusion calendar

**Task Management:**

- [ ] URL: `/dashboard/tasks`
- [ ] See: "Tasks" header
- [ ] See: Filter buttons (All/Pending/In Progress/Completed)
- [ ] See: Task cards in grid
- [ ] See: Search box

---

## 🎉 You're Ready!

Now you know:

- ✅ Where each page is located
- ✅ What URLs to use
- ✅ How to navigate between pages
- ✅ What each page should look like

**Start here**: `http://localhost:5173/dashboard`

Then explore the sidebar menu to discover all features!
