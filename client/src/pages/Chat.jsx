import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// ── SVG icons (inline, no external deps) ──────────────────────────
function IconChat() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
    </svg>
  );
}
function IconContacts() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}
function IconCloud() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  );
}
function IconUserPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}
function IconGroupPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58A2.01 2.01 0 0 0 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85A6.95 6.95 0 0 0 20 14c-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24v-1.57zM16.24 13.65c-1.17-.52-2.61-.9-4.24-.9-1.63 0-3.07.39-4.24.9A2.99 2.99 0 0 0 6 16.4V18h12v-1.6c0-1.18-.68-2.21-1.76-2.75zM8.07 16c.09-.23.13-.39.91-.69C10.06 14.88 11.06 14.75 12 14.75s1.94.13 3.02.56c.77.3.81.46.91.69H8.07zM12 8c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm5.5 3H19V9.5h1.5V8H19V6.5h-1.5V8H16v1.5h1.5V11z" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96a7.02 7.02 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.488.488 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z" />
    </svg>
  );
}
function IconMore() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
}
function IconSend() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}
function IconImage() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
    </svg>
  );
}
function IconSticker() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
    </svg>
  );
}
function IconFile() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 0 0 5 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
    </svg>
  );
}
function IconPanel() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" />
    </svg>
  );
}
function IconEmoji() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
    </svg>
  );
}
function IconThumb() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
    </svg>
  );
}

// ── Avatar component ───────────────────────────────────────────────
function Avatar({ name, size = 36, color }) {
  const colors = ['#0068ff', '#f5a623', '#7ed321', '#d0021b', '#9013fe', '#50e3c2'];
  const bg = color || colors[name?.charCodeAt(0) % colors.length] || '#0068ff';
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: bg, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600, fontSize: size * 0.38, flexShrink: 0,
        textTransform: 'uppercase', userSelect: 'none',
      }}
    >
      {name?.[0] || '?'}
    </div>
  );
}

