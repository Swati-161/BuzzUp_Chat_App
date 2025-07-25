import React, { useState } from 'react';
import axios from 'axios';
import { ref, push, update, onValue } from 'firebase/database'; // ✅ Added update
import { database } from '../firebase';
import { useAuth } from '../context/AuthContext';
import './UploadMedia.css';

function UploadMedia({ selectedUserId, onClose }) {
  const getChatId = (uid1, uid2) =>
    uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;

  const { firebaseUser } = useAuth();
  const currentUserId = firebaseUser?.uid;
  const [preview, setPreview] = useState(null);

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file); // ✅ Ensure field name matches backend

    try {
      const token = await firebaseUser.getIdToken();
     const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${firebaseUser.accessToken}`,
        },
      }
    );


      const fileType = file.type.split("/")[0]; // 'image', 'video', 'audio'
      const mediaType = response.data.mediaType || fileType;

      const previewData = {
        originalUrl: response.data.compressedVideo || response.data.originalUrl,
        thumbnail: response.data.thumbnail || "",
        duration: response.data.duration || null,
        type: mediaType,
      };

      setPreview(previewData);
    } catch (err) {
      console.error("Error uploading media:", err);
    }
  };

  const handleSend = () => {
    if (!preview || !currentUserId || !selectedUserId) return;

    const chatId = getChatId(currentUserId, selectedUserId);
    const senderRef = ref(database, `Messages/${chatId}`);
    const newMessageKey = push(senderRef).key;

    const message = {
      sender: currentUserId,
      receiver: selectedUserId,
      mediaUrl: preview.originalUrl,
      thumbnail: preview.thumbnail || "",
      compressedVideo: preview.originalUrl?.includes("compressed") ? preview.originalUrl : "",
      duration: preview.duration || null,
      mediaType: preview.type,
      timestamp: Date.now(),
      text: "",
      type: "media",
    };

    const updates = {};
    updates[`Messages/${chatId}/${newMessageKey}`] = message;
    update(ref(database), updates);
    const notificationData = {
      from: currentUserId,
      to: selectedUserId,
      type: "media",
      mediaType: preview.type,
      read: false,
      timestamp: Date.now(),
    };
    push(ref(database, `Notifications/${selectedUserId}`), notificationData);
      onClose();
    };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="drop-zone"
        >
          Drag & Drop File Here
        </div>

        {preview && (
          <div className="preview-box">
            {preview.type === 'image' && (
              <img src={`${process.env.REACT_APP_API_BASE_URL}
${preview.thumbnail}`} width="200" alt="thumbnail" />
            )}
            {preview.type === 'video' && (
              <video width="300" controls poster={`${process.env.REACT_APP_API_BASE_URL}
${preview.thumbnail}`}>
                <source src={`${process.env.REACT_APP_API_BASE_URL}
${preview.originalUrl}`} />
              </video>
            )}
            {preview.type === 'audio' && (
              <div>
                <audio controls src={`${process.env.REACT_APP_API_BASE_URL}
${preview.originalUrl}`} />
                <p>Duration: {Math.round(preview.duration)} sec</p>
              </div>
            )}

            <div style={{ marginTop: '10px' }}>
              <a
                href={`${process.env.REACT_APP_API_BASE_URL}
/api/upload/download/${preview.originalUrl.split('/').pop()}`}
                download
                className="download-btn"
              >
                Download
              </a>
              <button onClick={handleSend}>Send</button>
            </div>
          </div>
        )}

        <button onClick={onClose} className="close-btn">✖</button>
      </div>
    </div>
  );
}

export default UploadMedia;
