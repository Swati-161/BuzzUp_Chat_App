import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, MessagesSquare, Video, VideoOff, Headphones, HeadphoneOff, Mic, MicOff, PhoneOff, AudioLines } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Avatar, IconButton } from "../components/ui";
import { duration as fmt, firstName } from "../utils/format";

export default function RoomCallScreen({ convId }) {
  const { user, users, backend, conversations, pop, openConversation, toast } = useApp();
  const me = user.uid;
  const [conv, setConv] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [speaking, setSpeaking] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const startedAt = useRef(Date.now());

  useEffect(() => backend.subscribeConversation(convId, me, setConv), [backend, convId, me]);

  const participants = useMemo(() => {
    if (!conv) return [];
    const others = conv.members.filter((m) => m !== me);
    const ordered = [...others.filter((m) => users[m]?.online), ...others.filter((m) => !users[m]?.online)];
    return ordered.slice(0, 5);
  }, [conv, users, me]);

  const muted = useMemo(() => new Set(participants.filter((_, i) => i % 3 === 1)), [participants]);

  useEffect(() => {
    const t = setInterval(() => {
      setElapsed((Date.now() - startedAt.current) / 1000);
    }, 1000);
    const s = setInterval(() => {
      const talkers = participants.filter((p) => !muted.has(p));
      setSpeaking(talkers.length ? talkers[Math.floor(Math.random() * talkers.length)] : null);
    }, 2200);
    return () => { clearInterval(t); clearInterval(s); };
  }, [participants, muted]);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream, camOn]);

  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

  const toggleCamera = async () => {
    if (camOn) {
      stream?.getTracks().forEach((t) => t.stop());
      setStream(null);
      setCamOn(false);
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setStream(s);
      setCamOn(true);
    } catch {
      toast("Camera unavailable: allow access in your browser to share video");
    }
  };

  const leave = () => {
    stream?.getTracks().forEach((t) => t.stop());
    toast(`You left the room · ${fmt(elapsed)}`);
    pop();
  };

  const unread = conversations.find((c) => c.id === convId)?.unread || 0;
  const title = conv?.type === "group" ? conv.title : conv?.title;

  return (
    <div className="screen screen--call">
      <header className="call-head">
        <IconButton dark label="Back" onClick={pop}><ArrowLeft size={18} /></IconButton>
        <div className="call-title">
          <h1>room chat</h1>
          <span><i className="live-dot" /> {title} · {fmt(elapsed)}</span>
        </div>
        <div className="bell-wrap">
          {unread > 0 && <span className="bell-count">{unread}</span>}
          <IconButton dark label="Open room chat" onClick={() => openConversation(convId)}><MessagesSquare size={18} /></IconButton>
        </div>
      </header>

      <div className="call-grid">
        {participants.map((id) => {
          const p = users[id] || { username: "Guest" };
          const isMuted = muted.has(id);
          const isSpeaking = speaking === id && !deafened;
          return (
            <div key={id} className={`tile ${isSpeaking ? "is-speaking" : ""}`}>
              {p.avatar ? <img src={p.avatar} alt={p.username} /> : <div className="tile-fallback"><Avatar user={p} size={64} /></div>}
              <span className={`tile-mic ${isMuted ? "is-muted" : ""}`}>
                {isMuted ? <MicOff size={14} /> : isSpeaking ? <AudioLines size={14} /> : <Mic size={14} />}
              </span>
              <span className="tile-name">{firstName(p.username)}</span>
            </div>
          );
        })}
        <div className="tile tile--self">
          {camOn ? (
            <video ref={videoRef} autoPlay playsInline muted />
          ) : user.avatar ? (
            <img src={user.avatar} alt="You" className="tile-dim" />
          ) : (
            <div className="tile-fallback"><Avatar user={user} size={64} /></div>
          )}
          <span className={`tile-mic ${micOn ? "" : "is-muted"}`}>{micOn ? <Mic size={14} /> : <MicOff size={14} />}</span>
          <span className="tile-name">You{camOn ? "" : " · camera off"}</span>
        </div>
      </div>

      <div className="call-controls" role="toolbar" aria-label="Call controls">
        <button type="button" className={`ctrl ${camOn ? "is-on" : ""}`} onClick={toggleCamera} aria-label={camOn ? "Turn camera off" : "Turn camera on"}>
          {camOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button type="button" className={`ctrl ${deafened ? "is-off" : ""}`} onClick={() => setDeafened((d) => !d)} aria-label={deafened ? "Undeafen" : "Deafen"}>
          {deafened ? <HeadphoneOff size={20} /> : <Headphones size={20} />}
        </button>
        <button type="button" className={`ctrl ${micOn ? "" : "is-off"}`} onClick={() => setMicOn((m) => !m)} aria-label={micOn ? "Mute microphone" : "Unmute microphone"}>
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button type="button" className="ctrl ctrl--end" onClick={leave} aria-label="Leave room">
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}
