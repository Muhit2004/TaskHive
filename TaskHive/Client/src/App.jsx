import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./auth/pages/Home";
import Auth from "./auth/pages/Auth";
import ForgotPassword from "./auth/pages/ForgotPassword";
import ResetPassword from "./auth/pages/ResetPassword";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { Context } from "./main";
import OtpVerification from "./auth/pages/OtpVerification";

// Dashboard imports
import DashboardLayout from "./dashboard/components/layout/DashboardLayout";
import Dashboard from "./dashboard/pages/Dashboard";

// Individual section
import IndividualCalendarTasks from "./dashboard/pages/individual/IndividualCalendarTasks";
import IndividualAIAssistant from "./dashboard/pages/individual/IndividualAIAssistant";

// Group section
import GroupCalendarTasks from "./dashboard/pages/group/GroupCalendarTasks.tsx";
import GroupAIAssistant from "./dashboard/pages/group/GroupAIAssistant";
import GroupAdmin from "./dashboard/pages/group/GroupAdmin";

import { useContext, useEffect } from "react";

const App = () => {
  const { setIsAuthenticated, setUser } = useContext(Context);

  useEffect(() => {
    const getUser = async () => {
      await axios
        .get("http://localhost:4000/api/v1/user/me", {
          withCredentials: true,
        })
        .then((res) => {
          setIsAuthenticated(true);
          setUser(res.data.user);
        })
        .catch((err) => {
          setIsAuthenticated(false);
          setUser(null);
          console.log(err);
        });
    };
    getUser();
  }, []);

  return (
    <>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/Auth" element={<Auth />} />
          <Route
            path="/otp-verification/:email/:phone"
            element={<OtpVerification />}
          />
          <Route path="/password/forgot" element={<ForgotPassword />} />
          <Route path="/password/reset/:token" element={<ResetPassword />} />

          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            {/* Main Section */}
            <Route index element={<Dashboard />} />

            {/* Individual Section */}
            <Route path="individual">
              <Route
                path="calendar-tasks"
                element={<IndividualCalendarTasks />}
              />
              <Route path="ai-assistant" element={<IndividualAIAssistant />} />
            </Route>

            {/* Group Section */}
            <Route path="group">
              <Route path="calendar-tasks" element={<GroupCalendarTasks />} />
              <Route path="ai-assistant" element={<GroupAIAssistant />} />
              <Route path="admin" element={<GroupAdmin />} />
            </Route>

            {/* Account Section */}
          </Route>
        </Routes>

        <ToastContainer theme="colored" />
      </Router>
    </>
  );
};

export default App;
