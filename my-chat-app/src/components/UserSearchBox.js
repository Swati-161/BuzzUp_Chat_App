import React, { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";

function UserSearchBox({ onUserSelected }) {
  const { firebaseUser } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const usersRef = ref(database, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const users = Object.values(data).filter(
          (user) => user.uid !== firebaseUser?.uid
        );
        setAllUsers(users);
      }
    });
    return () => unsubscribe();
  }, [firebaseUser]);

  const filterSuggestions = (value) => {
    const trimmed = value.toLowerCase().trim();
    if (!trimmed) {
      setSuggestions([]);
      return;
    }
    const filtered = allUsers.filter((user) =>
      user.username?.toLowerCase().includes(trimmed)
    );
    setSuggestions(filtered);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    filterSuggestions(value);
  };

  const handleSearchClick = () => {
    filterSuggestions(searchTerm);
  };

  const handleSelect = (user) => {
    const myId = firebaseUser.uid;
    const theirId = user.uid;

    set(ref(database, `Chatlist/${myId}/${theirId}`), true);
    set(ref(database, `Chatlist/${theirId}/${myId}`), true);

    setSearchTerm("");
    setSuggestions([]);
    onUserSelected(user.uid);
  };

  return (
    <div className="user-search-box">
      <div style={{ display: "flex" }}>
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder="Search user by username"
          className="search-input"
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "4px 0 0 4px",
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={handleSearchClick}
          style={{
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderLeft: "none",
            borderRadius: "0 4px 4px 0",
            background: "#eee",
            cursor: "pointer",
          }}
        >
          🔍
        </button>
      </div>

      {searchTerm && (
        <ul
          className="suggestion-list"
          style={{
            listStyle: "none",
            padding: 0,
            marginTop: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            maxHeight: "200px",
            overflowY: "auto",
            backgroundColor: "#fff",
          }}
        >
          {suggestions.length > 0 ? (
            suggestions.map((user) => (
              <li
                key={user.uid}
                onClick={() => handleSelect(user)}
                style={{
                  cursor: "pointer",
                  padding: "8px",
                  borderBottom: "1px solid #eee",
                }}
              >
                {user.username}
              </li>
            ))
          ) : (
            <li
              style={{
                padding: "8px",
                color: "#888",
              }}
            >
              No users found.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default UserSearchBox;
