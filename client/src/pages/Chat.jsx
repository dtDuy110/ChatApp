import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Chat() {
  const { auth, logout } = useAuth();
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  // Load history and connect socket
  useEffect(() => {
    api.get('/messages').then(res => setMessages(res.data));

    socketRef.current = io('http://localhost:5000', {
      auth: { token: auth.token },
    });

    socketRef.current.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => socketRef.current.disconnect();
  }, [auth.token]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage(e) {
    e.preventDefault();
    if (!text.trim()) return;
    socketRef.current.emit('send_message', text.trim());
    setText('');
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="chat-layout">
      <header className="chat-header">
        <span className="chat-header-title">Chat Room</span>
        <div className="chat-header-right">
          <span className="chat-username">{auth.username}</span>
          <button className="btn-logout" onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className="chat-messages" id="chat-messages">
        {messages.map((msg) => {
          const isOwn = msg.sender === auth.username;
          return (
            <div key={msg._id} className={`msg-row ${isOwn ? 'msg-row--own' : ''}`}>
              {!isOwn && <span className="msg-sender">{msg.sender}</span>}
              <div className={`msg-bubble ${isOwn ? 'msg-bubble--own' : ''}`}>
                <p className="msg-text">{msg.content}</p>
                <span className="msg-time">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </main>

      <form className="chat-input-bar" onSubmit={sendMessage}>
        <input
          id="message-input"
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={text}
          onChange={e => setText(e.target.value)}
          autoComplete="off"
        />
        <button id="send-btn" type="submit" className="btn-send" disabled={!text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
