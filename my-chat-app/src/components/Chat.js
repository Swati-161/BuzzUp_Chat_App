//chat.js
import React, { useState, useEffect, useRef } from "react";
import { database } from "../firebase";
import { ref, push, onValue, set } from "firebase/database";
import axios from "axios";
import "./chat.css";
import Header from "./Header";
import UploadMedia from './UploadMedia';
import TranslateDropdown from "../components/TranslateDropdown";
import MessageItem from "../components/MessageItem";

const getChatId = (uid1, uid2) =>
  uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;

function Chat({ onLogout, currentUser }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [userLang, setUserLang] = useState(localStorage.getItem("userLang") || "hi");

  const bottomRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!currentUser || !token) return;
    (async () => {
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    })();
  }, [currentUser, token]);

  useEffect(() => {
    if (!currentUser || !activeChatUser) return;

    const chatId = getChatId(currentUser.uid, activeChatUser);
    const messagesRef = ref(database, `Messages/${chatId}`);

    return onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const messageArray = data ? Object.values(data) : [];
      setMessages(messageArray);
    });
  }, [currentUser, activeChatUser]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!currentUser) return;

    const notificationRef = ref(database, `Notifications/${currentUser.uid}`);

    return onValue(notificationRef, (snapshot) => {
      const data = snapshot.val();
      const allNotifs = data ? Object.entries(data).map(([id, n]) => ({ id, ...n })) : [];

      const unreadFromOthers = allNotifs.filter(
        (n) => !n.read && n.from !== activeChatUser
      );

      setNotifications(unreadFromOthers);
    });
  }, [currentUser, activeChatUser]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !activeChatUser) return;

    const chatId = getChatId(currentUser.uid, activeChatUser);
    const messagesRef = ref(database, `Messages/${chatId}`);

    let detectedLang = "en";
    try {
      const res = await axios.post("http://localhost:5000/api/detect-language", {
        text: message,
      });
      detectedLang = res.data.language;
    } catch (err) {
      console.error("Language detection failed", err);
    }

    const newMsg = {
      text: message,
      sender: currentUser.uid,
      receiver: activeChatUser,
      timestamp: Date.now(),
      originalLang: detectedLang,
      type: "text"
    };

    push(messagesRef, newMsg);

    set(ref(database, `Chatlist/${currentUser.uid}/${activeChatUser}`), true);
    set(ref(database, `Chatlist/${activeChatUser}/${currentUser.uid}`), true);

    const notificationRef = ref(database, `Notifications/${activeChatUser}`);
    const newNotification = {
      type: "message",
      from: currentUser.uid,
      to: activeChatUser,
      text: message,
      timestamp: Date.now(),
      read: false,
    };
    push(notificationRef, newNotification);

    setMessage("");
  };

  return (
    <div className="chat-page">
      <Header
        currentUser={currentUser}
        notifications={notifications}
        setActiveChatUser={setActiveChatUser}
        setNotifications={setNotifications}
      />

      <select
        className="contacts-dropdown"
        value={activeChatUser}
        onChange={(e) => setActiveChatUser(e.target.value)}
      >
        <option value="">Select Contact</option>
        {users.map((u) => (
          <option key={u._id} value={u._id}>
            {u.username}
          </option>
        ))}
      </select>

      

      <div className="chat-container">
        <div className="message-area message-list">
          {activeChatUser ? (
            messages.map((msg, idx) => (
              <MessageItem
                key={idx}
                msg={msg}
                currentUser={currentUser}
                onMediaClick={(media) => setPreviewMedia(media)}
              />

            ))

          ) : (
            <p>Your messages will appear here.</p>
          )}
          <div ref={bottomRef} />
        </div>

        {activeChatUser && (
          <>
            <form onSubmit={handleSend} className="chat-form">
              <div className="input-send-container">
                <textarea
                  className="chat-input"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows="3"
                />
                <button type="button" onClick={() => setShowUpload(true)} className="media-icon-btn">
                  📎
                </button>
                <button type="submit" className="send-button">
                  Send
                </button>
              </div>
            </form>
            {showUpload && (
              <UploadMedia
                currentUserId={currentUser.uid}
                selectedUserId={activeChatUser}
                onClose={() => setShowUpload(false)}
              />
            )}
          </>
        )}
      </div>

      {previewMedia && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.85)", display: "flex",
          justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
          <div style={{ position: "relative" }}>
            {previewMedia.type === 'image' && (
              <img src={previewMedia.url} alt="Full preview" style={{ maxHeight: "90vh", maxWidth: "90vw" }} />
            )}
            {previewMedia.type === 'video' && (
              <video controls autoPlay style={{ maxHeight: "90vh", maxWidth: "90vw" }}>
                <source src={previewMedia.url} />
              </video>
            )}
            {previewMedia.type === 'audio' && (
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
                <audio controls autoPlay src={previewMedia.url} />
              </div>
            )}
            <button
              onClick={() => setPreviewMedia(null)}
              style={{
                position: "absolute", top: 10, right: 10, padding: "5px 10px",
                background: "white", border: "none", cursor: "pointer", fontWeight: "bold"
              }}
            >
              ✖
            </button>
          </div>
        </div>
      )}

      <button className="logout-btn" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

export default Chat;
