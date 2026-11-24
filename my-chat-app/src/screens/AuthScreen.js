import { useState } from "react";
import { ArrowRight, Sparkles, Eye, EyeOff } from "lucide-react";
import { useApp } from "../context/AppContext";
import { getBackend, isDemoEmail, isFirebaseConfigured } from "../services/backend";
import { DEMO_EMAIL, DEMO_PASSWORD, person } from "../services/seed";

const BUBBLES = [
  { name: "maya", size: 74, top: "9%", left: "8%", delay: 0 },
  { name: "kofi", size: 58, top: "5%", left: "60%", delay: 0.6 },
  { name: "lena", size: 92, top: "22%", left: "36%", delay: 1.2 },
  { name: "priya", size: 54, top: "31%", left: "4%", delay: 0.3 },
  { name: "zoe", size: 66, top: "28%", left: "73%", delay: 0.9 },
  { name: "arjun", size: 46, top: "46%", left: "62%", delay: 1.5 },
  { name: "isla", size: 50, top: "48%", left: "18%", delay: 0.4 },
];

const ERRORS = {
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password is too weak.",
};

export default function AuthScreen() {
  const { activate } = useApp();
  const [view, setView] = useState("welcome");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const run = async (mode, action) => {
    setError("");
    setBusy(true);
    try {
      const backend = await getBackend(mode);
      await action(backend);
      activate(mode);
    } catch (err) {
      setError(ERRORS[err.code] || err.message || "Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  const exploreDemo = () => run("demo", (b) => b.signIn(DEMO_EMAIL, DEMO_PASSWORD));

  const submit = (e) => {
    e.preventDefault();
    if (view === "register") {
      if (form.username.trim().length < 2) return setError("Your name needs at least 2 characters.");
      if (form.password.length < 6) return setError("Password must be at least 6 characters.");
      const mode = isFirebaseConfigured && !isDemoEmail(form.email) ? "firebase" : "demo";
      return run(mode, (b) => b.signUp(form));
    }
    const mode = isFirebaseConfigured && !isDemoEmail(form.email) ? "firebase" : "demo";
    return run(mode, (b) => b.signIn(form.email, form.password));
  };

  return (
    <div className="auth">
      <div className="auth-hero" aria-hidden="true">
        {BUBBLES.map((b) => (
          <img
            key={b.name}
            src={person(b.name)}
            alt=""
            className="auth-bubble"
            style={{ width: b.size, height: b.size, top: b.top, left: b.left, animationDelay: `${b.delay}s` }}
          />
        ))}
        <span className="auth-chip auth-chip--one">🎒 Hiking this Sat?</span>
        <span className="auth-chip auth-chip--two">🍸 Code &amp; Cocktails · live</span>
      </div>

      <div className="auth-sheet">
        <div className="auth-brand">
          <span className="auth-logo">buzz<b>up</b></span>
          <h1>Find your people.<br />Then actually hang out.</h1>
          <p>Join interest rooms, chat with voice notes and photos, and hop into live video hangouts.</p>
        </div>

        {view === "welcome" ? (
          <div className="auth-actions">
            <button type="button" className="btn btn--gradient btn--lg" onClick={exploreDemo} disabled={busy}>
              <Sparkles size={18} /> {busy ? "Opening BuzzUp…" : "Explore the demo"}
            </button>
            <div className="auth-row">
              <button type="button" className="btn btn--ghost" onClick={() => setView("login")}>Sign in</button>
              <button type="button" className="btn btn--dark" onClick={() => setView("register")}>Create account</button>
            </div>
            {error && <div className="form-error">{error}</div>}
            <p className="auth-hint">No sign-up needed: the demo comes with friends, rooms and conversations already loaded.</p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            {view === "register" && (
              <label className="field">
                <span>Name</span>
                <input value={form.username} onChange={update("username")} placeholder="Your name" autoComplete="name" required />
              </label>
            )}
            <label className="field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" autoComplete="email" required />
            </label>
            <div className="field">
              <label htmlFor="auth-password">Password</label>
              <div className="field-password">
                <input id="auth-password" type={showPassword ? "text" : "password"} value={form.password} onChange={update("password")} placeholder={view === "register" ? "At least 6 characters" : "••••••••"} autoComplete={view === "register" ? "new-password" : "current-password"} required />
                <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <div className="form-error">{error}</div>}
            <button type="submit" className="btn btn--dark btn--lg" disabled={busy}>
              {busy ? "Just a sec…" : view === "register" ? "Create account" : "Sign in"} <ArrowRight size={17} />
            </button>
            {view === "login" && (
              <button type="button" className="demo-fill" onClick={() => setForm((f) => ({ ...f, email: DEMO_EMAIL, password: DEMO_PASSWORD }))}>
                Use demo login <b>{DEMO_EMAIL}</b> · <b>{DEMO_PASSWORD}</b>
              </button>
            )}
            <p className="auth-switch">
              {view === "login" ? "New here?" : "Already have an account?"}{" "}
              <button type="button" onClick={() => { setError(""); setView(view === "login" ? "register" : "login"); }}>
                {view === "login" ? "Create an account" : "Sign in"}
              </button>
              {" · "}
              <button type="button" onClick={() => { setError(""); setView("welcome"); }}>Back</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
