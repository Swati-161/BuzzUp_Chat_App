export function clockTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function relativeTime(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return new Date(ts).toLocaleDateString([], { weekday: "short" });
  return new Date(ts).toLocaleDateString([], { day: "numeric", month: "short" });
}

export function duration(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function firstName(name = "") {
  return name.split(" ")[0] || name;
}

export function messagePreview(msg, users, me) {
  if (!msg) return "No messages yet";
  const who = msg.sender === me ? "You: " : "";
  if (msg.type === "system") return msg.text;
  if (msg.type === "voice") return `${who}🎤 Voice message`;
  if (msg.type === "video") return `${who}🎬 Video`;
  if (msg.type === "image" || msg.type === "gallery") return `${who}📷 ${msg.text || "Photo"}`;
  return `${who}${msg.text}`;
}
