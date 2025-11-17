# 🐝 TaskHive - Smart Task Management System

A comprehensive full-stack task management application built with the MERN stack. TaskHive features AI-powered task assistance, calendar integration, group collaboration, individual task tracking, and secure authentication with OTP verification.

---

## ✨ Features

### 🔐 **Authentication & Security**

- Complete user authentication system (Register, Login, Logout)
- OTP verification via **Email** (NodeMailer)
- JWT-based authentication with HTTP-only cookies
- Password encryption using bcrypt
- Forgot Password & Reset Password flows
- Automated cleanup of unverified accounts

### 📊 **Dashboard & Analytics**

- Real-time task statistics and progress tracking
- Interactive charts and visualizations (Recharts)
- Calendar view with Syncfusion Schedule component
- Task completion analytics

### 👥 **Group Management**

- Create and manage teams/groups
- Assign tasks to team members
- Track group task progress
- Employee/member management
- Kanban board for task organization

### 📅 **Calendar Integration**

- Interactive calendar with drag-and-drop
- Schedule tasks with start/end times
- View tasks by day, week, or month
- Integration with Syncfusion EJ2 Calendar components

### 🤖 **AI-Powered Features** (Google Gemini)

- **Smart Task Suggestions**: Get AI-generated task name suggestions
- **Time Prediction**: Estimate task completion time automatically
- **Smart Assignment**: AI recommends the best team member for each task
- **Grammar Check**: Built-in text correction using LanguageTool API

### 🎯 **Individual Task Management**

- Create, edit, and delete personal tasks
- Track task status (To-Do, In Progress, Completed)
- Priority levels and due dates
- Search and filter capabilities
  -and analysis

---

## 🛠️ Tech Stack

### **Frontend**

- **React.js** (v18.3.1) with Vite
- **React Router DOM** (v7.1.0) for navigation
- **Axios** for API calls
- **Recharts** (v3.4.1) for data visualization
- **Syncfusion EJ2 React** components (Schedule)
- **Tailwind CSS** (v4.1.14) for styling
- **React Hook Form** (v7.54.2) for form handling

### **Backend**

- **Node.js** with Express.js (v5.1.0)
- **MongoDB** with Mongoose (v8.18.1)
- **JWT** (jsonwebtoken v9.0.2) for authentication
- **bcrypt** (v6.0.0) for password hashing
- **Cookie-Parser** for JWT cookies
- **CORS** for cross-origin requests

### **Third-Party Services**

- **Google Gemini AI** (v0.21.0) - AI task assistance
- **NodeMailer** (v7.0.6) - Email verification
- **LanguageTool API** - Grammar checking

### **Automation**

- **Node-Cron** (v4.2.1) - Scheduled cleanup tasks

---

## 📦 Installation Guide

### **Prerequisites**

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas)
- **Git** for cloning

### **1. Clone the Repository**

```bash
git clone https://github.com/Muhit2004/TaskHive.git
cd TaskHive
```

### **2. Install Root Dependencies**

```bash
npm install
```

### **3. Install Client Dependencies**

```bash
npm run install:client
# OR manually:
# cd Client && npm install
```

### **4. Install Server Dependencies**

```bash
npm run install:server
# OR manually:
# cd server && npm install
```

---

## 🔑 Environment Configuration

### **Server Configuration**

Create a file named `config.env` in the `server/` directory:

```env
# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database Configuration
MONGO_URL=your_mongodb_connection_string

# Email Service (NodeMailer - Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_SERVICE=gmail
SMTP_PORT=465
SMTP_MAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_specific_password


# JWT Authentication
JWT_EXPIRE=7d
JWT_SECRET_KEY=your_super_secret_random_string
COOKIE_EXPIRE=7

# AI Integration (Google Gemini)
GEMINI_API_KEY=your_google_gemini_api_key
```

---

## 🔧 How to Get API Keys

### **1. MongoDB Connection String**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Click **"Connect"** → **"Drivers"**
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Paste into `MONGO_URL`

**Example:**

```
MONGO_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/MERN_AUTHENTICATION
```

---

### **2. Gmail SMTP (Email Verification)**

