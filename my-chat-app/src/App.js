import React, { useState, useEffect } from "react";
import Chat from "./components/Chat";
import "./App.css";
import axios from "axios";
import {jwtDecode} from "jwt-decode";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("token"));
  const [formType, setFormType] = useState("login");
  const [formData, setFormData] = useState({ email: "", password: "", username: "" });
  const [currentUser, setCurrentUser] = useState(null); // ✅ Add this

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(storedUser)); // ✅ Retrieve user
    }
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const url =
      formType === "login"
        ? "http://localhost:5000/api/auth/login"
        : "http://localhost:5000/api/auth/register";
    const res = await axios.post(url, formData);

    if (formType === "login") {
      const token = res.data.token; // ✅ define token
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      const decoded = jwtDecode(token); // ✅ decode it now
      setCurrentUser({ uid: decoded.id });

      setIsLoggedIn(true);
    } else {
      alert("Registered successfully! Please log in.");
      setFormType("login");
    }
  } catch (err) {
    alert(err.response?.data?.message || "Network error");
  }
};

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user"); // ✅ Clear stored user
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  // ✅ Show chat if logged in
  if (isLoggedIn && currentUser) {
    return <Chat onLogout={handleLogout} currentUser={currentUser} />;
  }

  // ✅ Otherwise show login/register form
  return (
    <div id="main-container">
      <h1 id="app-title">BuzzUp</h1>
      <img
        src="https://cdn.dribbble.com/userupload/22071540/file/original-0acc3417152aaf7e8bbcf399b7840424.png?resize=752x&vertical=center"
        alt="BuzzApp Logo"
        id="app-logo"
      />
      <form onSubmit={handleSubmit} id="auth-form">
        <h2 id="form-title">Register or Login to continue!!</h2>

        {formType === "register" && (
          <>
            <input
              name="username"
              placeholder="Username"
              required
              value={formData.username}
              onChange={handleInputChange}
              className="form-input"
            />
            <br />
            <br />
          </>
        )}
        <input
          name="email"
          placeholder="Email"
          required
          value={formData.email}
          onChange={handleInputChange}
          className="form-input"
        />
        <br />
        <br />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          value={formData.password}
          onChange={handleInputChange}
          className="form-input"
        />

        <button type="submit" id="submit-button">
          {formType === "login" ? "Login" : "Register"}
        </button>

        <p id="form-toggle-text">
          {formType === "login" ? "New here?" : "Already registered?"}{" "}
          <button
            type="button"
            id="toggle-btn"
            onClick={() => setFormType(formType === "login" ? "register" : "login")}
          >
            {formType === "login" ? "Register" : "Login"} instead
          </button>
        </p>
      </form>
    </div>
  );
}

export default App;
