// ChatSidebar.js
import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";
import "./ChatSidebar.css"; // custom styling

function ChatSidebar({ onSelectUser }) {
  const { firebaseUser } = useAuth();
  const [chatList, setChatList] = useState([]);

  useEffect(() => {
    if (!firebaseUser) return;

    const chatRef = ref(database, `Chatlist/${firebaseUser.uid}`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val() || {};
      const userIds = Object.keys(data);
      setChatList(userIds);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  return (
    <div className="chat-sidebar">
      <h3>Chats</h3>
      <div className="chat-scroll">
        {chatList.map((uid) => (
          <div key={uid} className="chat-user" onClick={() => onSelectUser(uid)}>
            {uid}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatSidebar;
