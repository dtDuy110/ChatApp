require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/api/auth', authRoutes);

// REST: get last 50 messages (requires valid JWT)
const verifyToken = require('./middleware/auth');
app.get('/api/messages', verifyToken, async (req, res) => {
  const messages = await Message.find().sort({ createdAt: 1 }).limit(50);
  res.json(messages);
});

// Socket.io with JWT auth
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = decoded;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`[connected] ${socket.user.username}`);

  socket.on('send_message', async (content) => {
    if (!content || typeof content !== 'string' || content.trim() === '') return;
    const msg = await Message.create({ sender: socket.user.username, content: content.trim() });
    io.emit('new_message', { _id: msg._id, sender: msg.sender, content: msg.content, createdAt: msg.createdAt });
  });

  socket.on('disconnect', () => {
    console.log(`[disconnected] ${socket.user.username}`);
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
  })
  .catch((err) => console.error('MongoDB connection failed:', err));
