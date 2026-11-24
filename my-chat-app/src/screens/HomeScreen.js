import { useRef, useState } from "react";
import { Menu, Bell, X, Star, Forward, Heart, Users, RotateCcw, Video, MessageCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { AvatarStack, IconButton } from "../components/ui";
import { roomConversationId } from "../services/seed";

function CommunityCard({ community, users, saved, onSkip, onSave, onShare, onJoin, interactive }) {
  const [drag, setDrag] = useState({ x: 0, active: false });
  const [leaving, setLeaving] = useState(null);
  const start = useRef(null);

  const finish = (dir) => {
    setLeaving(dir);
    setTimeout(() => (dir === "right" ? onJoin() : onSkip()), 260);
  };

  const pointer = {
    onPointerDown: (e) => {
      if (!interactive || e.target.closest("button")) return;
      start.current = e.clientX;
      setDrag({ x: 0, active: true });
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    onPointerMove: (e) => {
      if (start.current == null) return;
      setDrag({ x: e.clientX - start.current, active: true });
    },
    onPointerUp: () => {
      if (start.current == null) return;
      start.current = null;
      if (drag.x > 110) finish("right");
      else if (drag.x < -110) finish("left");
      setDrag({ x: 0, active: false });
    },
  };
  pointer.onPointerCancel = pointer.onPointerUp;

  const offset = leaving === "right" ? 520 : leaving === "left" ? -520 : drag.x;
  const style = {
    transform: `translateX(${offset}px) rotate(${offset / 22}deg)`,
    transition: drag.active ? "none" : "transform .28s cubic-bezier(.2,.8,.2,1)",
  };

  return (
    <article className="deck-card" style={style} {...pointer}>
      <div className="deck-photo">
        <img src={community.cover} alt="" draggable="false" />
        <div className="deck-shade" />
        {drag.x > 40 && <span className="deck-stamp deck-stamp--join">JOIN</span>}
        {drag.x < -40 && <span className="deck-stamp deck-stamp--skip">SKIP</span>}
        <div className="deck-content">
          <h2>{community.headline}</h2>
          <div className="tag-row">
            {community.tags.map((t) => <span key={t} className="tag">{t}</span>)}
          </div>
          <div className="action-pill">
            <button type="button" className="action-btn" onClick={() => finish("left")} aria-label="Skip"><X size={20} /></button>
            <button type="button" className={`action-btn ${saved ? "is-on" : ""}`} onClick={onSave} aria-label={saved ? "Unsave" : "Save for later"}>
              <Star size={19} fill={saved ? "currentColor" : "none"} />
            </button>
            <button type="button" className="action-btn" onClick={onShare} aria-label="Share"><Forward size={19} /></button>
            <button type="button" className="action-btn action-btn--love" onClick={() => finish("right")} aria-label={`Join ${community.name}`}>
              <Heart size={20} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
      <footer className="deck-footer">
        <AvatarStack ids={community.members} users={users} max={3} size={34} extra={Math.max(0, community.memberCount - 3)} dark />
        <div className="deck-meta">
          <strong>{community.name}</strong>
          <span><Users size={13} /> {community.memberCount} members</span>
        </div>
      </footer>
    </article>
  );
}

export default function HomeScreen({ onOpenMenu, onOpenNotifications }) {
  const { user, users, backend, communities, memberships, unreadNotifications, toast, openConversation, openCall, conversations } = useApp();
  const joined = communities.filter((c) => memberships.joined.includes(c.id));
  const deck = communities.filter((c) => !memberships.joined.includes(c.id) && !memberships.skipped.includes(c.id));
  const live = joined[joined.length - 1] || joined[0];
  const [top, next] = deck;

  const join = async (c) => {
    const convId = await backend.joinCommunity(user.uid, c.id);
    toast(`You joined ${c.name} 🎉`, { label: "Say hi", onClick: () => openConversation(convId) });
  };

  const share = async (c) => {
    const link = `${window.location.origin}${window.location.pathname}#room/${c.id}`;
    try {
      if (navigator.share) await navigator.share({ title: c.name, text: c.headline, url: link });
      else { await navigator.clipboard.writeText(link); toast("Invite link copied to clipboard"); }
    } catch { /* share sheet dismissed */ }
  };

  return (
    <div className="screen screen--home">
      <header className="screen-header">
        <IconButton label="Menu" onClick={onOpenMenu}><Menu size={19} /></IconButton>
        <div className="screen-header-title"><h1 className="brand-title">buzzup</h1></div>
        <div className="bell-wrap">
          {unreadNotifications > 0 && <span className="bell-count">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>}
          <IconButton label="Notifications" onClick={onOpenNotifications}><Bell size={19} /></IconButton>
        </div>
      </header>

      <div className="screen-scroll">
        {live && (
          <button type="button" className="live-room" onClick={() => openCall(roomConversationId(live.id))}>
            <AvatarStack ids={live.members.filter((m) => m !== user.uid)} users={users} max={3} size={40} extra={Math.max(0, live.memberCount - 3)} />
            <div className="live-room-meta">
              <strong>{live.name}</strong>
              <span><span className="live-dot" /> Live now · {live.memberCount} Members</span>
            </div>
          </button>
        )}

        <div className="deck">
          {top ? (
            <>
              {next && <div className="deck-ghost" aria-hidden="true"><img src={next.cover} alt="" /></div>}
              <CommunityCard
                key={top.id}
                community={top}
                users={users}
                interactive
                saved={memberships.saved.includes(top.id)}
                onSkip={() => backend.skipCommunity(user.uid, top.id)}
                onSave={() => {
                  const wasSaved = memberships.saved.includes(top.id);
                  backend.toggleSaveCommunity(user.uid, top.id);
                  toast(wasSaved ? "Removed from saved" : `Saved ${top.name} for later ⭐`);
                }}
                onShare={() => share(top)}
                onJoin={() => join(top)}
              />
            </>
          ) : (
            <div className="deck-empty">
              <span className="deck-empty-icon"><Heart size={26} /></span>
              <h2>You're all caught up</h2>
              <p>New rooms land every week. Revisit the ones you skipped?</p>
              <button type="button" className="btn btn--dark" onClick={() => backend.resetDeck(user.uid)}>
                <RotateCcw size={16} /> Show skipped rooms
              </button>
            </div>
          )}
        </div>
        <p className="deck-hint">Swipe right or tap ♥ to join · swipe left to skip</p>

        <section className="section">
          <div className="section-head">
            <h3>Your rooms</h3>
            <span>{joined.length}</span>
          </div>
          {joined.map((c) => {
            const conv = conversations.find((x) => x.id === roomConversationId(c.id));
            return (
              <div key={c.id} className="room-strip">
                <img src={c.cover} alt="" className="room-strip-cover" />
                <div className="room-strip-meta">
                  <strong>{c.name}</strong>
                  <span><Users size={12} /> {c.memberCount} members</span>
                </div>
                <div className="room-strip-actions">
                  <IconButton dark label={`Open ${c.name} chat`} badge={conv?.unread} onClick={() => openConversation(roomConversationId(c.id))}>
                    <MessageCircle size={17} />
                  </IconButton>
                  <IconButton dark label={`Join ${c.name} video room`} onClick={() => openCall(roomConversationId(c.id))}>
                    <Video size={17} />
                  </IconButton>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
