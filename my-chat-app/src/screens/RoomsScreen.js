import { Users, Video, MessageCircle, Plus, LogOut } from "lucide-react";
import { useApp } from "../context/AppContext";
import { AvatarStack, IconButton } from "../components/ui";
import { roomConversationId } from "../services/seed";

export default function RoomsScreen() {
  const { user, users, backend, communities, memberships, conversations, openConversation, openCall, toast } = useApp();
  const joined = communities.filter((c) => memberships.joined.includes(c.id));
  const discover = communities.filter((c) => !memberships.joined.includes(c.id));

  const join = async (c) => {
    const convId = await backend.joinCommunity(user.uid, c.id);
    toast(`You joined ${c.name} 🎉`, { label: "Open chat", onClick: () => openConversation(convId) });
  };

  const leave = async (c) => {
    await backend.leaveCommunity(user.uid, c.id);
    toast(`You left ${c.name}`);
  };

  return (
    <div className="screen">
      <header className="screen-header screen-header--left">
        <div className="screen-header-title">
          <h1>rooms</h1>
          <span>{joined.length} joined · {discover.length} to discover</span>
        </div>
      </header>

      <div className="screen-scroll">
        <div className="room-grid">
          {joined.map((c) => {
            const convId = roomConversationId(c.id);
            const conv = conversations.find((x) => x.id === convId);
            const online = c.members.filter((m) => users[m]?.online && m !== user.uid).length;
            return (
              <article key={c.id} className="room-card">
                <div className="room-card-photo">
                  <img src={c.cover} alt="" />
                  <span className="room-card-live"><i className="live-dot" /> {online} in room</span>
                  <button type="button" className="room-card-leave" onClick={() => leave(c)} aria-label={`Leave ${c.name}`} title="Leave room"><LogOut size={14} /></button>
                </div>
                <div className="room-card-body">
                  <div>
                    <h3>{c.name}</h3>
                    <span><Users size={12} /> {c.memberCount} members</span>
                  </div>
                  <AvatarStack ids={c.members.filter((m) => m !== user.uid)} users={users} max={3} size={26} extra={Math.max(0, c.memberCount - 3)} />
                </div>
                <div className="room-card-actions">
                  <button type="button" className="btn btn--soft" onClick={() => openConversation(convId)}>
                    <MessageCircle size={16} /> Chat {conv?.unread ? <span className="count">{conv.unread}</span> : null}
                  </button>
                  <button type="button" className="btn btn--gradient" onClick={() => openCall(convId)}>
                    <Video size={16} /> Join call
                  </button>
                </div>
              </article>
            );
          })}
          {joined.length === 0 && <p className="empty-note">You haven't joined a room yet. Pick one below to get started.</p>}
        </div>

        <section className="section">
          <div className="section-head"><h3>Discover rooms</h3><span>{discover.length}</span></div>
          {discover.map((c) => (
            <div key={c.id} className="room-strip room-strip--light">
              <img src={c.cover} alt="" className="room-strip-cover" />
              <div className="room-strip-meta">
                <strong>{c.name}</strong>
                <span>{c.tags.slice(0, 3).join(" · ")}</span>
              </div>
              <IconButton label={`Join ${c.name}`} onClick={() => join(c)} className="icon-btn--gradient"><Plus size={18} /></IconButton>
            </div>
          ))}
          {discover.length === 0 && <p className="empty-note">You're in every room. Social butterfly! 🦋</p>}
        </section>
      </div>
    </div>
  );
}
