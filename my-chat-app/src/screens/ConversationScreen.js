import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Video, Users, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Avatar, AvatarStack, IconButton } from "../components/ui";
import MessageBubble from "../components/MessageBubble";
import Composer from "../components/Composer";

function dayLabel(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(Date.now() - 864e5);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "short" });
}

export default function ConversationScreen({ convId }) {
  const { user, users, backend, pop, openCall, toast, translateLang, setTranslateLang } = useApp();
  const me = user.uid;
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUid, setTypingUid] = useState(null);
  const [activeMsg, setActiveMsg] = useState(null);
  const [translations, setTranslations] = useState({});
  const [lightbox, setLightbox] = useState(null);
  const listRef = useRef(null);

  useEffect(() => backend.subscribeConversation(convId, me, setConv), [backend, convId, me]);
  useEffect(() => backend.subscribeMessages(convId, setMessages), [backend, convId]);
  useEffect(() => backend.subscribeTyping(convId, setTypingUid), [backend, convId]);

  useEffect(() => {
    backend.setActiveConversation(me, convId);
    return () => { backend.setActiveConversation(me, null); };
  }, [backend, me, convId]);

  useEffect(() => {
    if (messages.some((m) => m.sender !== me && !m.readBy?.includes(me))) backend.setActiveConversation(me, convId);
  }, [messages, backend, me, convId]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: messages.length ? "smooth" : "auto" });
  }, [messages.length, typingUid]);

  const send = useCallback((payload) => backend.sendMessage(convId, me, payload), [backend, convId, me]);

  const sendFiles = async (files) => {
    const uploaded = [];
    for (const file of files) uploaded.push(await backend.uploadMedia(file));
    const images = uploaded.filter((u) => u.type === "image");
    if (images.length > 1) await send({ type: "gallery", media: images.map((i) => i.url) });
    else if (images.length === 1) await send({ type: "image", media: [images[0].url] });
    for (const item of uploaded.filter((u) => u.type !== "image")) {
      await send({ type: item.type, media: [item.url], duration: item.duration || null });
    }
  };

  const sendVoice = async (file, seconds) => {
    const item = await backend.uploadMedia(file);
    await send({ type: "voice", media: [item.url], duration: Math.round(item.duration || seconds) });
  };

  const translate = async (msg, lang = translateLang) => {
    setTranslations((t) => ({ ...t, [msg.id]: { status: "loading" } }));
    try {
      const text = await backend.translate(msg.text, lang);
      setTranslations((t) => ({ ...t, [msg.id]: { status: "done", text, lang } }));
    } catch (err) {
      setTranslations((t) => ({ ...t, [msg.id]: { status: "done", error: err.message || "Translation failed." } }));
    }
  };

  if (!conv) {
    return <div className="screen screen--chat"><div className="center-note">Loading conversation…</div></div>;
  }

  const isGroup = conv.type === "group";
  const other = !isGroup ? users[conv.otherId] || { username: conv.title, avatar: conv.avatar } : null;
  const others = conv.members.filter((m) => m !== me);
  const onlineCount = conv.members.filter((m) => users[m]?.online).length;
  const typingUser = typingUid && users[typingUid];

  return (
    <div className="screen screen--chat" onClick={() => setActiveMsg(null)}>
      <header className="chat-head">
        <div className="chat-head-row">
          <IconButton dark label="Back" onClick={pop}><ArrowLeft size={18} /></IconButton>
          <h1>{isGroup ? conv.title.toLowerCase() : conv.title}</h1>
          <IconButton dark label="Start video room" onClick={() => openCall(convId)}><Video size={18} /></IconButton>
        </div>
        <div className="chat-head-row chat-head-row--meta">
          {isGroup ? (
            <AvatarStack ids={others} users={users} max={3} size={38} extra={Math.max(0, conv.memberCount - 3)} dark />
          ) : (
            <div className="chat-head-person">
              <Avatar user={other} size={42} online={other?.online} />
              <span>{other?.bio || (other?.handle ? `@${other.handle}` : "")}</span>
            </div>
          )}
          <div className="chat-head-status">
            <span className={`status ${isGroup || other?.online ? "is-online" : ""}`}>
              <i /> {isGroup ? `${onlineCount} Online` : other?.online ? "Online" : "Offline"}
            </span>
            <span className="muted"><Users size={12} /> {isGroup ? `${conv.memberCount} People` : other?.city || "Direct message"}</span>
          </div>
        </div>
      </header>

      <div className="message-list" ref={listRef}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <Avatar user={other || { username: conv.title }} size={64} />
            <p>Say hi to {conv.title} 👋</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const newDay = !prev || new Date(prev.timestamp).toDateString() !== new Date(msg.timestamp).toDateString();
          const showAvatar = newDay || !prev || prev.sender !== msg.sender || prev.type === "system" || msg.timestamp - prev.timestamp > 5 * 60000;
          return (
            <Fragment key={msg.id}>
              {newDay && <div className="day-sep"><span>{dayLabel(msg.timestamp)}</span></div>}
              <MessageBubble
                msg={msg}
                me={me}
                users={users}
                isGroup={isGroup}
                otherId={!isGroup ? conv.otherId : null}
                showAvatar={showAvatar}
                active={activeMsg === msg.id}
                translation={translations[msg.id]}
                translateLang={translateLang}
                onSelect={(e) => { e?.stopPropagation?.(); setActiveMsg((a) => (a === msg.id ? null : msg.id)); }}
                onReact={(emoji) => { backend.toggleReaction(convId, msg.id, me, emoji); setActiveMsg(null); }}
                onTranslate={() => { translate(msg); setActiveMsg(null); }}
                onLangChange={(lang) => { setTranslateLang(lang); translate(msg, lang); setActiveMsg(null); }}
                onClearTranslation={() => setTranslations((t) => { const n = { ...t }; delete n[msg.id]; return n; })}
                onCopy={() => { navigator.clipboard?.writeText(msg.text); toast("Message copied"); setActiveMsg(null); }}
                onOpenMedia={setLightbox}
              />
            </Fragment>
          );
        })}
        {typingUser && (
          <div className="msg msg--theirs">
            <div className="msg-avatar"><Avatar user={typingUser} size={26} /></div>
            <div className="msg-col">
              <div className="bubble bubble--typing" aria-label={`${typingUser.username} is typing`}><i /><i /><i /></div>
            </div>
          </div>
        )}
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <Composer onSendText={(text) => send({ type: "text", text })} onSendFiles={sendFiles} onSendVoice={sendVoice} />
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)} role="dialog" aria-label="Media preview">
          {lightbox.type === "video" ? (
            <video src={lightbox.url} controls autoPlay onClick={(e) => e.stopPropagation()} />
          ) : (
            <img src={lightbox.url} alt="Shared media" onClick={(e) => e.stopPropagation()} />
          )}
          <button type="button" className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Close"><X size={18} /></button>
        </div>
      )}
    </div>
  );
}
