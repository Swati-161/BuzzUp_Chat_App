import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Chat from "./components/Chat";
import { auth } from "./firebase";
import "./App.css";

const App = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div id="main-container">Loading...</div>;

  if (currentUser)
    return (
      <Chat currentUser={currentUser} onLogout={() => auth.signOut()} />
    );

  return (
    <div id="main-container">
      <div id="app-title">BuzzUP</div>
      <img src="https://cdn.dribbble.com/userupload/22071540/file/original-0acc3417152aaf7e8bbcf399b7840424.png?resize=752x&vertical=center" alt="App Logo" id="app-logo" />
      
      {isRegister ? (
        <Register onToggle={() => setIsRegister(false)} />
      ) : (
        <Login onToggle={() => setIsRegister(true)} />
      )}
    </div>
  );
};

export default App;
