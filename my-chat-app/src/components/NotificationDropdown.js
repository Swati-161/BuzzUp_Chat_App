import React, { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";

const NotificationDropdown = () => {
  const { firebaseUser } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!firebaseUser) return;

    const notiRef = ref(database, `notifications/${firebaseUser.uid}`);
    const unsub = onValue(notiRef, (snapshot) => {
      const data = snapshot.val() || {};
      const notiList = Object.entries(data)
        .map(([id, value]) => ({
          id,
          ...value,
          read: value.read ?? false, // 👈 ensures read field exists
        }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        if (JSON.stringify(notiList) !== JSON.stringify(notifications)) {
          setNotifications(notiList);
        }
    });

    return () => unsub();
  }, [firebaseUser]);

  const markAsRead = async (id) => {
    if (!firebaseUser) return;
    const notiRef = ref(database, `notifications/${firebaseUser.uid}/${id}`);
    await update(notiRef, { read: true });
  };

  return (
    <div className="absolute right-4 top-14 w-80 bg-white border rounded shadow-md z-50 max-h-96 overflow-y-auto">
      {notifications.length === 0 ? (
        <p className="p-4 text-gray-500 text-sm">No notifications</p>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => markAsRead(n.id)}
            className={`p-3 border-b hover:bg-gray-100 cursor-pointer ${
              !n.read ? "bg-gray-50 font-semibold" : ""
            }`}
          >
            {n.type === "message" && `New message from ${n.senderName || "Unknown"}`}
            {n.type === "call" && `Incoming call from ${n.senderName}`}
            {n.type === "missed_call" && `Missed call from ${n.senderName}`}
          </div>
        ))
      )}
    </div>
  );
};

export default NotificationDropdown;
