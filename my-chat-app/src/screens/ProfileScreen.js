import { useState } from "react";
import { MapPin, Pencil, Languages, LogOut, RotateCcw, Bell, ChevronRight, Check } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Avatar } from "../components/ui";
import languages from "../utils/languages";

const INTEREST_OPTIONS = ["Hiking", "Running", "Bouldering", "Design", "Tech", "Photography", "Music", "Travel", "CraftBeer", "Mixology", "Yoga", "Coffee", "Food", "Startups"];

export default function ProfileScreen() {
  const { user, backend, memberships, conversations, translateLang, setTranslateLang, toast, mode } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ username: user.username, bio: user.bio || "", city: user.city || "", interests: user.interests || [] });
  const [notifOn, setNotifOn] = useState(true);

  const save = async () => {
    if (draft.username.trim().length < 2) return toast("Name needs at least 2 characters");
    await backend.updateProfile(user.uid, { ...draft, username: draft.username.trim() });
    setEditing(false);
    toast("Profile updated ✨");
  };

  const toggleInterest = (i) =>
    setDraft((d) => ({ ...d, interests: d.interests.includes(i) ? d.interests.filter((x) => x !== i) : [...d.interests, i] }));

  return (
    <div className="screen">
      <div className="screen-scroll screen-scroll--top">
        <section className="profile-hero">
          <div className="profile-photo">
            <Avatar user={user} size={112} />
          </div>
          {editing ? (
            <div className="profile-edit">
              <label className="field"><span>Name</span><input value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} /></label>
              <label className="field"><span>City</span><input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} placeholder="Where are you based?" /></label>
              <label className="field"><span>Bio</span><textarea rows={2} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} maxLength={120} /></label>
              <div className="field"><span>Interests</span>
                <div className="chip-picker">
                  {INTEREST_OPTIONS.map((i) => (
                    <button type="button" key={i} className={`chip ${draft.interests.includes(i) ? "is-on" : ""}`} onClick={() => toggleInterest(i)}>
                      {draft.interests.includes(i) && <Check size={12} />} {i}
                    </button>
                  ))}
                </div>
              </div>
              <div className="auth-row">
                <button type="button" className="btn btn--ghost" onClick={() => setEditing(false)}>Cancel</button>
                <button type="button" className="btn btn--dark" onClick={save}>Save profile</button>
              </div>
            </div>
          ) : (
            <>
              <h1>{user.username}</h1>
              <p className="profile-sub">
                {user.handle ? `@${user.handle}` : user.email}
                {user.city && <><span>·</span><MapPin size={12} /> {user.city}</>}
              </p>
              {user.bio && <p className="profile-bio">{user.bio}</p>}
              <div className="tag-row tag-row--light tag-row--center">
                {(user.interests || []).map((i) => <span key={i} className="tag">{i}</span>)}
              </div>
              <button type="button" className="btn btn--soft btn--sm" onClick={() => { setDraft({ username: user.username, bio: user.bio || "", city: user.city || "", interests: user.interests || [] }); setEditing(true); }}>
                <Pencil size={14} /> Edit profile
              </button>
            </>
          )}
        </section>

        <div className="stats">
          <div><strong>{memberships.joined.length}</strong><span>Rooms</span></div>
          <div><strong>{conversations.filter((c) => c.type === "dm").length}</strong><span>Chats</span></div>
          <div><strong>{memberships.saved.length}</strong><span>Saved</span></div>
        </div>

        <div className="settings">
          <label className="setting">
            <span className="setting-icon"><Languages size={17} /></span>
            <span className="setting-body"><strong>Translate messages to</strong><small>Used by the translate action in chats</small></span>
            <select value={translateLang} onChange={(e) => setTranslateLang(e.target.value)}>
              {languages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </label>
          <button type="button" className="setting" onClick={() => setNotifOn((n) => !n)}>
            <span className="setting-icon"><Bell size={17} /></span>
            <span className="setting-body"><strong>Message notifications</strong><small>{notifOn ? "On for all rooms and chats" : "Muted"}</small></span>
            <span className={`switch ${notifOn ? "is-on" : ""}`} aria-hidden="true"><i /></span>
          </button>
          {mode === "demo" && backend.resetDemo && (
            <button type="button" className="setting" onClick={async () => { await backend.resetDemo(); toast("Demo data restored"); }}>
              <span className="setting-icon"><RotateCcw size={17} /></span>
              <span className="setting-body"><strong>Reset demo data</strong><small>Restore the original people, rooms and chats</small></span>
              <ChevronRight size={16} />
            </button>
          )}
          <button type="button" className="setting setting--danger" onClick={() => backend.signOut()}>
            <span className="setting-icon"><LogOut size={17} /></span>
            <span className="setting-body"><strong>Sign out</strong><small>{user.email || user.username}</small></span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
