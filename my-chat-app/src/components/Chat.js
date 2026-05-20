import React, { useState, useEffect, useRef } from "react";
import { database } from "../firebase";
import { ref, push, onValue, update, get, remove } from "firebase/database";
import "./chat.css";
import ChatSidebar from "./ChatSidebar";
import UploadMedia from "./UploadMedia";
import MessageItem from "./MessageItem";
import { useAuth } from "../context/AuthContext";
import { Paperclip, Send, X, MessageSquare } from "lucide-react";

const getChatId = (uid1, uid2) =>
  uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;

function Chat({ onLogout }) {
  const { firebaseUser, resolveUsername } = useAuth();
  const [message, setMessage]               = useState("");
  const [messages, setMessages]             = useState([]);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [activeName, setActiveName]         = useState("");
  const [notifications, setNotifications]   = useState([]);
  const [showUpload, setShowUpload]         = useState(false);
  const [previewMedia, setPreviewMedia]     = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const bottomRef     = useRef(null);
  const activeChatRef = useRef(null);

  useEffect(() => { activeChatRef.current = activeChatUser; }, [activeChatUser]);

  // ── Clear ActiveChats on page unload/close ────────────────────
  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const myUid = firebaseUser.uid;

    // Clear stale ActiveChats entry immediately on mount (handles reload case)
    remove(ref(database, `ActiveChats/${myUid}`));

    const handleUnload = () => {
      // Best-effort clear on tab close
      navigator.sendBeacon && remove(ref(database, `ActiveChats/${myUid}`));
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      remove(ref(database, `ActiveChats/${myUid}`));
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [firebaseUser]);

  // ── Notifications listener ─────────────────────────────────────
  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const myUid = firebaseUser.uid;
    const notifRef = ref(database, `Notifications/${myUid}`);

    return onValue(notifRef, (snap) => {
      const data = snap.val() || {};
      const entries = Object.entries(data).map(([id, n]) => ({
        id, ...n, read: n.read ?? false,
      }));

      // Immediately mark read any notif from the currently open chat
      const needsRead = entries.filter(
        (n) => !n.read && n.from === activeChatRef.current
      );
      if (needsRead.length > 0) {
        const updates = {};
        needsRead.forEach((n) => {
          updates[`Notifications/${myUid}/${n.id}/read`] = true;
        });
        update(ref(database), updates);
      }

      // Only show notifs from users NOT currently open
      setNotifications(
        entries.filter((n) => !n.read && n.from !== activeChatRef.current)
      );
    });
  }, [firebaseUser]);

  // ── Messages + mark-as-read ────────────────────────────────────
  useEffect(() => {
    if (!firebaseUser?.uid || !activeChatUser) return;

    const myUid    = firebaseUser.uid;
    const theirUid = activeChatUser;

    // Tell Firebase this user has this chat open
    update(ref(database), { [`ActiveChats/${myUid}`]: theirUid });

    setLoadingMessages(true);

    // Mark all existing notifications from them as read
    get(ref(database, `Notifications/${myUid}`)).then((snap) => {
      const notifs = snap.val() || {};
      const updates = {};
      Object.entries(notifs).forEach(([id, n]) => {
        if (n.from === theirUid && !n.read) {
          updates[`Notifications/${myUid}/${id}/read`] = true;
        }
      });
      if (Object.keys(updates).length > 0) update(ref(database), updates);
    });

    const chatId  = getChatId(myUid, theirUid);
    const msgsRef = ref(database, `Messages/${chatId}`);

    const unsub = onValue(msgsRef, (snap) => {
      const data = snap.val();
      setLoadingMessages(false);
      if (!data) { setMessages([]); return; }

      const arr = Object.entries(data).map(([id, msg]) => ({ id, ...msg }));
      arr.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(arr);

      // Mark incoming messages as read
      const msgUpdates = {};
      arr.forEach(({ id, sender, receiver, read }) => {
        if (sender === theirUid && receiver === myUid && !read) {
          msgUpdates[`Messages/${chatId}/${id}/read`] = true;
        }
      });
      if (Object.keys(msgUpdates).length > 0) update(ref(database), msgUpdates);
    });

    // When chat closes, clear the active status
    return () => {
      unsub();
      remove(ref(database, `ActiveChats/${myUid}`));
    };
  }, [firebaseUser, activeChatUser]);

  // ── Auto-scroll ────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Resolve display name ───────────────────────────────────────
  useEffect(() => {
    if (!activeChatUser) { setActiveName(""); return; }
    resolveUsername(activeChatUser).then(setActiveName);
  }, [activeChatUser, resolveUsername]);

  const handleSelectUser = (uid) => {
    if (uid === activeChatUser) return;
    setActiveChatUser(uid);
  };

  // ── Send message ───────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !firebaseUser?.uid || !activeChatUser) return;

    const myUid    = firebaseUser.uid;
    const theirUid = activeChatUser;
    const chatId   = getChatId(myUid, theirUid);

    push(ref(database, `Messages/${chatId}`), {
      text:      message.trim(),
      sender:    myUid,
      receiver:  theirUid,
      timestamp: Date.now(),
      type:      "text",
      read:      false,
    });

    update(ref(database), {
      [`Chatlist/${myUid}/${theirUid}`]: true,
      [`Chatlist/${theirUid}/${myUid}`]: true,
    });

    // Only send notification if receiver doesn't have this chat open
    const activeSnap = await get(ref(database, `ActiveChats/${theirUid}`));
    const theirOpenChat = activeSnap.val();
    const isViewingMe = theirOpenChat === myUid;

    if (!isViewingMe) {
      push(ref(database, `Notifications/${theirUid}`), {
        type:      "message",
        from:      myUid,
        to:        theirUid,
        text:      message.trim(),
        timestamp: Date.now(),
        read:      false,
      });
    }

    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="chat-page">
      <ChatSidebar
        activeChatUser={activeChatUser}
        onSelectUser={handleSelectUser}
        notifications={notifications}
        onLogout={onLogout}
      />

      <div className="chat-main">
        <div className="chat-topbar">
          {activeChatUser ? (
            <>
              <div className="avatar">{activeName?.[0]?.toUpperCase() || "?"}</div>
              <div>
                <div className="chat-topbar-name">{activeName}</div>
                <div className="chat-topbar-status">active now</div>
              </div>
            </>
          ) : (
            <div className="chat-topbar-name" style={{ color: "var(--text-muted)" }}>
              Select a conversation
            </div>
          )}
        </div>

        {activeChatUser ? (
          <>
            <div className="message-list">
              {loadingMessages ? (
                <div className="chat-status-text">loading...</div>
              ) : messages.length === 0 ? (
                <div className="chat-status-text">no messages yet — say hello!</div>
              ) : (
                messages.map((msg) => (
                  <MessageItem
                    key={msg.id || msg.timestamp}
                    msg={msg}
                    onMediaClick={setPreviewMedia}
                  />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <form className="chat-input-bar" onSubmit={handleSend}>
              <button type="button" className="attach-btn"
                onClick={() => setShowUpload(true)} title="Attach">
                <Paperclip size={16} />
              </button>
              <textarea
                className="chat-input"
                placeholder="Message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button type="submit" className="send-button" title="Send">
                <Send size={15} />
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty">
            <MessageSquare size={40} strokeWidth={1}
              style={{ opacity: 0.2, color: "var(--text-secondary)" }} />
            <div className="chat-empty-text">search or select a chat to begin</div>
          </div>
        )}
      </div>

      {showUpload && activeChatUser && (
        <UploadMedia
          currentUserId={firebaseUser.uid}
          selectedUserId={activeChatUser}
          onClose={() => setShowUpload(false)}
        />
      )}

      {previewMedia && (
        <div className="media-preview-overlay" onClick={() => setPreviewMedia(null)}>
          <div className="media-preview-inner" onClick={(e) => e.stopPropagation()}>
            {previewMedia.type === "image" && <img src={previewMedia.url} alt="preview" />}
            {previewMedia.type === "video" && (
              <video controls autoPlay>
                <source src={previewMedia.url} />
              </video>
            )}
            {previewMedia.type === "audio" && (
              <div style={{ background: "var(--bg-raised)", padding: 24, borderRadius: "var(--radius-md)" }}>
                <audio controls autoPlay src={previewMedia.url} />
              </div>
            )}
            <button className="media-preview-close" onClick={() => setPreviewMedia(null)}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;