import React, { useState, useEffect } from "react";
import TranslateDropdown from "./TranslateDropdown";
import axios from "axios";
import "./MessageItem.css";

function MessageItem({ msg, currentUser, onMediaClick }) {
  const [translatedText, setTranslatedText] = useState(null);
  const [selectedLang, setSelectedLang] = useState("en");
  const isCurrentUser = (msg.sender || msg.senderId) === currentUser.uid;


  useEffect(() => {
    if (msg.type !== "text") return;
    if (selectedLang === msg.originalLang) {
      setTranslatedText(null);
      return;
    }

    const translateMessage = async () => {
      try {
        const res = await axios.post("http://localhost:5000/api/translate", {
          text: msg.text,
          targetLanguage: selectedLang,
        });
        setTranslatedText(res.data.translatedText);
      } catch (err) {
        console.error("Translation failed", err);
        setTranslatedText(null);
      }
    };

    translateMessage();
  }, [msg.text, selectedLang, msg.originalLang, msg.type]);

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
            {translatedText && (
              <p className="message-text translated-text">↓ {translatedText}</p>
            )}
          </>
        )}

        {msg.type === "media" && (
          <div className="media-wrapper">
            {msg.mediaType === "image" && (
              <>
                <img
                  src={`http://localhost:5000${msg.mediaUrl}`}
                  alt="sent media"
                  className="chat-image"
                  onClick={() => onMediaClick({ type: "image", url: `http://localhost:5000${msg.mediaUrl}` })}
                />
                <div style={{ marginTop: "8px", textAlign: "center" }}>
                  <a
                    href={`http://localhost:5000/api/upload/download/${msg.mediaUrl.split("/").pop()}`}
                    download
                    className="download-btn"
                  >
                    Download
                  </a>
                </div>
              </>
            )}
            {msg.mediaType === "video" && (
            <div style={{ maxWidth: "400px", margin: "10px 0" }}>
                <video
                className="chat-video"
                controls
                style={{ width: "100%", borderRadius: "8px", cursor: "pointer" }}
                onClick={() =>
                    onMediaClick({
                    type: "video",
                    url: `http://localhost:5000${msg.mediaUrl}`,
                    })
                }
                >
                <source src={`http://localhost:5000${msg.mediaUrl}`} type="video/mp4" />
                Your browser does not support the video tag.
                </video>

                <div style={{ marginTop: "8px", textAlign: "center" }}>
                <a
                    href={`http://localhost:5000/api/upload/download/${msg.mediaUrl.split("/").pop()}`}
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
                    style={{ width: "100%", borderRadius: "4px", backgroundColor: "#f0f0f0" }}
                    onClick={() =>
                        onMediaClick({
                        type: "audio",
                        url: `http://localhost:5000${msg.mediaUrl}`,
                        })
                    }
                    >
                    <source src={`http://localhost:5000${msg.mediaUrl}`} type="audio/mpeg" />
                    Your browser does not support the audio element.
                    </audio>

                    <div style={{ marginTop: "8px", textAlign: "center" }}>
                    <a
                        href={`http://localhost:5000/api/upload/download/${msg.mediaUrl.split("/").pop()}`}
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

export default MessageItem;
