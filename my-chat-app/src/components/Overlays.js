import { X, House, Users, MessagesSquare, Heart, User, LogOut, CheckCheck, BellOff } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Avatar } from "./ui";
import { relativeTime, firstName } from "../utils/format";

export function NotificationsSheet({ onClose }) {
  const { user, users, notifications, conversations, backend, openConversation } = useApp();
  const recent = notifications.slice(0, 30);

  const open = (n) => {
    onClose();
    openConversation(n.convId);
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Notifications">
        <div className="sheet-grip" />
        <div className="sheet-head">
          <h2>Notifications</h2>
          <div className="sheet-head-actions">
            <button type="button" className="text-btn" onClick={() => backend.markAllNotificationsRead(user.uid)}><CheckCheck size={15} /> Mark all read</button>
            <button type="button" className="icon-btn icon-btn--sm" onClick={onClose} aria-label="Close"><X size={16} /></button>
          </div>
        </div>
        <div className="sheet-body">
          {recent.length === 0 && (
            <div className="empty-state"><BellOff size={26} /><p>You're all caught up</p></div>
          )}
          {recent.map((n) => {
            const from = users[n.from] || { username: "Someone" };
            const conv = conversations.find((c) => c.id === n.convId);
            const where = conv?.type === "group" ? ` in ${conv.title}` : "";
            return (
              <button type="button" key={n.id} className={`notif ${n.read ? "" : "is-unread"}`} onClick={() => open(n)}>
                <Avatar user={from} size={42} />
                <div className="notif-body">
                  <p><strong>{firstName(from.username)}</strong>{where}</p>
                  <span>{n.text}</span>
                </div>
                <time>{relativeTime(n.timestamp)}</time>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const LINKS = [
  { id: "home", label: "Home", Icon: House },
  { id: "rooms", label: "Rooms", Icon: Users },
  { id: "chats", label: "Messages", Icon: MessagesSquare },
  { id: "foryou", label: "For you", Icon: Heart },
  { id: "profile", label: "Profile", Icon: User },
];

export function MenuDrawer({ onClose }) {
  const { user, goTab, tab, backend, mode } = useApp();
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()} aria-label="Menu">
        <div className="drawer-user">
          <Avatar user={user} size={52} />
          <div>
            <strong>{user.username}</strong>
            <span>{user.email || `@${user.handle}`}</span>
          </div>
        </div>
        <nav className="drawer-nav">
          {LINKS.map(({ id, label, Icon }) => (
            <button type="button" key={id} className={tab === id ? "is-active" : ""} onClick={() => { goTab(id); onClose(); }}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        {mode === "demo" && (
          <div className="drawer-note">
            <strong>Demo mode</strong>
            <p>Everything is stored in this browser. Open a second tab, sign out and tap <b>Explore as Maya</b> to chat with yourself in real time.</p>
          </div>
        )}
        <button type="button" className="drawer-signout" onClick={() => backend.signOut()}><LogOut size={17} /> Sign out</button>
      </aside>
    </div>
  );
}
