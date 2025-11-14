# Syncfusion Scheduler Setup Guide

## 📦 Installation

```bash
# Navigate to Client directory
cd Client

# Install Syncfusion Scheduler package
npm install @syncfusion/ej2-react-schedule

# Install dependencies (if needed)
npm install @syncfusion/ej2-base @syncfusion/ej2-data @syncfusion/ej2-schedule
```

## 🔑 License Registration

Syncfusion requires a license key for production use. You have three options:

### Option 1: Community License (Free)

- Visit: https://www.syncfusion.com/products/communitylicense
- Eligibility: Free for individuals and small businesses with less than $1 million USD in annual gross revenue
- Register and get your license key

### Option 2: Trial License (30 days)

- Visit: https://www.syncfusion.com/downloads
- Sign up for a free trial
- Get a 30-day trial license key

### Option 3: Paid License

- Visit: https://www.syncfusion.com/sales/products
- Purchase a license for commercial use

## 🔧 License Configuration

After obtaining your license key, add it to your application:

### Method 1: In main.jsx (Recommended)

```javascript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Context } from "./main.jsx";
import { registerLicense } from "@syncfusion/ej2-base";

// Register Syncfusion license
registerLicense("YOUR-LICENSE-KEY-HERE");

const contextValue = {
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  user: null,
  setUser: () => {},
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Context.Provider value={contextValue}>
      <App />
    </Context.Provider>
  </React.StrictMode>
);
```

### Method 2: In App.jsx

```javascript
import { registerLicense } from "@syncfusion/ej2-base";

// Register license at the top of App.jsx
registerLicense("YOUR-LICENSE-KEY-HERE");

const App = () => {
  // ... rest of your code
};
```

## 🎨 Import Required CSS

Add Syncfusion styles to your main CSS or import in components:

### Method 1: In main.jsx or index.css

```javascript
// In main.jsx
import "@syncfusion/ej2-base/styles/material.css";
import "@syncfusion/ej2-buttons/styles/material.css";
import "@syncfusion/ej2-calendars/styles/material.css";
import "@syncfusion/ej2-dropdowns/styles/material.css";
import "@syncfusion/ej2-inputs/styles/material.css";
import "@syncfusion/ej2-lists/styles/material.css";
import "@syncfusion/ej2-navigations/styles/material.css";
import "@syncfusion/ej2-popups/styles/material.css";
import "@syncfusion/ej2-splitbuttons/styles/material.css";
import "@syncfusion/ej2-react-schedule/styles/material.css";
```

### Method 2: CDN (Alternative)

```html
<!-- Add to index.html -->
<link href="https://cdn.syncfusion.com/ej2/material.css" rel="stylesheet" />
```

## 🚀 Usage Examples

### Individual Calendar Page

The `IndividualCalendarTasks.jsx` uses Syncfusion Scheduler:

```javascript
import {
  ScheduleComponent,
  Day,
  Week,
  WorkWeek,
  Month,
  Agenda,
  Inject,
} from "@syncfusion/ej2-react-schedule";

<ScheduleComponent
  height="650px"
  selectedDate={new Date()}
  eventSettings={{ dataSource: data }}
  currentView="Month">
  <Inject services={[Day, Week, WorkWeek, Month, Agenda]} />
</ScheduleComponent>;
```

### Group Calendar Page

The `GroupCalendarTasks.jsx` also uses Syncfusion Scheduler for team collaboration:

```javascript
<ScheduleComponent
  height="600px"
  selectedDate={new Date()}
  eventSettings={{ dataSource: data }}
  currentView="Week">
  <Inject services={[Day, Week, WorkWeek, Month, Agenda]} />
</ScheduleComponent>
```

## 🎯 Features Available

### Views

- **Day**: Single day view
- **Week**: Full week view (7 days)
- **WorkWeek**: Business week view (5 days)
- **Month**: Monthly calendar view
- **Agenda**: List view of events

### Event Management

- Create events by clicking on time slots
- Edit events by clicking on existing events
- Drag and drop to reschedule
- Resize events to change duration
- Delete events

### Customization

- Custom event templates
- Color-coded events
- Recurring events
- All-day events
- Time zones
- Resource scheduling

## 🔗 API Integration

To connect with your backend, modify the event data source:

```javascript
const [data, setData] = useState([]);

useEffect(() => {
  // Fetch events from your API
  fetch("http://localhost:4000/api/v1/calendar/events", {
    credentials: "include",
  })
    .then((res) => res.json())
    .then((events) => {
      // Transform backend data to Syncfusion format
      const formattedEvents = events.map((event) => ({
        Id: event._id,
        Subject: event.title,
        StartTime: new Date(event.start),
        EndTime: new Date(event.end),
        IsAllDay: event.allDay || false,
        CategoryColor: event.color || "#4318FF",
      }));
      setData(formattedEvents);
    });
}, []);
```

## 📚 Documentation

- **Official Docs**: https://ej2.syncfusion.com/react/documentation/schedule/getting-started/
- **API Reference**: https://ej2.syncfusion.com/react/documentation/api/schedule/
- **Demos**: https://ej2.syncfusion.com/react/demos/#/material/schedule/overview
- **Community Forum**: https://www.syncfusion.com/forums/react

## 🐛 Troubleshooting

### License Error

```
This application was built using a trial version of Syncfusion Essential Studio...
```

**Solution**: Add your license key using `registerLicense()` as shown above.

### Styles Not Loading

**Solution**: Import Syncfusion CSS files in your main.jsx or index.css

### Events Not Showing

**Solution**: Check that your data format matches Syncfusion's requirements:

```javascript
{
  Id: 1,                              // Required: unique identifier
  Subject: 'Event Title',             // Required: event name
  StartTime: new Date(),              // Required: start date/time
  EndTime: new Date(),                // Required: end date/time
  IsAllDay: false                     // Optional: all-day event flag
}
```

## 🔄 Alternative: React Big Calendar

If you prefer a free, open-source alternative to Syncfusion, consider React Big Calendar:

```bash
npm install react-big-calendar moment
```

However, Syncfusion offers more features and better customization out of the box.

---

For more help, visit the Syncfusion documentation or contact their support team.
