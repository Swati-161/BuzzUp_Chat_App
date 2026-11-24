import { Star, MapPin, MessageCircle, Plus, Check } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Avatar } from "../components/ui";
import { firstName } from "../utils/format";

export default function ForYouScreen() {
  const { user, users, backend, communities, memberships, openConversation, toast } = useApp();
  const saved = communities.filter((c) => memberships.saved.includes(c.id));
  const mine = new Set(user.interests || []);

  const people = Object.values(users)
    .filter((u) => u.uid !== user.uid)
    .map((u) => ({ ...u, shared: (u.interests || []).filter((i) => mine.has(i)) }))
    .sort((a, b) => b.shared.length - a.shared.length || Number(b.online) - Number(a.online))
    .slice(0, 8);

  const sayHi = async (u) => {
    const convId = await backend.openDirect(user.uid, u.uid);
    openConversation(convId);
  };

  const join = async (c) => {
    const convId = await backend.joinCommunity(user.uid, c.id);
    toast(`You joined ${c.name} 🎉`, { label: "Say hi", onClick: () => openConversation(convId) });
  };

  return (
    <div className="screen">
      <header className="screen-header screen-header--left">
        <div className="screen-header-title">
          <h1>for you</h1>
          <span>People and rooms picked from your interests</span>
        </div>
      </header>

      <div className="screen-scroll">
        <section className="section section--flush">
          <div className="section-head"><h3>People you'll vibe with</h3><span>{people.length}</span></div>
          <div className="people-carousel">
            {people.map((u) => (
              <article key={u.uid} className="person-card">
                <div className="person-photo">
                  {u.avatar ? <img src={u.avatar} alt={u.username} /> : <Avatar user={u} size={80} />}
                  {u.online && <span className="person-online">Online</span>}
                </div>
                <div className="person-body">
                  <strong>{u.username}</strong>
                  {u.city && <span><MapPin size={11} /> {u.city}</span>}
                  <div className="tag-row tag-row--light">
                    {(u.shared.length ? u.shared : u.interests || []).slice(0, 2).map((i) => <span key={i} className="tag">{i}</span>)}
                  </div>
                  <button type="button" className="btn btn--dark btn--sm" onClick={() => sayHi(u)}>
                    <MessageCircle size={14} /> Say hi to {firstName(u.username)}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head"><h3>Saved rooms</h3><span>{saved.length}</span></div>
          {saved.length === 0 && (
            <div className="hint-card">
              <Star size={18} />
              <p>Tap the ☆ on any room card on Home to save it for later.</p>
            </div>
          )}
          {saved.map((c) => {
            const isJoined = memberships.joined.includes(c.id);
            return (
              <div key={c.id} className="room-strip room-strip--light">
                <img src={c.cover} alt="" className="room-strip-cover" />
                <div className="room-strip-meta">
                  <strong>{c.name}</strong>
                  <span>{c.headline}</span>
                </div>
                <button type="button" className={`pill-btn ${isJoined ? "pill-btn--done" : ""}`} onClick={() => !isJoined && join(c)} disabled={isJoined}>
                  {isJoined ? <><Check size={13} /> Joined</> : <><Plus size={13} /> Join</>}
                </button>
                <button type="button" className="star-btn" onClick={() => backend.toggleSaveCommunity(user.uid, c.id)} aria-label="Remove from saved">
                  <Star size={16} fill="currentColor" />
                </button>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
