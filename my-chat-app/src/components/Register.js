import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import { getDatabase, ref, set } from "firebase/database";

const Register = ({ onToggle }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(userCredential.user, {
        displayName: username,
      });
      const db = getDatabase();
      await set(ref(db, `users/${user.uid}`), {
        uid: user.uid,
        email: email.toLowerCase(),
        username: username,
      });
      
      
    } catch (error) {
      setErr("Registration failed");
    }
  };

  return (
    <form id="auth-form" onSubmit={handleRegister}>
      <div id="form-title">Register</div>
      <input
        type="text"
        placeholder="Username"
        className="form-input"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
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
      <button type="submit" id="submit-btn">Register</button>
      {err && <p style={{ color: "red", marginTop: "10px" }}>{err}</p>}
      <p style={{ marginTop: "10px" }}>
        Already have an account?{" "}
        <span style={{ color: "blue", cursor: "pointer" }} onClick={onToggle}>
          Login here
        </span>
      </p>
    </form>
  );
};

export default Register;
