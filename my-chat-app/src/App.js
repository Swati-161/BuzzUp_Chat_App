import React, {useState} from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Chat from "./components/Chat";
import "./App.css";


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [formType, setFormType] = useState("login"); // "login" or "register"
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = formType === "login"
        ? "http://localhost:5000/api/auth/login"
        : "http://localhost:5000/api/auth/register";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Something went wrong");
        if (formType === "login") {
          setFormType("register");
        }
        return;
      }

      localStorage.setItem("token", data.token); // store JWT
      setIsLoggedIn(true); // Show chat interface
    } catch (err) {
      alert("Network error");
    }
  };

  if (isLoggedIn) return <Chat />;

  return (
    <div id="main-container">
      <h1 id="app-title">Buzz up</h1>
      <img
        src="https://cdn.dribbble.com/userupload/22071540/file/original-0acc3417152aaf7e8bbcf399b7840424.png?resize=752x&vertical=center"
        alt="BuzzApp Logo"
        id="app-logo"
      />
      
      <form
        onSubmit={handleSubmit}
        id="auth-form"
      >
        <h2 id="form-title">
          Register or Login to continue!!
        </h2>

        {formType === "register" && (
        <>
          <input
            name="username"
            placeholder="Username"
            required
            value={formData.username || ""}
            onChange={handleInputChange}
            className="form-input"
        />
        <br /><br />
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
        <br/>
        <br/>
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          value={formData.password}
          onChange={handleInputChange}
          className="form-input"
        />

        <button
          type="submit"
          id="submit-button"
        >
          {formType === "login" ? "Login" : "Register"}
        </button>

        <p id="form-toggle-text">
          {formType === "login" ? "New here?" : "Already registered?"}{" "}
          <button
            type="button"
            id="toggle-btn"
            onClick={() => setFormType(formType === "login" ? "register" : "login")}
            className="text-blue-600 hover:underline"
          >
            {formType === "login" ? "Register" : "Login"} instead
          </button>
        </p>
      </form>
    </div>
  );
}

export default App;


