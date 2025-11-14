import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  MdCalendarToday,
  MdTask,
  MdCheckCircle,
  MdGroup,
  MdDonutLarge,
  MdBarChart,
  MdErrorOutline,
} from "react-icons/md";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Context } from "../../main";
import { toast } from "react-toastify";

import "../styles/dashboard/Dashboard.css";

const API_BASE_URL = "http://localhost:4000/api/v1";

// --- Helper Component for Stat Cards ---
const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card" style={{ borderLeftColor: color }}>
    <div className="stat-card-icon" style={{ backgroundColor: color }}>
      {icon}
    </div>
    <div className="stat-card-info">
      <span className="stat-card-value">{value}</span>
      <span className="stat-card-label">{label}</span>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useContext(Context);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- State for dashboard data ---
  const [summary, setSummary] = useState({
    totalTasks: 0,
    scheduledCount: 0,
    completedCount: 0,
    tasksDueToday: 0,
    completedThisWeek: 0,
    groupTasksPending: 0,
  });
  const [agenda, setAgenda] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [taskStatusData, setTaskStatusData] = useState([]);
  const [taskPriorityData, setTaskPriorityData] = useState([]);

  // --- useEffect to fetch data ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/dashboard/stats`, {
          withCredentials: true,
        });
        const { data } = res;

        console.log("Dashboard API Response:", data);

        // Set stats with fallback to prevent undefined errors
        setSummary(
          data.stats || {
            totalTasks: 0,
            scheduledCount: 0,
            completedCount: 0,
            tasksDueToday: 0,
            completedThisWeek: 0,
            groupTasksPending: 0,
          }
        );
        setAgenda(data.agenda || []);
        setUpcoming(
          (data.upcoming || []).map((item) => ({
            ...item,
            dueDate: new Date(item.dueDate),
          }))
        );
        setTaskStatusData(data.taskStatusData || []);
        setTaskPriorityData(data.taskPriorityData || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        console.error("Error response:", err.response?.data);
        setError("Failed to load dashboard data. Please try again later.");
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return <div className="dashboard-loading">Loading Dashboard...</div>;
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <MdErrorOutline />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name || "User"}!</h1>
        <p>Here's a summary of your tasks and events.</p>
      </div>

      {/* --- Quick Stats Section --- */}
      <div className="stats-grid">
        <StatCard
          icon={<MdTask />}
          label="Total Events"
          value={summary.totalTasks}
          color="#4318FF"
        />
        <StatCard
          icon={<MdCalendarToday />}
          label="Scheduled"
          value={summary.scheduledCount}
          color="#00B2FF"
        />
        <StatCard
          icon={<MdCheckCircle />}
          label="Completed"
          value={summary.completedCount}
          color="#05CD99"
        />
        <StatCard
          icon={<MdGroup />}
          label="Pending Group Tasks"
          value={summary.groupTasksPending}
          color="#FF7A00"
        />
      </div>

      <div className="dashboard-main-grid">
        {/* Left Column */}
        <div className="dashboard-col-left">
          {/* Today's Agenda */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Today's Agenda</h3>
              <Link
                to="/dashboard/individual/calendar-tasks"
                className="view-all">
                View Calendar
              </Link>
            </div>
            <div className="agenda-list">
              {agenda.length > 0 ? (
                agenda.map((item) => (
                  <div key={item.id} className="agenda-item">
                    <div className={`agenda-icon ${item.type}`}>
                      {item.type === "task" ? <MdTask /> : <MdCalendarToday />}
                    </div>
                    <div className="agenda-details">
                      <h4>{item.title}</h4>
                      <span>
                        {item.time} {item.group && `• ${item.group}`}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state-text">
                  No items on your agenda for today.
                </p>
              )}
            </div>
          </div>

          {/* Upcoming This Week */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Upcoming This Week</h3>
            </div>
            <div className="upcoming-list">
              {upcoming.length > 0 ? (
                upcoming.map((item) => (
                  <div key={item.id} className="upcoming-item">
                    <h4>{item.title}</h4>
                    <span>Due: {item.dueDate.toLocaleDateString()}</span>
                  </div>
                ))
              ) : (
                <p className="empty-state-text">
                  No upcoming deadlines this week.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-col-right">
          {/* Task Status Chart */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>
                <MdDonutLarge /> Task Status
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={taskStatusData.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name">
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Task Priority Chart */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>
                <MdBarChart /> Task Priorities
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={taskPriorityData.filter((d) => d.value > 0)}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={60}
                  stroke="#A3AED0"
                />
                <Tooltip />
                <Bar dataKey="value" barSize={20}>
                  {taskPriorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
