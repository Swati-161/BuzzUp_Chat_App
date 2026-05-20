import React, { useEffect, useState, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../utils/axiosInstance";
import { Bell, Search, LogOut, MessageSquare } from "lucide-react";

function ChatSidebar({ activeChatUser, onSelectUser, notifications, onLogout }) {
  const { firebaseUser, resolveUsername } = useAuth();
  const [chatList, setChatList]           = useState([]);  // [{ uid, username }]
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showNotifs, setShowNotifs]       = useState(false);
  const searchRef                         = useRef(null);

  // Load chatlist from Firebase and resolve UIDs to usernames
  useEffect(() => {
    if (!firebaseUser) return;
    const chatRef = ref(database, `Chatlist/${firebaseUser.uid}`);
    const unsub = onValue(chatRef, async (snapshot) => {
      const data = snapshot.val() || {};
      const uids = Object.keys(data);
      const resolved = await Promise.all(
        uids.map(async (uid) => ({ uid, username: await resolveUsername(uid) }))
      );
      setChatList(resolved);
    });
    return () => unsub();
  }, [firebaseUser, resolveUsername]);

  // Search users via backend
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await axiosInstance.get(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        // Filter out self
        setSearchResults(res.data.filter((u) => u.firebaseUid !== firebaseUser?.uid));
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, firebaseUser]);

  const unreadCount = notifications.length;

  // Notification grouping: uid -> count
  const grouped = notifications.reduce((acc, n) => {
    acc[n.from] = (acc[n.from] || 0) + 1;
    return acc;
  }, {});

  const myName     = firebaseUser?.displayName || firebaseUser?.email?.split("@")[0] || "Me";
  const myInitial  = myName[0].toUpperCase();
  const myEmail    = firebaseUser?.email || "";

  return (
    <div className="sidebar">
      {/* Brand + notification bell */}
      <div className="sidebar-header">
        <div className="sidebar-brand">Buzz<span>Up</span></div>
        <div className="sidebar-actions">
          <div style={{ position: "relative" }}>
            <button
              className="icon-btn"
              onClick={() => setShowNotifs((p) => !p)}
              title="Notifications"
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </button>

            {showNotifs && (
              <div className="notif-dropdown">
                <div className="notif-header">Notifications</div>
                {unreadCount === 0 ? (
                  <div className="notif-empty">all caught up</div>
                ) : (
                  Object.entries(grouped).map(([uid, count]) => (
                    <div
                      key={uid}
                      className="notif-item"
                      onClick={async () => {
                        onSelectUser(uid);
                        setShowNotifs(false);
                      }}
                    >
                      <div className="notif-dot" />
                      <div className="notif-text">
                        {chatList.find((c) => c.uid === uid)?.username || uid.slice(0, 8)}
                      </div>
                      <div className="notif-count">{count} new</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-input-wrap" ref={searchRef}>
          <span className="search-icon"><Search size={13} /></span>
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((u) => (
                <div
                  key={u.firebaseUid || u._id}
                  className="search-result-item"
                  onClick={() => {
                    onSelectUser(u.firebaseUid || u.uid);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  <div className="avatar" style={{ width: 26, height: 26, fontSize: 11 }}>
                    {u.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span>{u.username}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat list */}
      <div className="sidebar-list">
        {chatList.length > 0 && (
          <div className="sidebar-list-title">Recent</div>
        )}
        {chatList.map(({ uid, username }) => {
          const initial = username?.[0]?.toUpperCase() || "?";
          const isActive = uid === activeChatUser;
          const unread = grouped[uid] || 0;
          return (
            <div
              key={uid}
              className={`chat-user-item ${isActive ? "active" : ""}`}
              onClick={() => onSelectUser(uid)}
            >
              <div className="avatar">{initial}</div>
              <div className="chat-user-info">
                <div className="chat-user-name">{username}</div>
                {unread > 0 && (
                  <div className="chat-user-uid" style={{ color: "var(--accent)" }}>
                    {unread} new message{unread > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {chatList.length === 0 && (
          <div style={{ padding: "20px 18px", fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            search for someone to start chatting
          </div>
        )}
      </div>

      {/* Current user footer */}
      <div className="sidebar-footer">
        <div className="avatar">{myInitial}</div>
        <div className="sidebar-footer-user">
          <div className="sidebar-footer-name">{myName}</div>
          <div className="sidebar-footer-email">{myEmail}</div>
        </div>
        <button className="logout-btn" onClick={onLogout} title="Sign out"><LogOut size={14} /></button>
      </div>
    </div>
  );
}

export default ChatSidebar;