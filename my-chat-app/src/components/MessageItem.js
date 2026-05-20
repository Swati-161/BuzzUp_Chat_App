import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import TranslateDropdown from "./TranslateDropdown";
import axios from "../utils/axiosInstance";
import "./MessageItem.css";
import { Languages, Download, X } from "lucide-react";

const BASE = process.env.REACT_APP_API_URL || "";

function formatTime(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MessageItem({ msg, onMediaClick }) {
  const { firebaseUser } = useAuth();
  const [translatedText, setTranslatedText] = useState(null);
  const [selectedLang, setSelectedLang]     = useState("");
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [showTranslate, setShowTranslate]   = useState(false);

  const isCurrentUser = (msg.sender || msg.senderId) === firebaseUser?.uid;

  useEffect(() => {
    if (!msg.text || !selectedLang) return;

    const timer = setTimeout(async () => {
      setLoadingTranslation(true);
      try {
        const res = await axios.post("/api/translate", {
          text: msg.text,
          targetLanguage: selectedLang,
        });
        setTranslatedText(res.data.translatedText || "No translation returned.");
      } catch (err) {
        // Show a friendly message instead of crashing
        const status = err?.response?.status;
        if (status === 403 || status === 401) {
          setTranslatedText("Auth error — check API token.");
        } else if (status === 500) {
          setTranslatedText("Translation service unavailable.");
        } else {
          setTranslatedText("Translation failed. Try again.");
        }
      } finally {
        setLoadingTranslation(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedLang, msg.text]);

  const clearTranslation = () => {
    setTranslatedText(null);
    setSelectedLang("");
    setShowTranslate(false);
  };

  return (
    <div className={`message-item ${isCurrentUser ? "sent" : "received"}`}>
      <div className="message-meta">
        <span className="sender-label">{isCurrentUser ? "you" : "them"}</span>
        <span className="message-timestamp">{formatTime(msg.timestamp)}</span>
      </div>

      <div className="message-bubble">
        {/* ── Text message ── */}
        {msg.type === "text" && (
          <>
            <p className="message-text">{msg.text}</p>

            {!showTranslate && (
              <button className="translate-btn" onClick={() => setShowTranslate(true)}>
                <Languages size={12} /> translate
              </button>
            )}

            {showTranslate && (
              <div style={{ marginTop: 6 }}>
                <TranslateDropdown
                  selected={selectedLang}
                  onChange={(lang) => setSelectedLang(lang)}
                  compact
                />
              </div>
            )}

            {loadingTranslation && (
              <div className="translating-text">translating...</div>
            )}

            {translatedText && !loadingTranslation && (
              <div className="translated-bubble">
                <p className="message-text">{translatedText}</p>
                <button className="translated-close" onClick={clearTranslation}><X size={12} /></button>
              </div>
            )}
          </>
        )}

        {/* ── Media message ── */}
        {msg.type === "media" && (
          <div className="media-wrapper">
            {msg.mediaType === "image" && (
              <>
                <img
                  src={`${BASE}${msg.mediaUrl}`}
                  alt="shared"
                  className="chat-image"
                  onClick={() => onMediaClick({ type: "image", url: `${BASE}${msg.mediaUrl}` })}
                />
                <a href={`${BASE}/api/upload/download/${msg.mediaUrl.split("/").pop()}`} download className="download-btn">
                  <Download size={12} /> download
                </a>
              </>
            )}

            {msg.mediaType === "video" && (
              <>
                <div
                  className="chat-video-thumb"
                  onClick={() => onMediaClick({ type: "video", url: `${BASE}${msg.compressedVideo || msg.mediaUrl}` })}
                >
                  <img
                    src={`${BASE}/uploads/thumbnails/thumb-${msg.mediaUrl.split("/").pop()}.jpg`}
                    alt="video"
                    className="chat-video-poster"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="chat-video-play">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                </div>
                <a href={`${BASE}/api/upload/download/${msg.mediaUrl.split("/").pop()}`} download className="download-btn">
                  <Download size={12} /> download
                </a>
              </>
            )}

            {msg.mediaType === "audio" && (
              <>
                <audio controls preload="metadata" style={{ width: "100%", marginTop: 6 }}>
                  <source src={`${BASE}${msg.mediaUrl}`} type="audio/mpeg" />
                </audio>
                {msg.duration && (
                  <div className="media-label">{Math.floor(msg.duration)}s</div>
                )}
                <a href={`${BASE}/api/upload/download/${msg.mediaUrl.split("/").pop()}`} download className="download-btn">
                  <Download size={12} /> download
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(MessageItem);