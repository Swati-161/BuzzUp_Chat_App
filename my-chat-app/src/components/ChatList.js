import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";

function ChatList() {
  
  const { firebaseUser } = useAuth();
  const [chatContacts, setChatContacts] = useState([]);
  
  useEffect(() => {
    if (!firebaseUser?.uid) return;

    const chatListRef = ref(database, `Chatlist/${firebaseUser.uid}`);
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
  }, [firebaseUser]);

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
