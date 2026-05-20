import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { ref, push, update } from 'firebase/database';
import { database } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { X, Upload, Send } from 'lucide-react';
import "./UploadMedia.css";

const BASE = process.env.REACT_APP_API_URL || '';

function UploadMedia({ selectedUserId, onClose }) {
  const getChatId = (uid1, uid2) =>
    uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;

  const { firebaseUser } = useAuth();
  const currentUserId = firebaseUser?.uid;

  const [preview, setPreview]     = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const [dragOver, setDragOver]   = useState(false);

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    await uploadFile(file);
  };

  // Also support click-to-browse
  const handleFileInput = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    setError('');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token    = await firebaseUser.getIdToken();
      const response = await axios.post(`${BASE}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      const fileType  = file.type.split('/')[0];
      const mediaType = response.data.mediaType || fileType;

      setPreview({
        originalUrl: response.data.compressedVideo || response.data.originalUrl,
        thumbnail:   response.data.thumbnail || '',
        duration:    response.data.duration || null,
        type:        mediaType,
        fileName:    file.name,
      });
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSend = () => {
    if (!preview || !currentUserId || !selectedUserId) return;

    const chatId      = getChatId(currentUserId, selectedUserId);
    const newMsgKey   = push(ref(database, `Messages/${chatId}`)).key;

    const message = {
      sender:          currentUserId,
      receiver:        selectedUserId,
      mediaUrl:        preview.originalUrl,
      thumbnail:       preview.thumbnail || '',
      compressedVideo: preview.originalUrl?.includes('compressed') ? preview.originalUrl : '',
      duration:        preview.duration || null,
      mediaType:       preview.type,
      timestamp:       Date.now(),
      text:            '',
      type:            'media',
      read:            false,
    };

    const updates = {};
    updates[`Messages/${chatId}/${newMsgKey}`] = message;
    update(ref(database), updates);

    push(ref(database, `Notifications/${selectedUserId}`), {
      from:      currentUserId,
      to:        selectedUserId,
      type:      'media',
      mediaType: preview.type,
      read:      false,
      timestamp: Date.now(),
    });

    onClose();
  };

  return ReactDOM.createPortal(
    <div className="um-backdrop" onClick={onClose}>
      <div className="um-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="um-header">
          <span className="um-title">Send a file</span>
          <button className="um-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Drop zone — only show if no preview yet */}
        {!preview && (
          <label
            className={`um-dropzone ${dragOver ? 'um-dropzone--over' : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
          >
            <input
              type="file"
              accept="image/*,video/*,audio/*"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
            {uploading ? (
              <div className="um-uploading">
                <div className="um-spinner" />
                <span>Uploading...</span>
              </div>
            ) : (
              <>
                <Upload size={28} style={{ opacity: 0.4, marginBottom: 10 }} />
                <div className="um-dropzone-text">Drop file here</div>
                <div className="um-dropzone-sub">or click to browse</div>
              </>
            )}
          </label>
        )}

        {error && <div className="um-error">{error}</div>}

        {/* Preview */}
        {preview && (
          <div className="um-preview">
            {preview.type === 'image' && (
              <img
                src={`${BASE}${preview.thumbnail || preview.originalUrl}`}
                alt="preview"
                className="um-preview-img"
              />
            )}
            {preview.type === 'video' && (
              <video
                className="um-preview-video"
                controls
                poster={`${BASE}${preview.thumbnail}`}
              >
                <source src={`${BASE}${preview.originalUrl}`} />
              </video>
            )}
            {preview.type === 'audio' && (
              <div className="um-preview-audio">
                <audio controls src={`${BASE}${preview.originalUrl}`} style={{ width: '100%' }} />
                {preview.duration && (
                  <div className="um-duration">{Math.round(preview.duration)}s</div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="um-actions">
              <button className="um-btn-secondary" onClick={() => setPreview(null)}>
                Change file
              </button>
              <button className="um-btn-primary" onClick={handleSend}>
                <Send size={14} /> Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default UploadMedia;