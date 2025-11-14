import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdCalendarToday,
  MdPerson,
  MdSettings,
  MdGroup,
  MdSmartToy,
} from "react-icons/md";
import "../../styles/dashboard/Sidebar.css";
import { useContext } from "react";
import { Context } from "../../../main";

const Sidebar = ({ isOpen, isMobile, onClose }) => {
  const { user } = useContext(Context);

  const location = useLocation();

  const menuItems = [
    {
      title: "Main",
      items: [{ name: "Dashboard", icon: <MdDashboard />, path: "/dashboard" }],
    },
    {
      title: "Individual",
      items: [
        {
          name: "My Calendar & Tasks",
          icon: <MdCalendarToday />,
          path: "/dashboard/individual/calendar-tasks",
        },
        {
          name: "AI Assistant",
          icon: <MdSmartToy />,
          path: "/dashboard/individual/ai-assistant",
        },
      ],
    },
    {
      title: "Group",
      items: [
        {
          name: "Team Calendar",
          icon: <MdGroup />,
          path: "/dashboard/group/calendar-tasks",
        },
        {
          name: "AI Distribution",
          icon: <MdSmartToy />,
          path: "/dashboard/group/ai-assistant",
        },
        {
          name: "Admin Panel",
          icon: <MdSettings />,
          path: "/dashboard/group/admin",
        },
      ],
    },
  ];

  const handleLinkClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="logo">
            <h2>TaskHive</h2>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((section, idx) => (
            <div key={idx} className="nav-section">
              <h3 className="nav-section-title">{section.title}</h3>
              <ul className="nav-items">
                {section.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="nav-item">
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `nav-link ${isActive ? "active" : ""}`
                      }
                      onClick={handleLinkClick}>
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-text">{item.name}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <MdPerson />
            </div>
            <div className="user-details">
              <p className="user-name">{user?.name}</p>
              <p className="user-email">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
