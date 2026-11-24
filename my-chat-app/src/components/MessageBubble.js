import { memo } from "react";
import { Languages, Copy, ThumbsUp, ThumbsDown, CheckCheck, Check, Play, X } from "lucide-react";
import { Avatar, AvatarStack } from "./ui";
import VoiceNote from "./VoiceNote";
import languages from "../utils/languages";
import { clockTime, firstName } from "../utils/format";

const QUICK_REACTIONS = ["❤️", "👍", "😂", "🔥", "😮"];

function Reactions({ reactions, me, onToggle }) {
  const entries = Object.entries(reactions || {}).filter(([, ids]) => ids.length);
  if (!entries.length) return null;
  return (
    <div className="reactions">
      {entries.map(([emoji, ids]) => (
        <button type="button" key={emoji} className={`reaction ${ids.includes(me) ? "is-mine" : ""}`} onClick={(e) => { e.stopPropagation(); onToggle(emoji); }}>
          {emoji} <span>{ids.length}</span>
        </button>
      ))}
    </div>
  );
}

function MessageBubble({
  msg, me, users, isGroup, showAvatar, otherId, active, translation, translateLang,
  onSelect, onReact, onTranslate, onClearTranslation, onLangChange, onCopy, onOpenMedia,
}) {
  if (msg.type === "system") {
    return <div className="system-msg">{msg.text} · {clockTime(msg.timestamp)}</div>;
  }

  const mine = msg.sender === me;
  const author = users[msg.sender] || { username: "Someone" };
  const seen = mine && otherId && msg.readBy?.includes(otherId);
  const media = (msg.media || []).filter(Boolean);
  const textual = msg.type === "text" && msg.text;
  const thumbs = (emoji) => (e) => { e.stopPropagation(); onReact(emoji); };

  let body;
  if (msg.type === "voice") {
    body = <VoiceNote id={msg.id} src={media[0]} seconds={msg.duration} />;
  } else if (msg.type === "gallery" || msg.type === "image" || msg.type === "video") {
    body = (
      <div className="media-card">
        {msg.text && <p className="media-card-text">{msg.text}</p>}
        {media.length === 0 ? (
          <div className="media-missing">Media not available on this device</div>
        ) : (
          <div className={`media-strip ${media.length === 1 ? "is-single" : ""}`}>
            {media.map((url, i) => (
              <button type="button" key={i} className="media-thumb" onClick={(e) => { e.stopPropagation(); onOpenMedia({ type: msg.type === "video" ? "video" : "image", url }); }}>
                {msg.type === "video" ? (
                  <>
                    <video src={url} muted playsInline preload="metadata" />
                    <span className="media-play"><Play size={18} fill="currentColor" /></span>
                  </>
                ) : (
                  <img src={url} alt={msg.text || "Shared photo"} loading="lazy" />
                )}
              </button>
            ))}
          </div>
        )}
        <div className="media-card-foot">
          <AvatarStack ids={Object.values(msg.reactions || {}).flat().filter((v, i, a) => a.indexOf(v) === i)} users={users} max={3} size={18} extra={0} />
          <span className="media-card-emojis">{Object.keys(msg.reactions || {}).filter((k) => k !== "👍" && k !== "👎").join(" ")}</span>
          <div className="media-card-votes">
            <button type="button" className={msg.reactions?.["👍"]?.includes(me) ? "is-on" : ""} onClick={thumbs("👍")} aria-label="Like"><ThumbsUp size={14} /></button>
            <button type="button" className={msg.reactions?.["👎"]?.includes(me) ? "is-on" : ""} onClick={thumbs("👎")} aria-label="Dislike"><ThumbsDown size={14} /></button>
          </div>
        </div>
      </div>
    );
  } else {
    body = <p className="bubble-text">{msg.text}</p>;
  }

  const bubbleClass = msg.type === "voice" ? "bubble bubble--voice" : msg.type === "text" ? "bubble" : "bubble bubble--media";

  return (
    <div className={`msg ${mine ? "msg--mine" : "msg--theirs"} ${showAvatar ? "" : "msg--grouped"}`}>
      {!mine && (
        <div className="msg-avatar">{showAvatar && <Avatar user={author} size={26} />}</div>
      )}
      <div className="msg-col">
        {!mine && isGroup && showAvatar && <span className="msg-author">{firstName(author.username)}</span>}

        {active && (
          <div className="msg-actions" onClick={(e) => e.stopPropagation()}>
            {QUICK_REACTIONS.map((emoji) => (
              <button type="button" key={emoji} className="msg-react" onClick={() => onReact(emoji)} aria-label={`React ${emoji}`}>{emoji}</button>
            ))}
            {textual && (
              <>
                <span className="msg-actions-sep" />
                <button type="button" className="msg-tool" onClick={onTranslate} title="Translate"><Languages size={15} /></button>
                <select value={translateLang} onChange={(e) => onLangChange(e.target.value)} aria-label="Translate to">
                  {languages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
                <button type="button" className="msg-tool" onClick={onCopy} title="Copy"><Copy size={15} /></button>
              </>
            )}
          </div>
        )}

        <div className={bubbleClass} onClick={onSelect} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onSelect()}>
          {body}
          {translation && (
            <div className="translation">
              {translation.status === "loading" ? (
                <span className="translation-loading">Translating…</span>
              ) : (
                <>
                  <span className="translation-label">
                    <Languages size={11} /> {translation.error ? "Translation" : languages.find((l) => l.code === translation.lang)?.name}
                    <button type="button" onClick={(e) => { e.stopPropagation(); onClearTranslation(); }} aria-label="Hide translation"><X size={11} /></button>
                  </span>
                  <p>{translation.error || translation.text}</p>
                </>
              )}
            </div>
          )}
        </div>

        <Reactions reactions={msg.type === "text" || msg.type === "voice" ? msg.reactions : null} me={me} onToggle={onReact} />
        <span className="msg-time">
          {clockTime(msg.timestamp)}
          {mine && otherId && (seen ? <CheckCheck size={13} className="seen" /> : <Check size={13} />)}
        </span>
      </div>
    </div>
  );
}

export default memo(MessageBubble);
