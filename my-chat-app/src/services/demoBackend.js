import {
  SEED_USERS, COMMUNITIES, INITIAL_JOINED, DEMO_PASSWORD, DEMO_UID,
  AUTO_REPLIES, buildStarterThreads, roomConversationId, directConversationId,
} from "./seed";
import { compressImage, fileToDataUrl, translateWithMyMemory } from "./media";

const STATE_KEY = "buzzup.demo.v1";
const SESSION_KEY = "buzzup.demo.session";
const PRESENCE_WINDOW = 45 * 1000;

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const firstName = (name = "") => name.split(" ")[0] || "there";

let state = null;
const listeners = new Set();
const typing = {};
let sessionUid = null;
let heartbeat = null;

function emit() {
  listeners.forEach((fn) => fn());
}

function persist() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // Storage is full (usually large media): keep the session working and drop inline media from disk.
    const slim = JSON.parse(JSON.stringify(state));
    Object.values(slim.messages).forEach((list) =>
      list.forEach((m) => {
        if (m.media?.some((u) => u?.startsWith("data:"))) {
          m.media = m.media.map((u) => (u?.startsWith("data:") ? null : u));
        }
      })
    );
    try { localStorage.setItem(STATE_KEY, JSON.stringify(slim)); } catch { /* give up silently */ }
  }
}

function commit() {
  persist();
  emit();
}

function makeMessage(convId, raw, readers) {
  const { unread, ...rest } = raw;
  return {
    id: uid(),
    text: "",
    media: [],
    reactions: {},
    ...rest,
    readBy: Array.from(new Set([raw.sender, ...(unread ? [] : readers)])),
  };
}

function ensureConversation(id, data) {
  if (!state.conversations[id]) {
    state.conversations[id] = { id, createdAt: Date.now(), ...data };
    state.messages[id] = state.messages[id] || [];
  }
  return state.conversations[id];
}

function seedAccount(me) {
  if (state.seededFor[me]) return;
  const profile = state.users[me];
  const isPersona = SEED_USERS.some((u) => u.uid === me) && me !== DEMO_UID;
  state.memberships[me] = state.memberships[me] || { joined: [], saved: [], skipped: [] };

  if (isPersona) {
    state.memberships[me].joined = COMMUNITIES.filter((c) => c.members.includes(me)).map((c) => c.id);
    state.seededFor[me] = true;
    return;
  }

  const threads = buildStarterThreads(me, firstName(profile.username));
  INITIAL_JOINED.forEach((cid) => {
    const conv = state.conversations[roomConversationId(cid)];
    if (!conv.members.includes(me)) conv.members.push(me);
    if (!state.memberships[me].joined.includes(cid)) state.memberships[me].joined.push(cid);
  });

  Object.entries(threads).forEach(([convId, msgs]) => {
    if (convId.startsWith("room-")) {
      const list = state.messages[convId];
      if (list.length === 0) {
        const members = state.conversations[convId].members;
        state.messages[convId] = msgs.map((m) => makeMessage(convId, m, members));
      } else {
        // Room history already exists from another account: leave only the latest two unread.
        list.forEach((m, i) => {
          if (i < list.length - 2 && !m.readBy.includes(me)) m.readBy.push(me);
        });
      }
      return;
    }
    const other = convId.split("_").find((p) => p !== me);
    if (!other || other === me) return;
    ensureConversation(convId, { type: "dm", members: [me, other] });
    if (state.messages[convId].length === 0) {
      state.messages[convId] = msgs.map((m) => makeMessage(convId, m, [me, other]));
    }
  });

  const pending = [];
  Object.values(state.conversations)
    .filter((c) => c.members.includes(me))
    .forEach((c) => state.messages[c.id].forEach((m) => {
      if (m.sender !== me && m.type !== "system" && !m.readBy.includes(me)) {
        pending.push({ id: uid(), type: "message", from: m.sender, convId: c.id, text: preview(m), timestamp: m.timestamp, read: false });
      }
    }));
  state.notifications[me] = pending.sort((a, b) => b.timestamp - a.timestamp);
  state.seededFor[me] = true;
}

