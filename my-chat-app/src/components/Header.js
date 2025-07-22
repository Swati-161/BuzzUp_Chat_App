import React, { useState, useContext } from "react";
import { ref, update } from "firebase/database";
import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";
import "./Header.css";

function Header({notifications, setActiveChatUser, setNotifications }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { firebaseUser } = useAuth();

  const grouped = notifications.reduce((acc, noti) => {
    acc[noti.from] = acc[noti.from] ? acc[noti.from] + 1 : 1;
    return acc;
  }, {});

  const unreadCount = notifications.length;

  const handleUserClick = (senderId) => {
    
    const updates = {};
    notifications.forEach((n) => {
      if (n.from === senderId) {
        updates[`Notifications/${firebaseUser.uid}/${n.id}/read`] = true;
      }
    });
    update(ref(database), updates);
    setActiveChatUser(senderId);
    setShowDropdown(false);
    
    setNotifications((prev) => prev.filter((n) => n.from !== senderId));
  };

  return (
    <div className="header">
      <h2>Start Messaging Here!!!</h2>
      <div
        className="notification-bell"
        onClick={() => setShowDropdown((prev) => !prev)}
      >
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </div>

      {showDropdown && (
        <div className="dropdown scrollable-dropdown">
          {unreadCount === 0 ? (
            <p>No unread notifications</p>
          ) : (
            Object.entries(grouped).map(([userId, count]) => (
              <div
                key={userId}
                className="noti-item"
                onClick={() => handleUserClick(userId)}
              >
                <p><strong>{userId}</strong>: {count} new message(s)</p>
              </div>
            ))
          )}
          <div className="dropdown-footer">
            <small>Select user to mark as read</small>
          </div>
        </div>
      )}
    </div>
  );
}

export default Header;
