import { useEffect, useRef, useState } from "react";
import { Plus, Send, Mic, Image as ImageIcon, Music, Trash2, Square } from "lucide-react";
import { duration as fmt } from "../utils/format";

export default function Composer({ onSendText, onSendFiles, onSendVoice, disabled }) {
  const [text, setText] = useState("");
  const [menu, setMenu] = useState(false);
  const [recording, setRecording] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const photoInput = useRef(null);
  const audioInput = useRef(null);
  const textarea = useRef(null);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setElapsed((Date.now() - recording.startedAt) / 1000), 200);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 110)}px`;
  }, [text]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 3500);
    return () => clearTimeout(t);
  }, [error]);

  const submit = (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    onSendText(text.trim());
    setText("");
  };

  const pickFiles = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    setMenu(false);
    if (files.length) onSendFiles(files).catch((err) => setError(err.message));
  };

  const startRecording = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice recording isn't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
      recorder.onstop = () => stream.getTracks().forEach((t) => t.stop());
      recorder.start();
      setElapsed(0);
      setRecording({ recorder, chunks, startedAt: Date.now() });
    } catch {
      setError("Microphone access was blocked. Allow it in your browser to send voice notes.");
    }
  };

  const stopRecording = (send) => {
    const rec = recording;
    if (!rec) return;
    const seconds = (Date.now() - rec.startedAt) / 1000;
    rec.recorder.addEventListener("stop", () => {
      if (!send || seconds < 0.6) return;
      const type = rec.recorder.mimeType || "audio/webm";
      const file = new File(rec.chunks, `voice-${Date.now()}.webm`, { type });
      onSendVoice(file, seconds).catch((err) => setError(err.message));
    }, { once: true });
    rec.recorder.stop();
    setRecording(null);
  };

  return (
    <div className="composer-wrap">
      {error && <div className="composer-error" role="alert">{error}</div>}
      {menu && (
        <div className="attach-menu">
          <button type="button" onClick={() => photoInput.current?.click()}><span className="attach-icon attach-icon--photo"><ImageIcon size={17} /></span>Photos &amp; video</button>
          <button type="button" onClick={() => audioInput.current?.click()}><span className="attach-icon attach-icon--audio"><Music size={17} /></span>Audio file</button>
        </div>
      )}
      <input ref={photoInput} type="file" accept="image/*,video/*" multiple hidden onChange={pickFiles} />
      <input ref={audioInput} type="file" accept="audio/*" hidden onChange={pickFiles} />

      {recording ? (
        <div className="composer">
          <div className="composer-field composer-field--recording">
            <button type="button" className="composer-icon" onClick={() => stopRecording(false)} aria-label="Discard recording"><Trash2 size={18} /></button>
            <span className="rec-dot" />
            <span className="rec-time">{fmt(elapsed)}</span>
            <span className="rec-label">Recording… tap ■ to send</span>
          </div>
          <button type="button" className="send-btn send-btn--gradient" onClick={() => stopRecording(true)} aria-label="Send voice note">
            <Square size={14} fill="currentColor" />
          </button>
        </div>
      ) : (
        <form className="composer" onSubmit={submit}>
          <div className="composer-field">
          <button type="button" className={`composer-icon ${menu ? "is-open" : ""}`} onClick={() => setMenu((m) => !m)} aria-label="Attach" aria-expanded={menu}>
            <Plus size={20} />
          </button>
          <textarea
            ref={textarea}
            rows={1}
            value={text}
            placeholder="Type your message..."
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setMenu(false)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) submit(e); }}
            disabled={disabled}
            aria-label="Message"
          />
          </div>
          {text.trim() ? (
            <button type="submit" className="send-btn" aria-label="Send"><Send size={18} /></button>
          ) : (
            <button type="button" className="send-btn" onClick={startRecording} aria-label="Record voice note"><Mic size={18} /></button>
          )}
        </form>
      )}
    </div>
  );
}
