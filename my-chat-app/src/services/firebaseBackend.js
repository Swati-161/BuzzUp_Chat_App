import { initializeApp } from "firebase/app";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile as updateAuthProfile, signOut as authSignOut,
} from "firebase/auth";
import {
  getDatabase, ref, onValue, get, set, update, push, remove, query, limitToLast, onDisconnect,
} from "firebase/database";
import axios from "axios";
import firebaseConfig from "../firebase";
import { COMMUNITIES, roomConversationId, directConversationId } from "./seed";
import { compressImage, translateWithMyMemory } from "./media";

const API = process.env.REACT_APP_API_URL || "";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const r = (path) => ref(db, path);

const absolute = (url) => (!url || /^(https?:|data:|blob:)/.test(url) ? url : `${API}${url}`);
const keys = (obj) => Object.keys(obj || {});
const communityOf = (convId) => COMMUNITIES.find((c) => roomConversationId(c.id) === convId);
const PROFILE_FIELDS = ["uid", "username", "avatar", "bio", "interests", "city"];
const publicProfile = (p) => Object.fromEntries(PROFILE_FIELDS.filter((k) => p[k] !== undefined).map((k) => [k, p[k]]));

function currentUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You're signed out. Please sign in again.");
  return uid;
}

function normalizeMessage(id, raw) {
  let { type, media = [] } = raw;
  if (type === "media") {
    type = { image: "image", video: "video", audio: "voice" }[raw.mediaType] || "image";
    media = [absolute(raw.compressedVideo || raw.mediaUrl)];
  }
  const readBy = raw.readBy ? keys(raw.readBy) : [raw.sender, ...(raw.read && raw.receiver ? [raw.receiver] : [])];
  const reactions = Object.fromEntries(Object.entries(raw.reactions || {}).map(([emoji, uids]) => [emoji, keys(uids)]));
  return { id, sender: raw.sender, type, text: raw.text || "", media: media.map(absolute), duration: raw.duration || null, timestamp: raw.timestamp, readBy, reactions };
}

async function membersOf(convId) {
  if (convId.startsWith("room-")) {
    const snap = await get(r(`Rooms/${convId.slice(5)}/members`));
    return keys(snap.val());
  }
  return convId.split("_");
}

function preview(msg) {
  if (msg.type === "text") return msg.text;
  if (msg.type === "voice") return "🎤 Voice message";
  if (msg.type === "video") return "🎬 Video";
  return msg.text || "📷 Photo";
}

function viewFor(convId, me, { last, unread, members, users }) {
  const base = { id: convId, lastMessage: last, unread, updatedAt: last?.timestamp || 0, members };
  const community = communityOf(convId);
  if (community) {
    return { ...base, type: "group", title: community.name, cover: community.cover, communityId: community.id, memberCount: members.length };
  }
  const otherId = convId.split("_").find((p) => p !== me) || me;
  const other = users[otherId] || {};
  return { ...base, type: "dm", title: other.username || "Unknown", otherId, avatar: other.avatar || null };
}

