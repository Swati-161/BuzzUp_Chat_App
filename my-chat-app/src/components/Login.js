import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase"; // ensure firebase.js is configured correctly

const Login = ({ onToggle }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
    } catch (error) {
      setErr("Invalid credentials");
    }
  };

  return (
    <form id="auth-form" onSubmit={handleLogin}>
      <div id="form-title">Login</div>
      <input
        type="email"
        placeholder="Email"
        className="form-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        className="form-input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" id="submit-btn">Login</button>
      {err && <p style={{ color: "red", marginTop: "10px" }}>{err}</p>}
      <p style={{ marginTop: "10px" }}>
        Don’t have an account?{" "}
        <span style={{ color: "blue", cursor: "pointer" }} onClick={onToggle}>
          Register here
        </span>
      </p>
    </form>
  );
};

export default Login;