1. Go to your [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Search for **"App Passwords"**
4. Create a new app password (name it "TaskHive" or similar)
5. Copy the 16-character password (remove spaces)
6. Use your Gmail address for `SMTP_MAIL`
7. Use the app password for `SMTP_PASSWORD`

**Example:**

```env
SMTP_MAIL=youremail@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop  # Remove spaces in actual config
```

---

---

### **4. Google Gemini AI (AI Features)**

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click **"Get API Key"**
4. Select **"Create API key in new project"**
5. Copy the generated API key
6. Paste into `GEMINI_API_KEY`

**Example:**

```env
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

> **Note:** Free tier includes 15 requests per minute - sufficient for development.

---

### **5. JWT Secret Key (Authentication)**

Generate a secure random string for JWT signing:

**On macOS/Linux:**

```bash
openssl rand -base64 32
```

**On Windows PowerShell:**

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Or use an online generator:** [Random.org](https://www.random.org/strings/)

Paste the result into `JWT_SECRET_KEY`.

**Example:**

```env
JWT_SECRET_KEY=xK9#mP$2vL@8nQ!5rT&3wY*7zF%4bG^6
```

---

## 🚀 Running the Application

### **Development Mode**

#### **Option 1: Run Everything (Recommended)**

Open **two separate terminals**:

**Terminal 1 - Backend:**

```bash
cd server
npm run dev
# Server will run on http://localhost:5000
```

**Terminal 2 - Frontend:**

```bash
cd Client
npm run dev
# Client will run on http://localhost:5173
```

#### **Option 2: Run from Root**

```bash
# Terminal 1
npm run install:server
cd server && npm run dev

# Terminal 2
npm run install:client
cd Client && npm run dev
```

---

### **Production Mode**

#### **Build Frontend:**

```bash
npm run build
# This builds the React app in Client/dist/
```

#### **Deploy Backend:**

```bash
cd server
npm start
# Runs the production server
```

> **For deployment to services like Vercel, Heroku, or AWS:**
>
> - Use the `vercel-build` script in root `package.json`
> - Ensure all environment variables are configured on the platform

---

## 📂 Project Structure

```
TaskHive/
├── Client/                      # Frontend React application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── auth/               # Authentication pages & components
│   │   │   ├── components/     # Login, Register components
│   │   │   ├── pages/          # Auth, OTP, Reset Password pages
│   │   │   └── styles/         # Authentication styling
│   │   ├── dashboard/          # Main dashboard application
│   │   │   ├── components/     # Reusable dashboard components
│   │   │   │   └── layout/     # Header, Sidebar, Layout
│   │   │   ├── pages/          # Dashboard pages
│   │   │   │   ├── group/      # Group management features
│   │   │   │   └── individual/ # Personal task management
│   │   │   └── styles/         # Dashboard styling
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # React entry point
│   ├── package.json            # Frontend dependencies
│   └── vite.config.js          # Vite configuration
│
├── server/                      # Backend Node.js application
│   ├── automation/             # Scheduled tasks (cron jobs)
│   │   └── removeUnverifiedAccounts.js
│   ├── controllers/            # Business logic
│   │   ├── userController.js   # Auth & user management
│   │   ├── calendarController.js # Calendar operations
│   │   ├── groupController.js   # Group & team management
│   │   ├── dashboardController.js # Dashboard data
│   │   └── aiChatController.js  # AI features
│   ├── database/
│   │   └── dbConnection.js     # MongoDB connection
│   ├── middlewares/            # Express middlewares
│   │   ├── auth.js             # JWT verification
│   │   ├── error.js            # Error handling
│   │   └── catchAsyncError.js  # Async wrapper
│   ├── models/                 # Mongoose schemas
│   │   ├── userModels.js       # User schema
│   │   ├── calendarModels.js   # Calendar event schema
│   │   └── groupModels.js      # Group & task schemas
│   ├── routes/                 # API route definitions
│   │   ├── userRoutes.js
│   │   ├── calendarRoutes.js
│   │   ├── groupRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── aiRoutes.js
│   ├── utils/                  # Helper utilities
│   │   ├── sendEmail.js        # NodeMailer email service
│   │   ├── sendToken.js        # JWT token generator
│   │   └── aiService.js        # Gemini AI integration
│   ├── app.js                  # Express app configuration
│   ├── server.js               # Server entry point
│   ├── config.env              # Environment variables (create this!)
│   └── package.json            # Backend dependencies
│
├── package.json                # Root dependencies & scripts
├── vercel.json                 # Vercel deployment config
└── README.md                   # This file
```

---

## 🔌 API Endpoints

### **Authentication**

- `POST /api/v1/user/register` - Register new user
- `POST /api/v1/user/verify-otp` - Verify OTP code
- `POST /api/v1/user/resend-otp` - Resend OTP
- `POST /api/v1/user/login` - User login
- `POST /api/v1/user/logout` - User logout
- `POST /api/v1/user/forgot-password` - Request password reset
- `POST /api/v1/user/reset-password/:token` - Reset password
- `GET /api/v1/user/myProfile` - Get current user profile

### **Calendar**

- `GET /api/v1/calendar/events` - Get all calendar events
- `POST /api/v1/calendar/events` - Create new event
- `PUT /api/v1/calendar/events/:id` - Update event
- `DELETE /api/v1/calendar/events/:id` - Delete event

### **Group Management**

- `POST /api/v1/group/create` - Create new group
- `POST /api/v1/group/task/create` - Create group task
- `PUT /api/v1/group/task/update/:id` - Update task
- `DELETE /api/v1/group/task/delete/:id` - Delete task
- `POST /api/v1/group/employee/add` - Add team member
- `DELETE /api/v1/group/employee/remove/:id` - Remove member

### **AI Features**

- `POST /api/v1/ai/suggestions` - Get AI task suggestions
- `POST /api/v1/ai/predict-time` - Predict task completion time
- `POST /api/v1/ai/recommend-employee` - Get AI employee recommendation
- `POST /api/v1/ai/check-grammar` - Check text grammar

### **Dashboard**

- `GET /api/v1/dashboard/stats` - Get task statistics
- `GET /api/v1/dashboard/analytics` - Get analytics data

---

## 🎨 Key Features Explained

### **OTP Verification System**

Users can choose between **Email** or **SMS** verification during registration:

- **Email**: 6-digit code sent via Gmail SMTP

- OTP expires after 10 minutes
- Maximum 3 registration attempts per email/phone

### **AI-Powered Task Management**

- **Auto-Suggestions**: Type a few words, get 5 related task suggestions
- **Time Estimation**: AI analyzes task title & description to predict completion time
- **Smart Assignment**: AI recommends the best team member based on current workload
- **Caching**: 5-minute cache for suggestions to reduce API calls

### **Automated Account Cleanup**

- Cron job runs daily at midnight
- Removes unverified accounts older than 24 hours
- Prevents database clutter from abandoned registrations

### **Security Features**

- JWT tokens stored in HTTP-only cookies (prevents XSS attacks)
- Passwords hashed with bcrypt (never stored in plain text)
- CORS configured to only allow frontend origin
- Rate limiting on OTP requests

---

## 🐛 Troubleshooting

### **"Database connection failed"**

- Verify `MONGO_URL` in `config.env`
- Check if your IP is whitelisted in MongoDB Atlas (Network Access)
- Ensure database user has correct password

### **"Email not sending"**

- Verify Gmail 2-Step Verification is enabled
- Use App Password, not your regular Gmail password
- Check `SMTP_MAIL` and `SMTP_PASSWORD` in config.env

### **"AI features not working"**

- Verify `GEMINI_API_KEY` is correct
- Check API quota (free tier: 15 requests/minute)
- Review server logs for specific API errors

### **"Build fails on Vercel"**

- Ensure all environment variables are set in Vercel dashboard
- Check `vercel.json` configuration
- Verify `lightningcss` is in `Client/package.json` devDependencies

### **"Port already in use"**

- Change `PORT` in `config.env` (e.g., 5000 → 5001)
- Or kill the process using the port:

  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F

  # macOS/Linux
  lsof -ti:5000 | xargs kill -9
  ```

## 🙏 Acknowledgments

- **Syncfusion** for EJ2 React components
- **Google Gemini** for AI capabilities
- **NodeMailer** for email functionality
- **MongoDB** for database hosting

**Happy Task Managing! 🐝✨**
