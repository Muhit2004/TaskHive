# 🔧 Troubleshooting Guide - Dashboard Not Showing

## Issue: "I can't see the dashboard even though it's running"

### ✅ Quick Checklist

1. **Is the server running?**

   - Check terminal shows: `npm run dev`
   - Look for: `Local: http://localhost:5173/` (or similar port)

2. **Are you accessing the correct URL?**

   ```
   ✅ Correct: http://localhost:5173/dashboard
   ❌ Wrong:   http://localhost:5173/
   ❌ Wrong:   http://localhost:5173/Dashboard (capital D)
   ```

3. **Is Syncfusion license registered?**
   - Open browser console (F12)
   - Look for Syncfusion license warnings
   - **Fix**: Add license key in `main.jsx` (see below)

---

## 🚨 Most Common Issues

### Issue 1: Syncfusion License Warning

**Symptom**: Calendar pages are blank or show trial message

**Error in Console**:

```
This application was built using a trial version of Syncfusion Essential Studio...
```

**Solution**:

1. Get FREE license: https://www.syncfusion.com/products/communitylicense
2. Open `Client/src/main.jsx`
3. Replace `'YOUR-LICENSE-KEY-HERE'` with your actual key:

```javascript
registerLicense(
  "Ngo9BigBOggjHTQxAR8/V1NDaF5cWWtCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdnWH9ed3VVQ2BYV0N1W0E="
);
```

---

### Issue 2: Wrong URL

**Symptom**: See the home/auth page instead of dashboard

**Problem**: You're going to `http://localhost:5173/` instead of `/dashboard`

**Solution**:

```
Type this URL in browser: http://localhost:5173/dashboard
```

**Quick Test**:

- `/` → Shows Home/Auth page ✅
- `/dashboard` → Shows Dashboard with sidebar ✅
- `/dashboard/individual/calendar-tasks` → Shows calendar ✅

---

### Issue 3: React Router Not Working

**Symptom**: Blank page or "Cannot GET /dashboard"

**Check App.jsx routes**:

```javascript
// Should have this structure:
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<Dashboard />} />
  {/* ... more routes */}
</Route>
```

**Solution**: Your App.jsx is correct ✅ (already checked)

---

### Issue 4: CSS Not Loading

**Symptom**: Dashboard shows but looks broken/unstyled

**Check browser console** for CSS errors:

```
Failed to load module CSS: ...
```

**Solution**: Check Syncfusion styles are imported in `main.jsx`:

```javascript
import "../node_modules/@syncfusion/ej2-react-schedule/styles/material.css";
```

**Your file**: Already has this ✅

---

### Issue 5: Component Import Errors

**Symptom**: White screen, console shows module errors

**Common Error**:

```
Failed to resolve import "...DashboardLayout" from "App.jsx"
```

**Solution**: Check file exists at correct path:

```
Client/src/dashboard/components/layout/DashboardLayout.jsx
```

**Your files**: All exist ✅ (already created)

---

## 🔍 Step-by-Step Debugging

### Step 1: Check Terminal

```bash
# Terminal should show:
VITE v6.0.3  ready in 234 ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 2: Open Browser Console (F12)

**Good (No errors)**:

```
[No errors or warnings]
```

**Bad (License issue)**:

```
This application was built using a trial version...
```

→ **Fix**: Add Syncfusion license key

**Bad (Import error)**:

```
Failed to load module...
```

→ **Fix**: Check file paths

### Step 3: Test Navigation

Try these URLs in order:

1. `http://localhost:5173/`

   - **Expected**: Home page with auth buttons

2. `http://localhost:5173/dashboard`

   - **Expected**: Dashboard overview with sidebar, stats, charts

3. `http://localhost:5173/dashboard/individual/calendar-tasks`

   - **Expected**: Syncfusion calendar (if license is registered)

4. `http://localhost:5173/dashboard/tasks`
   - **Expected**: Task management page with filters

### Step 4: Check Network Tab

1. Open DevTools (F12) → Network tab
2. Refresh page
3. Look for **red/failed** requests
4. Common failures:
   - CSS files not found → Check imports
   - API calls failing → Backend not running
   - 404 errors → Check routes

