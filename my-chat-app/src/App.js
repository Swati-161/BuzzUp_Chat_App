import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Chat from "./components/Chat";
import { auth } from "./firebase";
import { AuthProvider } from "./context/AuthContext";
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

  if (loading) {
    return <div className="loading-screen">connecting</div>;
  }

  if (currentUser) {
    return (
      <AuthProvider>
        <Chat onLogout={() => auth.signOut()} />
      </AuthProvider>
    );
  }

  return (
    <div className="auth-page">
      {isRegister ? (
        <Register onToggle={() => setIsRegister(false)} />
      ) : (
        <Login onToggle={() => setIsRegister(true)} />
      )}
    </div>
  );
};

export default App;