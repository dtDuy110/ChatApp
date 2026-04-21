require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const Message = require('./models/Message');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const verifyToken = require('./middleware/auth');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload image endpoint
app.post('/api/upload', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  const url = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url });
});

// REST: get last 50 messages (requires valid JWT)
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

  socket.on('send_message', async ({ content, type = 'text', url }) => {
    const msgData = { sender: socket.user.username, type };
    if (type === 'text') {
      if (!content || content.trim() === '') return;
      msgData.content = content.trim();
    } else {
      if (!url) return;
      msgData.url = url;
    }

    const msg = await Message.create(msgData);
    io.emit('new_message', msg);
  });

  socket.on('toggle_reaction', async ({ messageId, emoji }) => {
    const message = await Message.findById(messageId);
    if (!message) return;

    const existingIndex = message.reactions.findIndex(
      r => r.emoji === emoji && r.username === socket.user.username
    );

    if (existingIndex > -1) {
      message.reactions.splice(existingIndex, 1);
    } else {
      message.reactions.push({ emoji, username: socket.user.username });
    }

    await message.save();
    io.emit('reaction_updated', { messageId, reactions: message.reactions });
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
