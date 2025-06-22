import React, { useState, useEffect, useRef } from "react";
import { database } from "../firebase";
import { ref, push, onValue, set } from "firebase/database";
import axios from "axios";
import "./chat.css";

const getChatId = (uid1, uid2) =>
  uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;

function Chat({ onLogout, currentUser }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState("");

  const bottomRef = useRef(null);
  const token = localStorage.getItem("token");

  // Load users from backend (for dropdown)
  useEffect(() => {
    if (!currentUser || !token) return;
    (async () => {
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    })();
  }, [currentUser, token]);

  // Load messages from Firebase when activeChatUser changes
  useEffect(() => {
    if (!currentUser || !activeChatUser) return;
    const chatId = getChatId(currentUser.uid, activeChatUser);
    const messagesRef = ref(database, `Messages/${chatId}`);

    return onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      setMessages(data ? Object.values(data) : []);
    });
  }, [currentUser, activeChatUser]);

  // Scroll to latest message
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || !activeChatUser) return;

    const chatId = getChatId(currentUser.uid, activeChatUser);
    const messagesRef = ref(database, `Messages/${chatId}`);

    const newMsg = {
      text: message,
      sender: currentUser.uid,
      receiver: activeChatUser,
      timestamp: Date.now(),
    };

    push(messagesRef, newMsg);

    // Update chatlist for both users
    set(ref(database, `Chatlist/${currentUser.uid}/${activeChatUser}`), true);
    set(ref(database, `Chatlist/${activeChatUser}/${currentUser.uid}`), true);

    setMessage("");
  };

  return (
    <div className="chat-page">
      <h2 className="chat-title">Start Messaging</h2>

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
              <div key={idx} className="message">
                <div>
                  <strong>{msg.sender === currentUser.uid ? "You" : "Them"}:</strong>
                </div>
                <div>{msg.text}</div>
              </div>
            ))
          ) : (
            <p>Select a user to chat.</p>
          )}
          <div ref={bottomRef} />
        </div>

        {activeChatUser && (
          <form onSubmit={handleSend} className="chat-form">
            <div className="input-send-container">
            <textarea
              className="chat-input"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="3"
            />
            <button type="submit" className="send-button">
              Send
            </button>
            </div>
          </form>
        )}
      </div>

      <button className="logout-btn" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

export default Chat;