function freshState() {
  state = {
    version: 1,
    users: Object.fromEntries(SEED_USERS.map((u) => [u.uid, { ...u }])),
    accounts: Object.fromEntries(SEED_USERS.map((u) => [u.email, { uid: u.uid, password: DEMO_PASSWORD }])),
    conversations: {},
    messages: {},
    notifications: {},
    memberships: {},
    seededFor: {},
    active: {},
    lastSeen: {},
  };
  COMMUNITIES.forEach((c) => {
    ensureConversation(roomConversationId(c.id), {
      type: "group",
      communityId: c.id,
      members: [...c.members],
    });
  });
  seedAccount(DEMO_UID);
  persist();
}

function load() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    state = raw ? JSON.parse(raw) : null;
  } catch {
    state = null;
  }
  if (!state || state.version !== 1) freshState();
}

function readSession() {
  try {
    return sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function writeSession(id) {
  try {
    if (id) {
      sessionStorage.setItem(SESSION_KEY, id);
      localStorage.setItem(SESSION_KEY, id);
    } else {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
    }
  } catch { /* storage unavailable */ }
}

function touchPresence() {
  if (!sessionUid || !state) return;
  state.lastSeen[sessionUid] = Date.now();
  persist();
}

function startHeartbeat() {
  clearInterval(heartbeat);
  touchPresence();
  heartbeat = setInterval(touchPresence, 15000);
}

function isHumanOnline(id) {
  return id !== sessionUid && Date.now() - (state.lastSeen[id] || 0) < PRESENCE_WINDOW;
}

function init() {
  if (state) return;
  load();
  sessionUid = readSession();
  if (sessionUid && !state.users[sessionUid]) sessionUid = null;
  window.addEventListener("storage", (e) => {
    if (e.key === STATE_KEY && e.newValue) {
      try { state = JSON.parse(e.newValue); emit(); } catch { /* ignore partial writes */ }
    }
  });
  window.addEventListener("beforeunload", () => {
    if (sessionUid && state.active[sessionUid]) {
      delete state.active[sessionUid];
      persist();
    }
  });
  if (sessionUid) startHeartbeat();
}

function subscribe(compute, cb) {
  init();
  let last;
  const run = () => {
    const next = compute();
    const serialized = JSON.stringify(next);
    if (serialized !== last) {
      last = serialized;
      cb(serialized === undefined ? next : JSON.parse(serialized));
    }
  };
  listeners.add(run);
  run();
  return () => listeners.delete(run);
}

function conversationView(conv, me) {
  const msgs = state.messages[conv.id] || [];
  const last = msgs[msgs.length - 1] || null;
  const unread = msgs.filter((m) => m.sender !== me && !m.readBy.includes(me) && m.type !== "system").length;
  const base = { id: conv.id, type: conv.type, members: conv.members, lastMessage: last, unread, updatedAt: last?.timestamp || conv.createdAt };
  if (conv.type === "group") {
    const community = COMMUNITIES.find((c) => c.id === conv.communityId);
    return { ...base, title: community?.name || "Room", cover: community?.cover, communityId: conv.communityId, memberCount: Math.max(community?.memberCount || 0, conv.members.length) };
  }
  const otherId = conv.members.find((m) => m !== me);
  const other = state.users[otherId] || {};
  return { ...base, title: other.username || "Unknown", otherId, avatar: other.avatar };
}

function notify(convId, sender, text) {
  const conv = state.conversations[convId];
  conv.members.forEach((member) => {
    if (member === sender || state.active[member] === convId) return;
    state.notifications[member] = state.notifications[member] || [];
    state.notifications[member].unshift({ id: uid(), type: "message", from: sender, convId, text, timestamp: Date.now(), read: false });
    state.notifications[member] = state.notifications[member].slice(0, 50);
  });
}

function preview(msg) {
  if (msg.type === "text") return msg.text;
  if (msg.type === "voice") return "🎤 Voice message";
  if (msg.type === "video") return "🎬 Video";
  if (msg.type === "image" || msg.type === "gallery") return msg.text || "📷 Photo";
  return msg.text;
}

function setTyping(convId, who) {
  typing[convId] = who;
  emit();
}

function scheduleReply(convId, author) {
  const conv = state.conversations[convId];
  let responder;
  if (conv.type === "dm") {
    responder = conv.members.find((m) => m !== author);
  } else {
    const candidates = conv.members.filter((m) => m !== author && state.users[m]?.online && SEED_USERS.some((u) => u.uid === m));
    responder = candidates.length ? pick(candidates) : null;
  }
  if (!responder || isHumanOnline(responder) || !SEED_USERS.some((u) => u.uid === responder)) return;

  setTimeout(() => setTyping(convId, responder), 700);
  setTimeout(() => {
    setTyping(convId, null);
    api.sendMessage(convId, responder, { type: "text", text: pick(AUTO_REPLIES) }, { silentReply: true });
  }, 2200 + Math.random() * 1800);
}

const api = {
  mode: "demo",

  onAuthChange(cb) {
    return subscribe(() => (sessionUid ? state.users[sessionUid] || null : null), cb);
  },

  async signIn(email, password) {
    init();
    const account = state.accounts[email.trim().toLowerCase()];
    if (!account) throw Object.assign(new Error("No account found with this email."), { code: "auth/user-not-found" });
    if (account.password !== password) throw Object.assign(new Error("Incorrect password."), { code: "auth/wrong-password" });
    sessionUid = account.uid;
    writeSession(sessionUid);
    seedAccount(sessionUid);
    startHeartbeat();
    commit();
  },

  async signUp({ username, email, password }) {
    init();
    const key = email.trim().toLowerCase();
    if (state.accounts[key]) throw Object.assign(new Error("An account with this email already exists."), { code: "auth/email-already-in-use" });
    const id = `u-${uid()}`;
    state.users[id] = { uid: id, username: username.trim(), handle: key.split("@")[0], email: key, avatar: null, bio: "New to BuzzUp 👋", interests: ["Hiking", "Music"], city: "", online: true };
    state.accounts[key] = { uid: id, password };
    sessionUid = id;
    writeSession(id);
    seedAccount(id);
    startHeartbeat();
    commit();
  },

  async signOut() {
    init();
    if (sessionUid) {
      delete state.active[sessionUid];
      delete state.lastSeen[sessionUid];
    }
    sessionUid = null;
    clearInterval(heartbeat);
    writeSession(null);
    commit();
  },

  async updateProfile(id, patch) {
    state.users[id] = { ...state.users[id], ...patch };
    commit();
  },

  subscribeUsers(cb) {
    return subscribe(() => {
      const map = {};
      Object.values(state.users).forEach((u) => {
        map[u.uid] = { ...u, online: u.online || isHumanOnline(u.uid) || u.uid === sessionUid };
      });
      return map;
    }, cb);
  },

  async searchUsers(q, me) {
    init();
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return Object.values(state.users)
      .filter((u) => u.uid !== me && [u.username, u.handle, u.email].some((v) => v?.toLowerCase().includes(term)))
      .slice(0, 10);
  },

  subscribeConversations(me, cb) {
    return subscribe(() =>
      Object.values(state.conversations)
        .filter((c) => c.members.includes(me) && (c.type === "group" || state.messages[c.id]?.length))
        .map((c) => conversationView(c, me))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    cb);
  },

  subscribeConversation(convId, me, cb) {
    return subscribe(() => {
      const conv = state.conversations[convId];
      return conv ? conversationView(conv, me) : null;
    }, cb);
  },

  async openDirect(me, other) {
    init();
    const id = directConversationId(me, other);
    ensureConversation(id, { type: "dm", members: [me, other] });
    commit();
    return id;
  },

  subscribeMessages(convId, cb) {
    return subscribe(() => state.messages[convId] || [], cb);
  },

  subscribeTyping(convId, cb) {
    return subscribe(() => typing[convId] || null, cb);
  },

  async sendMessage(convId, sender, payload, opts = {}) {
    init();
    const conv = state.conversations[convId];
    if (!conv) return;
    const msg = makeMessage(convId, { sender, timestamp: Date.now(), ...payload }, [sender, ...conv.members.filter((m) => state.active[m] === convId)]);
    state.messages[convId].push(msg);
    notify(convId, sender, preview(msg));
    commit();
    if (!opts.silentReply) scheduleReply(convId, sender);
  },

  async toggleReaction(convId, msgId, me, emoji) {
    const msg = state.messages[convId]?.find((m) => m.id === msgId);
    if (!msg) return;
    const list = msg.reactions[emoji] || [];
    msg.reactions[emoji] = list.includes(me) ? list.filter((u) => u !== me) : [...list, me];
    if (!msg.reactions[emoji].length) delete msg.reactions[emoji];
    commit();
  },

  async setActiveConversation(me, convId) {
    init();
    if (convId) state.active[me] = convId;
    else delete state.active[me];
    if (convId) {
      (state.messages[convId] || []).forEach((m) => {
        if (!m.readBy.includes(me)) m.readBy.push(me);
      });
      (state.notifications[me] || []).forEach((n) => {
        if (n.convId === convId) n.read = true;
      });
    }
    commit();
  },

  subscribeNotifications(me, cb) {
    return subscribe(() => state.notifications[me] || [], cb);
  },

  async markAllNotificationsRead(me) {
    (state.notifications[me] || []).forEach((n) => { n.read = true; });
    commit();
  },

  async uploadMedia(file) {
    const kind = file.type.split("/")[0];
    if (kind === "image") return { type: "image", url: await compressImage(file) };
    if (kind === "audio") return { type: "voice", url: await fileToDataUrl(file) };
    if (kind === "video") {
      const url = file.size < 3 * 1024 * 1024 ? await fileToDataUrl(file) : URL.createObjectURL(file);
      return { type: "video", url };
    }
    throw new Error("Only images, videos and audio can be shared.");
  },

  translate: translateWithMyMemory,

  listCommunities() {
    init();
    return COMMUNITIES.map((c) => {
      const conv = state.conversations[roomConversationId(c.id)];
      return { ...c, members: conv?.members || c.members, memberCount: Math.max(c.memberCount, conv?.members.length || 0) };
    });
  },

  subscribeCommunities(cb) {
    return subscribe(() => api.listCommunities(), cb);
  },

  subscribeMemberships(me, cb) {
    return subscribe(() => state.memberships[me] || { joined: [], saved: [], skipped: [] }, cb);
  },

  async joinCommunity(me, cid) {
    const m = (state.memberships[me] = state.memberships[me] || { joined: [], saved: [], skipped: [] });
    if (!m.joined.includes(cid)) m.joined.push(cid);
    const convId = roomConversationId(cid);
    const conv = state.conversations[convId];
    if (!conv.members.includes(me)) conv.members.push(me);
    state.messages[convId].forEach((msg) => { if (!msg.readBy.includes(me)) msg.readBy.push(me); });
    state.messages[convId].push(makeMessage(convId, { sender: me, type: "system", text: `${firstName(state.users[me]?.username)} joined the room`, timestamp: Date.now() }, conv.members));
    commit();

    const greeter = COMMUNITIES.find((c) => c.id === cid)?.members.find((u) => !isHumanOnline(u));
    if (greeter) {
      setTimeout(() => setTyping(convId, greeter), 900);
      setTimeout(() => {
        setTyping(convId, null);
        api.sendMessage(convId, greeter, { type: "text", text: `Welcome ${firstName(state.users[me]?.username)}! 🎉 So happy you're here.` }, { silentReply: true });
      }, 2600);
    }
    return convId;
  },

  async leaveCommunity(me, cid) {
    const m = state.memberships[me];
    if (m) m.joined = m.joined.filter((x) => x !== cid);
    const conv = state.conversations[roomConversationId(cid)];
    conv.members = conv.members.filter((x) => x !== me);
    commit();
  },

  async toggleSaveCommunity(me, cid) {
    const m = (state.memberships[me] = state.memberships[me] || { joined: [], saved: [], skipped: [] });
    m.saved = m.saved.includes(cid) ? m.saved.filter((x) => x !== cid) : [...m.saved, cid];
    commit();
  },

  async skipCommunity(me, cid) {
    const m = (state.memberships[me] = state.memberships[me] || { joined: [], saved: [], skipped: [] });
    if (!m.skipped.includes(cid)) m.skipped.push(cid);
    commit();
  },

  async resetDeck(me) {
    if (state.memberships[me]) state.memberships[me].skipped = [];
    commit();
  },

  async resetDemo() {
    const keep = sessionUid && SEED_USERS.some((u) => u.uid === sessionUid) ? sessionUid : DEMO_UID;
    freshState();
    sessionUid = keep;
    writeSession(keep);
    seedAccount(keep);
    commit();
  },
};

export default api;
