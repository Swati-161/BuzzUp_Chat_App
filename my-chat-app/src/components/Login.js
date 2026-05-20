import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const Login = ({ onToggle }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const msg =
        error.code === "auth/user-not-found" ? "No account found with this email." :
        error.code === "auth/wrong-password"  ? "Incorrect password." :
        error.code === "auth/invalid-email"   ? "Invalid email address." :
        "Login failed. Please try again.";
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

      <div className="auth-title">Sign in</div>

      <form onSubmit={handleLogin}>
        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
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
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="auth-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {err && <div className="auth-error">{err}</div>}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in →"}
        </button>
      </form>

      <div className="auth-toggle">
        No account?{" "}
        <button className="auth-toggle-link" onClick={onToggle}>
          Create one
        </button>
      </div>
    </div>
  );
};

export default Login;