// ── Main Chat Component ────────────────────────────────────────────
export default function Chat() {
  const { auth, logout } = useAuth();
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬'];

  // Load history and connect socket
  useEffect(() => {
    api.get('/messages').then(res => setMessages(res.data));

    socketRef.current = io('http://localhost:5000', {
      auth: { token: auth.token },
    });

    socketRef.current.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socketRef.current.on('reaction_updated', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
    });

    return () => socketRef.current.disconnect();
  }, [auth.token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage(e) {
    if (e) e.preventDefault();
    if (!text.trim()) return;
    socketRef.current.emit('send_message', { content: text.trim(), type: 'text' });
    setText('');
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post('/upload', formData);
      socketRef.current.emit('send_message', { type: 'image', url: res.data.url });
    } catch (err) {
      console.error('Upload failed', err);
    }
  }

  function sendSticker(url) {
    socketRef.current.emit('send_message', { type: 'sticker', url });
    setShowStickers(false);
  }

  function toggleReaction(messageId, emoji) {
    socketRef.current.emit('toggle_reaction', { messageId, emoji });
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  async function handleFileUpload(e, type) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      socketRef.current.emit('send_message', {
        type: type,
        content: res.data.fileName,
        fileUrl: res.data.url,
        fileName: res.data.fileName
      });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = null; // reset input
    }
  }

  const lastMsg = messages[messages.length - 1];

  return (
    <div className="zl-root">
      {/* ── Left nav bar ── */}
      <nav className="zl-nav">
        <div className="zl-nav-top">
          <button className="zl-nav-avatar" title={auth.username}>
            <Avatar name={auth.username} size={40} />
          </button>
        </div>
        <div className="zl-nav-icons">
          <button className="zl-nav-btn zl-nav-btn--active" title="Tin nhắn">
            <IconChat />
          </button>
          <button className="zl-nav-btn" title="Danh bạ">
            <IconContacts />
          </button>
          <button className="zl-nav-btn" title="Cloud của tôi">
            <IconCloud />
          </button>
        </div>
        <div className="zl-nav-bottom">
          <button className="zl-nav-btn" title="Cài đặt" onClick={logout}>
            <IconSettings />
          </button>
        </div>
      </nav>

      {/* ── Conversation list sidebar ── */}
      <aside className="zl-sidebar">
        {/* Search + action icons */}
        <div className="zl-sb-header">
          <div className="zl-search-wrap">
            <span className="zl-search-icon"><IconSearch /></span>
            <input
              className="zl-search-input"
              placeholder="Tìm kiếm"
              readOnly
            />
          </div>
          <button className="zl-icon-btn" title="Thêm bạn"><IconUserPlus /></button>
          <button className="zl-icon-btn" title="Tạo nhóm chat"><IconGroupPlus /></button>
        </div>

        {/* Filter tabs */}
        <div className="zl-sb-tabs">
          <button className="zl-tab zl-tab--active">Tất cả</button>
          <button className="zl-tab">Chưa đọc</button>
          <button className="zl-tab">Phân loại <span className="zl-tab-arrow">▾</span></button>
          <button className="zl-icon-btn zl-tab-more"><IconMore /></button>
        </div>

        {/* Conversation list */}
        <div className="zl-conv-list">
          {/* Single global chat room item */}
          <div className="zl-conv-item zl-conv-item--active">
            <div className="zl-conv-avatar">
              <Avatar name="Chat Room" size={46} color="#0068ff" />
            </div>
            <div className="zl-conv-info">
              <div className="zl-conv-top">
                <span className="zl-conv-name">Chat Room</span>
                <span className="zl-conv-time">
                  {lastMsg ? formatTime(lastMsg.createdAt) : ''}
                </span>
              </div>
              <div className="zl-conv-bottom">
                <span className="zl-conv-preview">
                  {lastMsg
                    ? `${lastMsg.sender === auth.username ? 'Bạn' : lastMsg.sender}: ${lastMsg.content}`
                    : 'Bắt đầu cuộc trò chuyện'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main chat area ── */}
      <main className="zl-main">
        {/* Chat header */}
        <div className="zl-chat-header">
          <div className="zl-chat-header-left">
            <Avatar name="Chat Room" size={36} color="#0068ff" />
            <div className="zl-chat-header-info">
              <span className="zl-chat-name">Chat Room</span>
              <span className="zl-chat-members">{auth.username} và mọi người</span>
            </div>
          </div>
          <div className="zl-chat-header-right">
            <button className="zl-icon-btn" title="Tìm kiếm"><IconSearch /></button>
            <button className="zl-icon-btn" title="Thông tin hội thoại"><IconPanel /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="zl-messages" id="chat-messages">
          {messages.map((msg, idx) => {
            const isOwn = msg.sender === auth.username;
            const prev = messages[idx - 1];
            const showDate =
              !prev ||
              new Date(msg.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();

            return (
              <div key={msg._id}>
                {showDate && (
                  <div className="zl-date-divider">
                    <span>{new Date(msg.createdAt).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                  </div>
                )}
                <div className={`zl-msg-row ${isOwn ? 'zl-msg-row--own' : ''}`}>
                  {!isOwn && (
                    <div className="zl-msg-avatar">
                      <Avatar name={msg.sender} size={32} />
                    </div>
                  )}
                  <div className="zl-msg-group">
                    {!isOwn && <span className="zl-msg-sender">{msg.sender}</span>}
                    <div className={`zl-msg-bubble ${isOwn ? 'zl-msg-bubble--own' : ''} ${msg.type === 'image' ? 'zl-msg-bubble--img' : ''}`}>
                      {msg.type === 'image' ? (
                        <img src={msg.fileUrl} alt="uploaded" className="zl-msg-img" />
                      ) : msg.type === 'file' ? (
                        <div className="zl-msg-file">
                          <IconFile />
                          <div className="zl-file-info">
                            <span className="zl-file-name">{msg.fileName || msg.content}</span>
                            <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="zl-file-download">Tải xuống</a>
                          </div>
                        </div>
                      ) : (
                        <span className="zl-msg-text">{msg.content}</span>
                      )}
                    </div>
                    <span className="zl-msg-time">{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Hidden File Inputs */}
        <input
          type="file"
          accept="image/*"
          ref={imageInputRef}
          style={{ display: 'none' }}
          onChange={(e) => handleFileUpload(e, 'image')}
        />
        <input
          type="file"
          accept="*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={(e) => handleFileUpload(e, 'file')}
        />

        {/* Toolbar */}
        <div className="zl-toolbar">
          <button className="zl-tool-btn" title="Hình ảnh" onClick={() => imageInputRef.current?.click()} disabled={uploading}>
            <IconImage />
          </button>
          <button className="zl-tool-btn" title="File" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <IconFile />
          </button>
          {uploading && <span className="zl-upload-text">Đang tải...</span>}
          <hr />
        </div>

        {/* Input bar */}
        <form className="zl-input-bar" onSubmit={sendMessage}>
          <input
            id="message-input"
            type="text"
            className="zl-input"
            placeholder={`Nhập @, tin nhắn tới Chat Room`}
            value={text}
            onChange={e => setText(e.target.value)}
            autoComplete="off"
          />
          <div className="zl-input-actions" style={{ position: 'relative' }}>
            <button type="button" className="zl-tool-btn" title="Emoji" onClick={() => setShowEmoji(!showEmoji)}>
              <IconEmoji />
            </button>
            {showEmoji && (
              <div className="zl-emoji-picker">
                {emojis.map((emoji, i) => (
                  <span key={i} className="zl-emoji-item" onClick={() => { setText(prev => prev + emoji); setShowEmoji(false); }}>
                    {emoji}
                  </span>
                ))}
              </div>
            )}
            <button
              id="send-btn"
              type="submit"
              className={`zl-send-btn ${text.trim() ? 'zl-send-btn--active' : ''}`}
              disabled={!text.trim()}
              title="Gửi"
            >
              {text.trim() ? <IconSend /> : <IconThumb />}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