const api = {
  mode: "firebase",

  onAuthChange(cb) {
    let profileUnsub = () => {};
    const unsub = onAuthStateChanged(auth, (user) => {
      profileUnsub();
      if (!user) return cb(null);
      const statusRef = r(`status/${user.uid}`);
      set(statusRef, { online: true, lastSeen: Date.now() });
      onDisconnect(statusRef).set({ online: false, lastSeen: Date.now() });
      profileUnsub = onValue(r(`profiles/${user.uid}`), async (snap) => {
        if (!snap.exists()) {
          const legacy = (await get(r(`users/${user.uid}`)).catch(() => null))?.val() || {};
          await set(r(`profiles/${user.uid}`), { uid: user.uid, username: legacy.username || user.displayName || "BuzzUp user" });
          return;
        }
        const p = snap.val() || {};
        cb({ uid: user.uid, email: user.email, username: p.username || user.displayName || user.email?.split("@")[0], avatar: p.avatar || null, bio: p.bio || "", interests: p.interests || [], city: p.city || "" });
      });
    });
    return () => { profileUnsub(); unsub(); };
  },

  async signIn(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  },

  async signUp({ username, email, password }) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateAuthProfile(user, { displayName: username.trim() });
    await set(r(`profiles/${user.uid}`), { uid: user.uid, username: username.trim() });
    await set(r(`users/${user.uid}`), { uid: user.uid, email: email.toLowerCase(), username: username.trim() });
  },

  async signOut() {
    const me = auth.currentUser?.uid;
    if (me) {
      await set(r(`status/${me}`), { online: false, lastSeen: Date.now() });
      await remove(r(`ActiveChats/${me}`));
    }
    await authSignOut(auth);
  },

  async updateProfile(me, patch) {
    await update(r(`profiles/${currentUid()}`), publicProfile(patch));
  },

  subscribeUsers(cb) {
    let users = {};
    let status = {};
    const emit = () => {
      const map = {};
      Object.entries(users).forEach(([id, u]) => { map[id] = { ...publicProfile(u), uid: id, online: !!status[id]?.online }; });
      cb(map);
    };
    const a = onValue(r("profiles"), (s) => { users = s.val() || {}; emit(); }, () => cb({}));
    const b = onValue(r("status"), (s) => { status = s.val() || {}; emit(); }, () => {});
    return () => { a(); b(); };
  },

  async searchUsers(q, me) {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const snap = await get(r("profiles"));
    return Object.entries(snap.val() || {})
      .map(([id, u]) => ({ ...publicProfile(u), uid: id }))
      .filter((u) => u.uid !== me && u.username?.toLowerCase().includes(term))
      .slice(0, 10);
  },

  subscribeConversations(me, cb) {
    const subs = {};
    let entries = {};
    let notifs = [];
    let users = {};
    const lasts = {};
    const members = {};

    const emit = () => {
      const list = Object.keys(entries).map((key) => {
        const convId = key.startsWith("room-") ? key : directConversationId(me, key);
        const unread = notifs.filter((n) => !n.read && (n.convId ? n.convId === convId : n.from === key)).length;
        return viewFor(convId, me, { last: lasts[convId] || null, unread, members: members[convId] || convId.split("_"), users });
      });
      cb(list.sort((x, y) => y.updatedAt - x.updatedAt));
    };

    const chatUnsub = onValue(r(`Chatlist/${me}`), (snap) => {
      entries = snap.val() || {};
      Object.keys(entries).forEach((key) => {
        const convId = key.startsWith("room-") ? key : directConversationId(me, key);
        if (subs[convId]) return;
        const unsubs = [onValue(query(r(`Messages/${convId}`), limitToLast(1)), (s) => {
          const [id, raw] = Object.entries(s.val() || {})[0] || [];
          lasts[convId] = id ? normalizeMessage(id, raw) : null;
          emit();
        })];
        if (key.startsWith("room-")) {
          unsubs.push(onValue(r(`Rooms/${key.slice(5)}/members`), (s) => { members[convId] = keys(s.val()); emit(); }));
        }
        subs[convId] = () => unsubs.forEach((u) => u());
      });
      emit();
    });
    const notifUnsub = onValue(r(`Notifications/${me}`), (s) => {
      notifs = Object.values(s.val() || {});
      emit();
    });
    const usersUnsub = api.subscribeUsers((u) => { users = u; emit(); });

    return () => {
      chatUnsub(); notifUnsub(); usersUnsub();
      Object.values(subs).forEach((u) => u());
    };
  },

  subscribeConversation(convId, me, cb) {
    let last = null;
    let members = convId.startsWith("room-") ? [] : convId.split("_");
    let users = {};
    const emit = () => cb(viewFor(convId, me, { last, unread: 0, members, users }));
    const unsubs = [
      onValue(query(r(`Messages/${convId}`), limitToLast(1)), (s) => {
        const [id, raw] = Object.entries(s.val() || {})[0] || [];
        last = id ? normalizeMessage(id, raw) : null;
        emit();
      }),
      api.subscribeUsers((u) => { users = u; emit(); }),
    ];
    if (convId.startsWith("room-")) {
      unsubs.push(onValue(r(`Rooms/${convId.slice(5)}/members`), (s) => { members = keys(s.val()); emit(); }));
    }
    return () => unsubs.forEach((u) => u());
  },

  async openDirect(me, other) {
    return directConversationId(me, other);
  },

  subscribeMessages(convId, cb) {
    return onValue(r(`Messages/${convId}`), (snap) => {
      const list = Object.entries(snap.val() || {}).map(([id, raw]) => normalizeMessage(id, raw));
      cb(list.sort((a, b) => a.timestamp - b.timestamp));
    });
  },

  subscribeTyping(convId, cb) {
    cb(null);
    return () => {};
  },

  async sendMessage(convId, _sender, payload) {
    const sender = currentUid();
    const isRoom = convId.startsWith("room-");
    const members = await membersOf(convId);
    const receiver = isRoom ? null : members.find((m) => m !== sender);
    const msg = { sender, timestamp: Date.now(), text: "", media: [], ...payload, readBy: { [sender]: true }, read: false };
    if (receiver) msg.receiver = receiver;
    await push(r(`Messages/${convId}`), msg);

    if (receiver) {
      await update(r(), { [`Chatlist/${sender}/${receiver}`]: true, [`Chatlist/${receiver}/${sender}`]: true });
    }
    await Promise.all(members.filter((m) => m !== sender).map(async (m) => {
      const active = (await get(r(`ActiveChats/${m}`))).val();
      if (active === convId || active === sender) return;
      await push(r(`Notifications/${m}`), { type: "message", from: sender, to: m, convId, text: preview(msg), timestamp: Date.now(), read: false });
    }));
  },

  async toggleReaction(convId, msgId, _me, emoji) {
    const me = currentUid();
    const path = `Messages/${convId}/${msgId}/reactions/${emoji}/${me}`;
    const snap = await get(r(path));
    if (snap.exists()) await remove(r(path));
    else await set(r(path), true);
  },

  async setActiveConversation(_me, convId) {
    const me = auth.currentUser?.uid;
    if (!me) return;
    if (!convId) return remove(r(`ActiveChats/${me}`));
    await set(r(`ActiveChats/${me}`), convId);
    const updates = {};
    const msgs = (await get(r(`Messages/${convId}`))).val() || {};
    Object.entries(msgs).forEach(([id, m]) => {
      if (m.sender === me) return;
      if (!m.readBy?.[me]) updates[`Messages/${convId}/${id}/readBy/${me}`] = true;
      if (m.receiver === me && !m.read) updates[`Messages/${convId}/${id}/read`] = true;
    });
    const other = convId.startsWith("room-") ? null : convId.split("_").find((p) => p !== me);
    const notifs = (await get(r(`Notifications/${me}`))).val() || {};
    Object.entries(notifs).forEach(([id, n]) => {
      if (!n.read && (n.convId === convId || (!n.convId && n.from === other))) updates[`Notifications/${me}/${id}/read`] = true;
    });
    if (Object.keys(updates).length) await update(r(), updates);
  },

  subscribeNotifications(me, cb) {
    return onValue(r(`Notifications/${me}`), (snap) => {
      const list = Object.entries(snap.val() || {}).map(([id, n]) => ({ id, ...n, read: !!n.read }));
      list.forEach((n) => { if (!n.convId && n.from) n.convId = directConversationId(me, n.from); });
      cb(list.sort((a, b) => b.timestamp - a.timestamp));
    });
  },

  async markAllNotificationsRead() {
    const me = currentUid();
    const notifs = (await get(r(`Notifications/${me}`))).val() || {};
    const updates = {};
    Object.keys(notifs).forEach((id) => { updates[`Notifications/${me}/${id}/read`] = true; });
    if (Object.keys(updates).length) await update(r(), updates);
  },

  async uploadMedia(file) {
    const kind = file.type.split("/")[0];
    try {
      const form = new FormData();
      form.append("file", file);
      const token = await auth.currentUser.getIdToken();
      const { data } = await axios.post(`${API}/api/upload`, form, { headers: { Authorization: `Bearer ${token}` } });
      const type = kind === "audio" ? "voice" : kind;
      return { type, url: absolute(data.compressedVideo || data.originalUrl), duration: data.duration || null };
    } catch (err) {
      if (kind === "image") return { type: "image", url: await compressImage(file, 800, 0.7) };
      throw new Error("Upload failed. The media server may be waking up — try again in a minute.");
    }
  },

  async translate(text, target) {
    try {
      const { data } = await axios.post(`${API}/api/translate`, { text, targetLanguage: target });
      if (data?.translatedText) return data.translatedText;
    } catch { /* fall back to the public translator */ }
    return translateWithMyMemory(text, target);
  },

  listCommunities() {
    return COMMUNITIES;
  },

  subscribeCommunities(cb) {
    return onValue(r("Rooms"), (snap) => {
      const rooms = snap.val() || {};
      cb(COMMUNITIES.map((c) => {
        const real = keys(rooms[c.id]?.members);
        return { ...c, members: real.length ? real : c.members, memberCount: Math.max(c.memberCount, real.length) };
      }));
    }, () => cb(COMMUNITIES));
  },

  subscribeMemberships(me, cb) {
    return onValue(r(`Memberships/${me}`), (snap) => {
      const m = snap.val() || {};
      cb({ joined: keys(m.joined), saved: keys(m.saved), skipped: keys(m.skipped) });
    });
  },

  async joinCommunity(_me, cid) {
    const me = currentUid();
    const convId = roomConversationId(cid);
    await update(r(), {
      [`Memberships/${me}/joined/${cid}`]: true,
      [`Rooms/${cid}/members/${me}`]: true,
      [`Chatlist/${me}/${convId}`]: "group",
    });
    const name = auth.currentUser?.displayName || "Someone";
    await push(r(`Messages/${convId}`), { sender: me, type: "system", text: `${name.split(" ")[0]} joined the room`, timestamp: Date.now(), readBy: { [me]: true } });
    return convId;
  },

  async leaveCommunity(_me, cid) {
    const me = currentUid();
    await update(r(), {
      [`Memberships/${me}/joined/${cid}`]: null,
      [`Rooms/${cid}/members/${me}`]: null,
      [`Chatlist/${me}/${roomConversationId(cid)}`]: null,
    });
  },

  async toggleSaveCommunity(_me, cid) {
    const me = currentUid();
    const path = `Memberships/${me}/saved/${cid}`;
    const snap = await get(r(path));
    await set(r(path), snap.exists() ? null : true);
  },

  async skipCommunity(_me, cid) {
    const me = currentUid();
    await set(r(`Memberships/${me}/skipped/${cid}`), true);
  },

  async resetDeck() {
    const me = currentUid();
    await remove(r(`Memberships/${me}/skipped`));
  },
};

export default api;
