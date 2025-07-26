import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import TranslateDropdown from "./TranslateDropdown";
import axios from "../utils/axiosInstance";
import "./MessageItem.css";

function MessageItem({ msg, onMediaClick }) {

  const { firebaseUser } = useAuth();
  const [translatedText, setTranslatedText] = useState(null);
  const [selectedLang, setSelectedLang] = useState("");
  const isCurrentUser = (msg.sender || msg.senderId) === firebaseUser.uid;
  const [loadingTranslation, setLoadingTranslation] = useState(false);

  useEffect(() => {

  if (!msg.text || !selectedLang) return;


  const delayDebounce = setTimeout(() => {
    const translateText = async () => {
      setLoadingTranslation(true);
      try {
        const res = await axios.post("/api/translate", {
        text: msg.text,
        targetLanguage: selectedLang,
      });

        setTranslatedText(res.data.translatedText);
      } catch (err) {
        console.error("Translation failed", err);
        const errorMsg = err?.response?.data?.message || "Translation failed.";
        setTranslatedText(errorMsg);

      } finally {
      setLoadingTranslation(false); 
      }
    };

    translateText();
  }, 400); 

  return () => clearTimeout(delayDebounce); 
}, [selectedLang,msg.text, msg.originalLang]);

  return (

    <div className={`message-item ${isCurrentUser ? "sent" : "received"}`}>
      <div className="message-bubble">
        <div className="message-header">
          <span className="sender-label">{isCurrentUser ? "You:" : "Friend:"}</span>

          {msg.type === "text" && (
            <div className="dropdown-wrapper">
              <TranslateDropdown
                selected={selectedLang}
                onChange={(lang) => setSelectedLang(lang)}
                compact
              />
            </div>
          )}
        </div>

        {msg.type === "text" && (
          <>
            <p className="message-text original-text">{msg.text}</p>
            {loadingTranslation ? (
              <div style={{ color: "#999", fontStyle: "italic", marginTop: "4px" }}>
                Translating...
              </div>
            ) : (
              translatedText && (
                <div
                  style={{
                    position: "relative",
                    backgroundColor: "#f1f1f1",
                    padding: "8px 24px 8px 8px",
                    marginTop: "6px",
                    borderRadius: "8px",
                  }}
                >
                  <p className="message-text translated-text">{translatedText}</p>
                  <button
                    onClick={() => {
                      setTranslatedText("");
                      setSelectedLang("");
                    }}
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "6px",
                      background: "transparent",
                      border: "none",
                      color: "#555",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                    aria-label="Close translation"
                  >
                    ×
                  </button>
                </div>
              ) ) }
              
          </>
        )}
        {msg.type === "media" && (
          <div className="media-wrapper">

            {msg.mediaType === "image" && (
              <div
                style={{
                  backgroundColor: "#f1f1f1",
                  padding: "10px",
                  borderRadius: "12px",
                  maxWidth: "220px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <img
                    src={`${process.env.REACT_APP_API_URL}
/thumbnails${msg.mediaUrl}`}
                    alt="shared an image"
                    className="chat-image"
                    style={{
                      width: "20px",
                      height: "20px",
                      objectFit: "contain",
                    }}
                    onClick={() =>
                      onMediaClick({ type: "image", url: `${process.env.REACT_APP_API_URL}
${msg.mediaUrl}` })
                    }
                  />
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#333",
                    }}
                  >
                    shared an image
                  </span>
                </div>

                <a
                  href={`${process.env.REACT_APP_API_URL}
/api/upload/download/${msg.mediaUrl.split("/").pop()}`}
                  download
                  className="download-btn"
                >
                  Download
                </a>
              </div>
            )}


            {msg.mediaType === "video" && (
            <div style={{ maxWidth: "400px", margin: "10px 0" }}>
                <video
                className="chat-video"
                controls
                style={{ width: "100%", borderRadius: "8px", cursor: "pointer" }}
                poster={`${process.env.REACT_APP_API_URL}
/thumbnails/thumb-${msg.mediaUrl.split("/").pop()}.jpg`}
                onClick={() =>
                    onMediaClick({
                    type: "video",
                    url: `${process.env.REACT_APP_API_URL}
${msg.mediaUrl}`,
                    })
                }
                >
                <source src={`${process.env.REACT_APP_API_URL}
${msg.compressedVideo || msg.mediaUrl}`} type="video/mp4" />
                Your browser does not support the video tag.
                </video>

                <div style={{ marginTop: "8px", textAlign: "center" }}>
                <a
                    href={`${process.env.REACT_APP_API_URL}
/api/upload/download/${msg.mediaUrl.split("/").pop()}`}
                    download
                    className="download-btn"
                >
                    Download
                </a>
                </div>
            </div>
            )}

            {msg.mediaType === "audio" && (
                <div style={{ maxWidth: "400px", margin: "10px 0" }}>
                    <audio
                    controls
                    preload="metadata"
                    style={{ width: "100%", borderRadius: "4px", backgroundColor: "#f0f0f0" }}
                    onClick={() =>
                        onMediaClick({
                        type: "audio",
                        url: `${process.env.REACT_APP_API_URL}
${msg.mediaUrl}`,
                        })
                    }
                    >
                    <source src={`${process.env.REACT_APP_API_URL}
${msg.mediaUrl}`} type="audio/mpeg" />
                    Your browser does not support the audio element.
                    </audio>

                    {msg.duration && (
                      <div style={{ fontSize: "14px", color: "#444", marginTop: "6px" }}>
                        Duration: {Math.floor(msg.duration)} seconds
                      </div>
                    )}

                    <div style={{ marginTop: "8px", textAlign: "center" }}>
                    <a
                        href={`${process.env.REACT_APP_API_URL}
/api/upload/download/${msg.mediaUrl.split("/").pop()}`}
                        download
                        className="download-btn"
                    >
                        Download
                    </a>
                    </div>
                </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(MessageItem);