---

## 🎯 Quick Fixes

### Fix 1: Get License Key (5 minutes)

```bash
# 1. Go to: https://www.syncfusion.com/products/communitylicense
# 2. Sign up (free for < $1M revenue)
# 3. Copy your license key
# 4. Open: Client/src/main.jsx
# 5. Replace: registerLicense('YOUR-LICENSE-KEY-HERE');
#    With:    registerLicense('your-actual-key-here');
# 6. Save and refresh browser
```

### Fix 2: Restart Dev Server

```bash
# In Client directory:
Ctrl+C  (stop server)
npm run dev  (restart)
```

### Fix 3: Clear Browser Cache

```
Chrome/Edge: Ctrl+Shift+Del
Firefox: Ctrl+Shift+Del
```

### Fix 4: Check Backend is Running

```bash
# In server directory terminal:
cd server
npm start
# Should show: Server running on port 4000
```

---

## 📸 What You Should See

### 1. Main Dashboard (`/dashboard`)

```
┌─────────────────────────────────────────────┐
│ [Sidebar]  │  Dashboard Overview           │
│            │  ┌──┐ ┌──┐ ┌──┐ ┌──┐          │
│ Dashboard  │  │📊│ │✓ │ │⏱ │ │📅│          │
│ Calendar   │  └──┘ └──┘ └──┘ └──┘          │
│ Tasks      │  [Chart] [Tasks] [Calendar]   │
└─────────────────────────────────────────────┘
```

### 2. Individual Calendar (`/dashboard/individual/calendar-tasks`)

```
┌─────────────────────────────────────────────┐
│ [Sidebar]  │  My Calendar & Tasks          │
│            │  ┌──────────────────────────┐ │
│ Individual │  │ November 2025            │ │
│ ├ Calendar │  │ Mo Tu We Th Fr Sa Su    │ │
│ └ AI       │  │  1  2  3  4  5  6  7   │ │
│            │  │  8  9 10 11 12 13 14   │ │
└─────────────────────────────────────────────┘
```

### 3. Group Calendar (`/dashboard/group/calendar-tasks`)

```
┌─────────────────────────────────────────────┐
│ [Sidebar]  │  Team Calendar & Tasks        │
│            │  [Calendar] [Members: 3]      │
│ Group      │  ┌──────────┐  ┌──────────┐  │
│ ├ Calendar │  │ Schedule │  │ John Doe │  │
│ ├ AI       │  │   View   │  │Jane Smith│  │
│ └ Admin    │  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
```

---

## 🆘 Still Not Working?

### Checklist:

- [ ] Server running (`npm run dev` in Client folder)
- [ ] Going to `http://localhost:5173/dashboard` (not just `/`)
- [ ] Syncfusion license key added to `main.jsx`
- [ ] Browser console shows no errors (F12)
- [ ] All dependencies installed (`npm install`)

### Get Specific Help:

**Share this info:**

1. What URL are you accessing?
2. What do you see? (blank page, error, home page?)
3. Browser console errors (F12 → Console tab)
4. Terminal output

**Test Command:**

```bash
# Run this in Client folder:
npm list @syncfusion/ej2-react-schedule

# Should show:
# @syncfusion/ej2-react-schedule@31.1.21
```

---

## 💡 Pro Tips

1. **Use React DevTools**: Install React DevTools extension to inspect components
2. **Check Routes**: Type URLs manually to test each route
3. **Console Warnings**: Red errors are critical, yellow warnings are okay
4. **Hot Reload**: Vite auto-reloads when you save files
5. **Port Conflicts**: If 5173 is taken, Vite will use 5174, 5175, etc.

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ No red errors in console
2. ✅ Sidebar visible on left side
3. ✅ Can click sidebar links and pages change
4. ✅ Syncfusion calendar renders (if license key added)
5. ✅ URL changes when clicking navigation
6. ✅ Responsive: sidebar toggles on mobile

---

**Most Common Solution**: 90% of "can't see dashboard" issues are because you need to navigate to `/dashboard` in the URL bar, not just `/`!

Try this right now: `http://localhost:5173/dashboard`
