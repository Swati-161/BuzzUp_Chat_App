import { useEffect, useState } from "react";
import { Search, X, Users } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Avatar, AvatarStack } from "../components/ui";
import { messagePreview, relativeTime, firstName } from "../utils/format";

export default function ChatsScreen() {
  const { user, users, conversations, backend, openConversation } = useApp();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(() => backend.searchUsers(query, user.uid).then(setResults).catch(() => setResults([])), 200);
    return () => clearTimeout(t);
  }, [query, backend, user.uid]);

  const online = Object.values(users).filter((u) => u.online && u.uid !== user.uid).slice(0, 10);
  const list = conversations.filter((c) => filter === "all" || (filter === "rooms" ? c.type === "group" : c.type === "dm") || (filter === "unread" && c.unread > 0));

  const startChat = async (other) => {
    const convId = await backend.openDirect(user.uid, other);
    setQuery("");
    openConversation(convId);
  };

  return (
    <div className="screen">
      <header className="screen-header screen-header--left">
        <div className="screen-header-title">
          <h1>messages</h1>
          <span>{conversations.reduce((s, c) => s + c.unread, 0)} unread</span>
        </div>
      </header>

      <div className="screen-scroll">
        <div className="search">
          <Search size={17} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people by name" aria-label="Search people" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button>}
        </div>

        {query ? (
          <div className="list">
            {results.length === 0 && <p className="empty-note">No one matches “{query}” yet.</p>}
            {results.map((u) => (
              <button type="button" key={u.uid} className="list-row" onClick={() => startChat(u.uid)}>
                <Avatar user={users[u.uid] || u} size={46} online={users[u.uid]?.online} />
                <div className="list-row-body">
                  <strong>{u.username}</strong>
                  <span>{u.bio || (u.handle ? `@${u.handle}` : "")}</span>
                </div>
                <span className="pill-btn">Message</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {online.length > 0 && (
              <div className="online-row" aria-label="Online now">
                {online.map((u) => (
                  <button type="button" key={u.uid} className="online-person" onClick={() => startChat(u.uid)}>
                    <Avatar user={u} size={54} online />
                    <span>{firstName(u.username)}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="segmented" role="tablist">
              {["all", "unread", "rooms", "people"].map((f) => (
                <button type="button" key={f} role="tab" aria-selected={filter === f} className={filter === f ? "is-active" : ""} onClick={() => setFilter(f)}>
                  {f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className="list">
              {list.length === 0 && <p className="empty-note">Nothing here yet. Search for someone to start a conversation.</p>}
              {list.map((c) => (
                <button type="button" key={c.id} className={`list-row ${c.unread ? "is-unread" : ""}`} onClick={() => openConversation(c.id)}>
                  {c.type === "group" ? (
                    <span className="room-thumb">
                      <img src={c.cover} alt="" />
                      <span className="room-thumb-badge"><Users size={11} /></span>
                    </span>
                  ) : (
                    <Avatar user={users[c.otherId] || { username: c.title, avatar: c.avatar }} size={50} online={users[c.otherId]?.online} />
                  )}
                  <div className="list-row-body">
                    <strong>{c.title}</strong>
                    <span>{messagePreview(c.lastMessage, users, user.uid)}</span>
                  </div>
                  <div className="list-row-side">
                    <time>{relativeTime(c.lastMessage?.timestamp)}</time>
                    {c.unread > 0 ? <span className="count">{c.unread}</span> : c.type === "group" ? <AvatarStack ids={c.members.filter((m) => m !== user.uid)} users={users} max={2} size={18} extra={0} /> : null}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
