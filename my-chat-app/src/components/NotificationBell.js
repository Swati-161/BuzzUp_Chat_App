import React, { useState, useEffect } from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import { ref, onValue, off, query, orderByChild, equalTo } from "firebase/database";
import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";

const NotificationBell = ({ onClick }) => {
  const { firebaseUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!firebaseUser) return;

    const notiRef = ref(database, `notifications/${firebaseUser.uid}`);
    const notiQuery = query(notiRef, orderByChild("read"), equalTo(false));

    const handleSnapshot = (snapshot) => {
      const data = snapshot.val() || {};
      const unread = Object.keys(data).length;
      setUnreadCount(unread);
    };

    onValue(notiQuery, handleSnapshot);

    // Manual cleanup using `off`
    return () => off(notiQuery, "value", handleSnapshot);
  }, [firebaseUser]);

  return (
    <div className="relative cursor-pointer" onClick={onClick}>
      <IoNotificationsOutline size={28} />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-full">
          {unreadCount}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;
