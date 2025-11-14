# 🚀 Quick Start Guide

## Getting Your Dashboard Running in 5 Minutes!

### Step 1: Install Dependencies

```bash
cd Client
npm install @syncfusion/ej2-react-schedule
```

### Step 2: Get Syncfusion License (Choose One)

**Option A: Community License (Free Forever)**

1. Go to: https://www.syncfusion.com/products/communitylicense
2. Register (free for < $1M revenue)
3. Copy your license key

**Option B: 30-Day Trial**

1. Go to: https://www.syncfusion.com/downloads
2. Sign up for free trial
3. Copy your trial license key

### Step 3: Add License Key

Open `Client/src/main.jsx` and add at the top:

```javascript
import { registerLicense } from "@syncfusion/ej2-base";

// Register Syncfusion license (REQUIRED!)
registerLicense("PASTE-YOUR-LICENSE-KEY-HERE");
```

### Step 4: Import Syncfusion Styles

Add to `Client/src/main.jsx` (after imports):

```javascript
// Syncfusion styles
import "@syncfusion/ej2-base/styles/material.css";
import "@syncfusion/ej2-react-schedule/styles/material.css";
```

### Step 5: Start the Development Server

```bash
npm run dev
```

### Step 6: Navigate to Dashboard

Open your browser and go to:

```
http://localhost:5173/dashboard
```

## 🎯 What You'll See

### Main Dashboard (`/dashboard`)

- 4 stat cards
- Task performance chart
- Recent tasks list
- Mini calendar
- Upcoming events

### Individual Section

- `/dashboard/individual/calendar-tasks` - Your personal Syncfusion calendar
- `/dashboard/individual/ai-assistant` - AI productivity helper

### Group Section

- `/dashboard/group/calendar-tasks` - Team calendar with members
- `/dashboard/group/ai-assistant` - AI task distribution
- `/dashboard/group/admin` - Team management panel

### Other Pages

- `/dashboard/tasks` - Task management with filters
- `/dashboard/calendar` - Placeholder
- `/dashboard/schedule` - Placeholder
- `/dashboard/profile` - Placeholder
- `/dashboard/settings` - Placeholder
- `/dashboard/reports` - Placeholder

## 🐛 Troubleshooting

### Issue: License Error

```
This application was built using a trial version...
```

**Fix**: Make sure you added `registerLicense('YOUR-KEY')` in main.jsx

### Issue: Scheduler Not Showing

**Fix**: Import Syncfusion CSS:

```javascript
import "@syncfusion/ej2-react-schedule/styles/material.css";
```

### Issue: Sidebar Not Working

**Fix**: Make sure you're inside `/dashboard` route

### Issue: Navigation Not Highlighting

**Fix**: Check that you're using exact route paths

## 📱 Test Responsive Design

1. **Desktop**: Resize browser to > 1024px
2. **Tablet**: Resize to 768-1024px (sidebar becomes overlay)
3. **Mobile**: Resize to < 768px (hamburger menu appears)

## 🔗 Connect to Backend

To connect calendars to your existing backend:

```javascript
// In IndividualCalendarTasks.jsx or GroupCalendarTasks.jsx
useEffect(() => {
  fetch("http://localhost:4000/api/v1/calendar/events", {
    credentials: "include",
  })
    .then((res) => res.json())
    .then((events) => {
      const formatted = events.map((e) => ({
        Id: e._id,
        Subject: e.title,
        StartTime: new Date(e.start),
        EndTime: new Date(e.end),
        IsAllDay: e.allDay,
      }));
      setData(formatted);
    });
}, []);
```

## ✅ Verification Checklist

- [ ] Syncfusion license registered
- [ ] No console errors
- [ ] Sidebar navigation works
- [ ] Individual calendar loads
- [ ] Group calendar loads
- [ ] AI assistant chat works
- [ ] Admin panel tabs switch
- [ ] Mobile responsive works

## 🎉 You're Done!

Your dashboard is now fully functional with:

- ✅ 13 routes configured
- ✅ Syncfusion calendars integrated
- ✅ Individual & Group sections
- ✅ AI assistant interfaces
- ✅ Admin panel
- ✅ Responsive design

## 📚 Next Steps

1. **Read**: `SYNCFUSION_SETUP.md` for detailed Syncfusion docs
2. **Read**: `IMPLEMENTATION_SUMMARY.md` for complete feature list
3. **Read**: `dashboard/README.md` for architecture details
4. **Connect**: Hook up your backend APIs
5. **Customize**: Update colors, add features, connect real data

## 💡 Pro Tips

1. **Test with Mock Data First**: All pages have mock data - perfect for testing
2. **Use Browser DevTools**: Check responsive design with device emulator
3. **Check Console**: Look for any import errors or warnings
4. **Customize Theme**: Edit CSS files in `dashboard/styles/` to match your brand
5. **Add Protection**: Wrap dashboard routes with authentication guards

---

**Need Help?** Check the documentation files or the Syncfusion community forum!

**Found a Bug?** Review the code in `dashboard/pages/` - all files are well-commented!

Enjoy your new dashboard! 🚀
