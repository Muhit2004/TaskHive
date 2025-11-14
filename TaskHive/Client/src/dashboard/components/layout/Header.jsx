import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../../../main";
import {
  MdMenu,
  MdNotifications,
  MdSettings,
  MdPerson,
  MdLogout,
  MdSearch,
} from "react-icons/md";
import "../../styles/dashboard/Header.css";

const Header = ({ onMenuClick }) => {
  const { user } = useContext(Context);
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser } = useContext(Context);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      const response = await axios.get(
        "http://localhost:4000/api/v1/user/logout",
        {
          withCredentials: true,
        }
      );
      toast.success(response.data.message);
      setIsAuthenticated(false);
      setUser(null);
      navigate("/auth");
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Toggle menu">
          <MdMenu />
        </button>
      </div>

      <div className="header-right">
        {/* Profile */}
        <div className="header-item profile-menu">
          <button
            className="profile-button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <div className="avatar">
              <MdPerson />
            </div>
            <span className="user-name">{user?.name}</span>
          </button>

          {showProfileMenu && (
            <div
              className="dropdown profile-dropdown"
              style={{
                position: "absolute",
                zIndex: 999999,
                top: "calc(100% + 8px)",
                right: 0,
              }}>
              <div className="dropdown-header">
                <div className="profile-info">
                  <div className="avatar large">
                    <MdPerson />
                  </div>
                  <div>
                    <p className="name">{user?.name}</p>
                    <p className="email">{user?.email}</p>
                  </div>
                </div>
              </div>
              <div className="dropdown-body">
                <button onClick={handleLogout} className="logout">
                  <MdLogout /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
