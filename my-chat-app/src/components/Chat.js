import React, { useState, useEffect, useRef } from "react";
import { database } from "../firebase";
import { ref, push, onValue, set } from "firebase/database";
import axios from "axios";
import "./chat.css";
import Header from "./Header";
import UploadMedia from './UploadMedia';
import MessageItem from "../components/MessageItem";
import { useAuth } from "../context/AuthContext";
import UserSearchBox from "../components/UserSearchBox";

const getChatId = (uid1, uid2) =>
  uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;

function Chat({ onLogout}) {
  const { firebaseUser } = useAuth();
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
    if (!firebaseUser || !token) return;
    (async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    })();
  }, [firebaseUser, token]);

  useEffect(() => {
    if (!firebaseUser?.uid || !activeChatUser) return;

    const chatId = getChatId(firebaseUser.uid, activeChatUser);
    const messagesRef = ref(database, `Messages/${chatId}`);

    return onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const messageArray = data ? Object.values(data) : [];
      setMessages(messageArray);

      const notiRef = ref(database, `Notifications/${firebaseUser.uid}`);
      onValue(notiRef, (snap) => {
        const all = snap.val() || {};
        Object.entries(all).forEach(([id, notif]) => {
          if (notif.from === activeChatUser && !notif.read) {
            set(ref(database, `Notifications/${firebaseUser.uid}/${id}/read`), true);
          }
        });
      });
    });
  }, [firebaseUser, activeChatUser]);

  useEffect(() => {
    if (!firebaseUser?.uid || !activeChatUser) return;

    const chatId = getChatId(firebaseUser.uid, activeChatUser);
    const messagesRef = ref(database, `Messages/${chatId}`);

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      Object.entries(data).forEach(([msgId, msg]) => {
        const isIncomingUnread =
          msg.sender === activeChatUser &&
          msg.receiver === firebaseUser.uid &&
          msg.read === false;

        if (isIncomingUnread) {
          // ✅ Mark message as read
          const msgRef = ref(database, `Messages/${chatId}/${msgId}`);
          set(msgRef, { ...msg, read: true });

          // ✅ Mark notification as read (if matching exists)
          const notifRef = ref(database, `Notifications/${firebaseUser.uid}`);
          onValue(notifRef, (notiSnap) => {
            const notis = notiSnap.val() || {};
            Object.entries(notis).forEach(([notiId, noti]) => {
              if (!noti.read && noti.from === activeChatUser) {
                set(ref(database, `Notifications/${firebaseUser.uid}/${notiId}/read`), true);
              }
            });
          }, { onlyOnce: true });
        }
      });
    });

    return () => unsubscribe();
  }, [firebaseUser, activeChatUser]);


  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!firebaseUser?.uid) return;

    const notificationRef = ref(database, `Notifications/${firebaseUser.uid}`);

    return onValue(notificationRef, (snapshot) => {
      const data = snapshot.val();
      const allNotifs = data ? Object.entries(data).map(([id, n]) => ({ id, read: false, ...n, read: n.read ?? false })) : [];

      const unreadFromOthers = allNotifs.filter(
        (n) => !n.read && n.from !== activeChatUser
      );

      setNotifications(unreadFromOthers);
    });
  }, [firebaseUser, activeChatUser]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !firebaseUser?.uid || !activeChatUser) return;

    const chatId = getChatId(firebaseUser.uid, activeChatUser);
    const messagesRef = ref(database, `Messages/${chatId}`);

    let detectedLang = "en";
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/detect-language`, {
        text: message,
      });

      detectedLang = res.data.language;
    } catch (err) {
      console.error("Language detection failed", err);
    }

    const newMsg = {
      text: message,
      sender: firebaseUser.uid,
      receiver: activeChatUser,
      timestamp: Date.now(),
      originalLang: detectedLang,
      type: "text"
    };

    push(messagesRef, newMsg);

    set(ref(database, `Chatlist/${firebaseUser.uid}/${activeChatUser}`), true);
    set(ref(database, `Chatlist/${activeChatUser}/${firebaseUser.uid}`), true);

    const notificationRef = ref(database, `Notifications/${activeChatUser}`);
    const newNotification = {
      type: "message",
      from: firebaseUser.uid,
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
        currentUser={firebaseUser}
        notifications={notifications}
        setActiveChatUser={setActiveChatUser}
        setNotifications={setNotifications}
      />

      <UserSearchBox onUserSelected={(uid) => setActiveChatUser(uid)} />

      <div className="chat-container">
        <div className="message-area message-list">
          {activeChatUser ? (
            messages.map((msg, idx) => (
              <MessageItem
                key={idx}
                msg={msg}
                currentUser={firebaseUser}
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
                currentUserId={firebaseUser.uid}
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
