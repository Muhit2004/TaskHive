import React, { useState, useEffect, useContext } from "react";
import {
  MdSettings,
  MdPeople,
  MdSecurity,
  MdNotifications,
  MdPersonAdd,
} from "react-icons/md";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../../../main";
import "../../styles/group/GroupAdmin.css";

// Register Syncfusion license
import { registerLicense } from "@syncfusion/ej2-base";

registerLicense(
  "Ngo9BigBOggjHTQxAR8/V1JFaF5cXGRCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWH5fcnRQR2ZYUUd1WUJWYEg="
);

const API_BASE_URL = "http://localhost:4000/api/v1/group";

const GroupAdmin = () => {
  const { isAuthenticated, user } = useContext(Context);
  const [activeTab, setActiveTab] = useState("members");
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Get current user's role in the selected group
  const getCurrentUserRole = () => {
    if (!selectedGroup || !user) return null;
    const currentGroup = myGroups.find((g) => g._id === selectedGroup);
    if (!currentGroup) return null;
    const member = currentGroup.members?.find(
      (m) => m.userId._id === user._id || m.userId === user._id
    );
    return member?.role || null;
  };

  // Add Student Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");

  // Create Group Form
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  const tabs = [
    { id: "members", label: "Members", icon: <MdPeople /> },
    { id: "permissions", label: "Permissions", icon: <MdSecurity /> },
    { id: "notifications", label: "Notifications", icon: <MdNotifications /> },
    { id: "settings", label: "Settings", icon: <MdSettings /> },
  ];

  // Fetch Groups
  useEffect(() => {
    if (isAuthenticated) {
      fetchMyGroups();
    }
  }, [isAuthenticated]);

  // Fetch calendar events to calculate accurate task counts
  const fetchEvents = React.useCallback(async () => {
    if (!selectedGroup) return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}/calendar/group/${selectedGroup}`,
        { withCredentials: true }
      );
      setEvents(res.data.events || []);
      console.log("📅 Fetched calendar events:", res.data.events?.length);
    } catch (error) {
      console.error("❌ Error fetching events:", error);
    }
  }, [selectedGroup]);

  // Fetch Students when group is selected
  useEffect(() => {
    if (selectedGroup) {
      fetchStudents();
      fetchEvents();
      const role = getCurrentUserRole();
      setUserRole(role);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup, myGroups, fetchEvents]);

  const fetchMyGroups = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/group/my-groups`, {
        withCredentials: true,
      });
      setMyGroups(res.data.groups);
      if (res.data.groups.length > 0) {
        setSelectedGroup(res.data.groups[0]._id);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Failed to load groups");
    }
  };

  const fetchStudents = async () => {
    if (!selectedGroup) return;

    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/student/group/${selectedGroup}`,
        { withCredentials: true }
      );
      console.log("👥 ALL MEMBERS (including admin):", res.data.students);
      setStudents(res.data.students);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get task count for a member from events
  const getTaskCountForMember = (memberEmail) => {
    return events.filter((e) => e.assignedTo?.email === memberEmail).length;
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();

    if (!studentEmail.trim()) {
      toast.error("Please enter student email");
      return;
    }

    // Prevent admin from adding themselves
    if (studentEmail.toLowerCase() === user?.email?.toLowerCase()) {
      toast.error("You are already in this group as admin!");
      return;
    }

    if (!selectedGroup) {
      toast.error("Please select a group first");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/student/add`,
        { email: studentEmail, groupId: selectedGroup },
        { withCredentials: true }
      );

      toast.success(res.data.message);
      setStudentEmail("");
      setShowAddForm(false);
      await fetchStudents();
      await fetchEvents();
    } catch (error) {
      console.error("Error adding student:", error);
      toast.error(error.response?.data?.message || "Failed to add student");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to remove this student?")) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/student/${studentId}`, {
        withCredentials: true,
      });

      toast.success("Student removed successfully");
      await fetchStudents();
      await fetchEvents();
    } catch (error) {
      console.error("Error removing student:", error);
      toast.error(error.response?.data?.message || "Failed to remove student");
    } finally {
      setLoading(false);
    }
  };

  // Member leaves group (removes themselves)
  const handleLeaveGroup = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) {
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/group/${selectedGroup}/leave`,
        {},
        {
          withCredentials: true,
        }
      );

      toast.success("You have left the group successfully");
      // Refresh groups list
      await fetchMyGroups();
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error(error.response?.data?.message || "Failed to leave group");
    } finally {
      setLoading(false);
    }
  };

  // Admin deletes entire group
  const handleDeleteGroup = async () => {
    if (
      !window.confirm(
        "⚠️ Are you sure you want to DELETE this entire group? This action cannot be undone!"
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/group/${selectedGroup}`, {
        withCredentials: true,
      });

      toast.success("Group deleted successfully");
      setSelectedGroup(null);
      await fetchMyGroups();
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error(error.response?.data?.message || "Failed to delete group");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      toast.error("Please enter group name");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/group/create`,
        { groupName, groupDescription },
        { withCredentials: true }
      );

      toast.success("Group created successfully!");
      setGroupName("");
      setGroupDescription("");
      setShowCreateGroup(false);
      fetchMyGroups();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error(error.response?.data?.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group-admin-page">
      <div className="page-header">
        <div className="header-content">
          <MdSettings className="header-icon" />
          <div>
            <h1>Group Administration</h1>
            <p>Manage your team settings and permissions</p>
          </div>
        </div>

        <div className="header-right">
          {/* Show message if no groups */}
          {myGroups.length === 0 ? (
            <div className="no-group-message">
              <p>No groups yet. Create your first group!</p>
              <button
                className="btn-create-group"
                onClick={() => setShowCreateGroup(true)}>
                + Create Group
              </button>
            </div>
          ) : (
            /* Group Selector */
            <div className="group-selector">
              <label>Select Group:</label>
              <select
                value={selectedGroup || ""}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="group-dropdown">
                {myGroups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.groupName}
                  </option>
                ))}
              </select>
              <button
                className="btn-create-group-small"
                onClick={() => setShowCreateGroup(true)}>
                + New
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateGroup(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              <MdSettings /> Create New Group
            </h2>

            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label>Group Name *</label>
                <input
                  type="text"
                  placeholder="Enter group name..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  placeholder="Enter group description..."
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateGroup(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}>
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="admin-content">
        {activeTab === "members" && (
          <div className="members-section">
            <div className="section-header">
              <h2>Team Members ({students.length})</h2>
              <div style={{ display: "flex", gap: "10px" }}>
                {userRole === "admin" && (
                  <button
                    className="add-btn"
                    onClick={() => setShowAddForm(!showAddForm)}>
                    <MdPersonAdd /> Add Student
                  </button>
                )}
                {userRole === "member" && (
                  <button
                    className="add-btn"
                    style={{ background: "#ff9800" }}
                    onClick={handleLeaveGroup}
                    disabled={loading}>
                    Leave Group
                  </button>
                )}
                {userRole === "admin" && (
                  <button
                    className="add-btn"
                    style={{ background: "#f44336" }}
                    onClick={handleDeleteGroup}
                    disabled={loading}>
                    Delete Group
                  </button>
                )}
              </div>
            </div>

            {/* Add Student Form Modal */}
            {showAddForm && (
              <div
                className="modal-overlay"
                onClick={() => setShowAddForm(false)}>
                <div
                  className="modal-content"
                  onClick={(e) => e.stopPropagation()}>
                  <h2>
                    <MdPersonAdd /> Add Student by Email
                  </h2>

                  <form onSubmit={handleAddStudent}>
                    <div className="form-group">
                      <label>Student Email</label>
                      <input
                        type="email"
                        placeholder="student@example.com"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        required
                      />
                      <small>Enter the email of a registered user</small>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => setShowAddForm(false)}>
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-submit"
                        disabled={loading}>
                        {loading ? "Adding..." : "Add Student"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Students Table */}
            <div className="members-table">
              {loading ? (
                <div className="loading">Loading students...</div>
              ) : students.length === 0 ? (
                <div className="empty-state">
                  <MdPeople size={64} />
                  <h3>No students yet</h3>
                  <p>Add students to your group to get started!</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Current Tasks</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student._id}>
                        <td>{student.name}</td>
                        <td>{student.email}</td>
                        <td>
                          <span
                            className={`role-badge ${student.role.toLowerCase()}`}>
                            {student.role}
                          </span>
                        </td>
                        <td>
                          <span className="task-count">
                            {getTaskCountForMember(student.email)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="action-btn danger"
                            onClick={() => handleRemoveStudent(student._id)}
                            disabled={loading || student.role === "admin"}>
                            {student.role === "admin" ? "" : "Remove"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === "permissions" && (
          <div className="permissions-section">
            <h2>Role Permissions</h2>
            <div className="permissions-grid">
              <div className="permission-card">
                <h3>Admin</h3>
                <ul>
                  <li>✓ Full access to all features</li>
                  <li>✓ Manage members</li>
                  <li>✓ Edit group settings</li>
                  <li>✓ Delete events and tasks</li>
                </ul>
              </div>
              <div className="permission-card">
                <h3>Member</h3>
                <ul>
                  <li>✓ View and create events</li>
                  <li>✓ Create and edit own tasks</li>
                  <li>✗ Cannot manage members</li>
                  <li>✗ Cannot edit group settings</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="notifications-section">
            <h2>Notification Settings</h2>
            <div className="notification-options">
              <div className="option-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  <span>Email notifications for new events</span>
                </label>
              </div>
              <div className="option-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  <span>Task assignment notifications</span>
                </label>
              </div>
              <div className="option-item">
                <label>
                  <input type="checkbox" />
                  <span>Daily digest emails</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="settings-section">
            <h2>Group Settings</h2>
            <div className="settings-form">
              <div className="form-group">
                <label>Group Name</label>
                <input type="text" defaultValue="My Team" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea defaultValue="Team collaboration space"></textarea>
              </div>
              <div className="form-group">
                <label>Time Zone</label>
                <select>
                  <option>UTC</option>
                  <option>EST</option>
                  <option>PST</option>
                </select>
              </div>
              <button className="save-btn">Save Changes</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupAdmin;
