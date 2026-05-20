import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import { getDatabase, ref, set } from "firebase/database";

const Register = ({ onToggle }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr]           = useState("");
  const [loading, setLoading]   = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErr("");

    if (username.trim().length < 2) {
      setErr("Username must be at least 2 characters.");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: username });

      // Save user profile in Firebase Realtime DB
      const db = getDatabase();
      await set(ref(db, `users/${user.uid}`), {
        uid:      user.uid,
        email:    email.toLowerCase(),
        username: username.trim(),
      });

    } catch (error) {
      const msg =
        error.code === "auth/email-already-in-use" ? "An account with this email already exists." :
        error.code === "auth/invalid-email"         ? "Invalid email address." :
        error.code === "auth/weak-password"         ? "Password is too weak." :
        "Registration failed. Please try again.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-brand">
        <div className="auth-brand-name">Buzz<span>Up</span></div>
        <div className="auth-brand-tagline">// real-time messaging</div>
      </div>

      <div className="auth-title">Create account</div>

      <form onSubmit={handleRegister}>
        <div className="auth-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            className="auth-input"
            placeholder="your_handle"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            type="email"
            className="auth-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            type="password"
            className="auth-input"
            placeholder="min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        {err && <div className="auth-error">{err}</div>}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account →"}
        </button>
      </form>

      <div className="auth-toggle">
        Already have an account?{" "}
        <button className="auth-toggle-link" onClick={onToggle}>
          Sign in
        </button>
      </div>
    </div>
  );
};

export default Register;