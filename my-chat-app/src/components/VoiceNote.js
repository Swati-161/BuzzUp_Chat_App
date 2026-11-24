import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { duration as fmt } from "../utils/format";

const BAR_COUNT = 30;

function bars(seed = "") {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0;
    const wave = Math.sin((i / BAR_COUNT) * Math.PI);
    return 0.25 + 0.75 * (((h >> 8) % 100) / 100) * (0.45 + wave * 0.55);
  });
}

export default function VoiceNote({ id, src, seconds, light = false }) {
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(seconds || 0);
  const heights = useMemo(() => bars(id), [id]);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const onTime = () => setProgress(el.duration ? el.currentTime / el.duration : 0);
    const onMeta = () => { if (Number.isFinite(el.duration)) setTotal(el.duration); };
    const onEnd = () => { setPlaying(false); setProgress(0); };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = (e) => {
    e.stopPropagation();
    const el = audio.current;
    if (!el || !src) return;
    if (playing) { el.pause(); setPlaying(false); }
    else {
      document.querySelectorAll("audio").forEach((a) => a !== el && a.pause());
      el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const seek = (e) => {
    e.stopPropagation();
    const el = audio.current;
    if (!el?.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    el.currentTime = ((e.clientX - rect.left) / rect.width) * el.duration;
  };

  return (
    <div className={`voice ${light ? "voice--light" : ""}`}>
      <button type="button" className="voice-play" onClick={toggle} aria-label={playing ? "Pause voice message" : "Play voice message"} disabled={!src}>
        {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
      </button>
      <div className="voice-wave" onClick={seek} role="presentation">
        {heights.map((h, i) => (
          <span key={i} style={{ height: `${h * 100}%` }} className={i / BAR_COUNT < progress ? "is-played" : ""} />
        ))}
      </div>
      <span className="voice-time">{fmt(playing ? total * progress : total)}</span>
      <audio ref={audio} src={src || undefined} preload="metadata" />
    </div>
  );
}
