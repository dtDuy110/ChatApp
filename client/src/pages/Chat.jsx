import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Chat() {
  const { auth, logout } = useAuth();
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [showStickers, setShowStickers] = useState(false);

  const STICKERS = [
    'https://cdn-icons-png.flaticon.com/512/2584/2584606.png',
    'https://cdn-icons-png.flaticon.com/512/2584/2584644.png',
    'https://cdn-icons-png.flaticon.com/512/2584/2584638.png',
    'https://cdn-icons-png.flaticon.com/512/2584/2584634.png',
    'https://cdn-icons-png.flaticon.com/512/2584/2584666.png',
    'https://cdn-icons-png.flaticon.com/512/2584/2584650.png',
    'https://cdn-icons-png.flaticon.com/512/2584/2584670.png',
    'https://cdn-icons-png.flaticon.com/512/2584/2584602.png',
  ];

  const REACTION_LIST = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

  // Theme support
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

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

  return (
    <div className="chat-layout">
      <header className="chat-header">
        <span className="chat-header-title">Chat Room</span>
        <div className="chat-header-right">
          <button className="btn-theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
            )}
          </button>
          <span className="chat-username">{auth.username}</span>
          <button className="btn-logout" onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className="chat-messages">
        {messages.map((msg) => {
          const isOwn = msg.sender === auth.username;
          return (
            <div key={msg._id} className={`msg-row ${isOwn ? 'msg-row--own' : ''}`}>
              {!isOwn && <span className="msg-sender">{msg.sender}</span>}
              <div className={`msg-bubble ${isOwn ? 'msg-bubble--own' : ''}`}>
                {msg.type === 'text' && <p className="msg-text">{msg.content}</p>}
                {msg.type === 'image' && <img src={msg.url} className="msg-image" alt="sent" />}
                {msg.type === 'sticker' && <img src={msg.url} className="msg-sticker" alt="sticker" />}
                
                <span className="msg-time">{formatTime(msg.createdAt)}</span>
              </div>

              <div className="msg-reactions">
                {msg.reactions && msg.reactions.reduce((acc, curr) => {
                  const existing = acc.find(r => r.emoji === curr.emoji);
                  if (existing) existing.count++; else acc.push({ emoji: curr.emoji, count: 1, own: curr.username === auth.username });
                  return acc;
                }, []).map(r => (
                  <div key={r.emoji} className={`reaction-tag ${r.own ? 'own' : ''}`} onClick={() => toggleReaction(msg._id, r.emoji)}>
                    {r.emoji} {r.count}
                  </div>
                ))}
                <div className="reaction-add" onClick={(e) => {
                  const popover = e.currentTarget.nextSibling;
                  popover.style.display = popover.style.display === 'flex' ? 'none' : 'flex';
                }}>😀</div>
                <div className="popover" style={{display: 'none'}}>
                  {REACTION_LIST.map(emoji => (
                    <span key={emoji} style={{cursor: 'pointer', fontSize: '16px'}} onClick={(e) => {
                      toggleReaction(msg._id, emoji);
                      e.currentTarget.parentElement.style.display = 'none';
                    }}>{emoji}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </main>

      <footer className="chat-input-bar">
        <button className="btn-icon" onClick={() => fileInputRef.current.click()}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        </button>
        <input type="file" ref={fileInputRef} style={{display: 'none'}} accept="image/*" onChange={handleImageUpload} />
        
        <div style={{position: 'relative'}}>
          <button className="btn-icon" onClick={() => setShowStickers(!showStickers)}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </button>
          {showStickers && (
            <div className="popover">
              <div className="sticker-grid">
                {STICKERS.map(s => (
                  <img key={s} src={s} className="sticker-option" onClick={() => sendSticker(s)} alt="sticker" />
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} style={{display: 'flex', flex: 1, gap: '8px'}}>
          <input
            className="chat-input"
            placeholder="Type a message..."
            value={text}
            onChange={e => setText(e.target.value)}
            autoComplete="off"
          />
          <button type="submit" className="btn-send" disabled={!text.trim()}>
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}
