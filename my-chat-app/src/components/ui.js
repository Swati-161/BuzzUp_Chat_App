import { Heart, Users, House, MessagesSquare, User } from "lucide-react";
import { useApp } from "../context/AppContext";

const GRADIENTS = [
  ["#ff9a4d", "#f7728c"],
  ["#7f8cff", "#b36bff"],
  ["#34c6a3", "#2a9df4"],
  ["#f7b733", "#fc4a1a"],
  ["#ee6fa8", "#8a5cf6"],
];

export function Avatar({ user, size = 40, ring = false, online = false, className = "" }) {
  const name = user?.username || "?";
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const [a, b] = GRADIENTS[(name.charCodeAt(0) || 0) % GRADIENTS.length];
  return (
    <span
      className={`avatar ${ring ? "avatar--ring" : ""} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {user?.avatar ? (
        <img src={user.avatar} alt={name} loading="lazy" />
      ) : (
        <span className="avatar-initials" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>{initials}</span>
      )}
      {online && <span className="avatar-online" />}
    </span>
  );
}

export function AvatarStack({ ids = [], users = {}, max = 3, size = 38, extra, dark = false }) {
  const shown = ids.slice(0, max);
  const more = extra ?? Math.max(0, ids.length - max);
  return (
    <div className={`avatar-stack ${dark ? "avatar-stack--dark" : ""}`}>
      {shown.map((id) => (
        <Avatar key={id} user={users[id] || { username: "?" }} size={size} ring />
      ))}
      {more > 0 && (
        <span className="avatar-more" style={{ width: size + 4, height: size + 4 }}>+{more}</span>
      )}
    </div>
  );
}

export function IconButton({ children, label, onClick, dark = false, badge, className = "", ...rest }) {
  return (
    <button type="button" className={`icon-btn ${dark ? "icon-btn--dark" : ""} ${className}`} onClick={onClick} aria-label={label} title={label} {...rest}>
      {badge ? <span className="badge">{badge > 9 ? "9+" : badge}</span> : null}
      {children}
    </button>
  );
}

const NAV = [
  { id: "foryou", label: "For you", Icon: Heart },
  { id: "rooms", label: "Rooms", Icon: Users },
  { id: "home", label: "Home", Icon: House },
  { id: "chats", label: "Messages", Icon: MessagesSquare },
  { id: "profile", label: "Profile", Icon: User },
];

export function BottomNav() {
  const { tab, goTab, conversations } = useApp();
  const unread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
  return (
    <nav className="bottom-nav" aria-label="Main">
      {NAV.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`nav-btn ${tab === id ? "is-active" : ""}`}
          onClick={() => goTab(id)}
          aria-label={label}
          aria-current={tab === id ? "page" : undefined}
          title={label}
        >
          <Icon size={20} strokeWidth={tab === id ? 2.2 : 1.7} fill={tab === id && id === "foryou" ? "currentColor" : "none"} />
          {id === "chats" && unread > 0 && <span className="nav-dot">{unread > 9 ? "9+" : unread}</span>}
        </button>
      ))}
    </nav>
  );
}

export function Toast() {
  const { toastState } = useApp();
  if (!toastState) return null;
  return (
    <div className="toast" key={toastState.id} role="status">
      <span>{toastState.message}</span>
      {toastState.action && (
        <button type="button" onClick={toastState.action.onClick}>{toastState.action.label}</button>
      )}
    </div>
  );
}

export function ScreenHeader({ left, title, right, subtitle }) {
  return (
    <header className="screen-header">
      <div className="screen-header-side">{left}</div>
      <div className="screen-header-title">
        <h1>{title}</h1>
        {subtitle && <span>{subtitle}</span>}
      </div>
      <div className="screen-header-side screen-header-side--right">{right}</div>
    </header>
  );
}
