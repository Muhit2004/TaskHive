import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "../../styles/dashboard/Dashboard.css";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onClose={() => setSidebarOpen(false)}
      />

      <div
        className={`main-content ${
          sidebarOpen && !isMobile ? "sidebar-open" : "sidebar-closed"
        }`}>
        <Header onMenuClick={toggleSidebar} />

        <main className="dashboard-main">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
