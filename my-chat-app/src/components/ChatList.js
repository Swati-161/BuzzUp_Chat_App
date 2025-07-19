

import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";

function ChatList({ currentUser }) {
  const [chatContacts, setChatContacts] = useState([]);

  useEffect(() => {
    if (currentUser?.uid) {
      const chatListRef = ref(database, `Chatlist/${currentUser.uid}`);
      const unsubscribe = onValue(chatListRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const contacts = Object.keys(data);
          setChatContacts(contacts);
        } else {
          setChatContacts([]);
        }
      });

      return () => unsubscribe(); 
    }
  }, [currentUser]);

  return (
    <div>
      <h3>Contacts</h3>
      <ul>
        {chatContacts.map((contactId) => (
          <li key={contactId}>{contactId}</li>
        ))}
      </ul>
    </div>
  );
}

export default ChatList;
