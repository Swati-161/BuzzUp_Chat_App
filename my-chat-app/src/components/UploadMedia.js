import React, { useState } from 'react';
import axios from 'axios';
import { ref, push } from 'firebase/database';
import { database } from '../firebase';
import './UploadMedia.css';

function UploadMedia({ currentUserId, selectedUserId, onClose }) {
  const [preview, setPreview] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    setUploadedFile(file);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData);
      setPreview(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = () => {
    if (!preview) return;

    const message = {
      senderId: currentUserId,
      receiverId: selectedUserId,
      mediaUrl: preview.originalUrl,
      mediaType: preview.type,
      timestamp: Date.now(),
      text: "",
      type: "media",
    };

    const senderRef = ref(database, `Messages/${currentUserId}_${selectedUserId}`);
    push(senderRef, message);
    
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
              <img src={`http://localhost:5000${preview.thumbnail}`} width="200" alt="thumbnail" />
            )}
            {preview.type === 'video' && (
              <video width="300" controls poster={`http://localhost:5000${preview.thumbnail}`}>
                <source src={`http://localhost:5000${preview.originalUrl}`} />
              </video>
            )}
            {preview.type === 'audio' && (
              <div>
                <audio controls src={`http://localhost:5000${preview.originalUrl}`} />
                <p>Duration: {Math.round(preview.duration)} sec</p>
              </div>
            )}

            <div style={{ marginTop: '10px' }}>
             <a
                href={`http://localhost:5000/api/upload/download/${preview.originalUrl.split('/').pop()}`}
                download
                className="download-btn"
             > 
                 
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
