require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload endpoint
app.post('/api/upload', require('./middleware/auth'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  
  const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    fileName: req.file.originalname,
    mimetype: req.file.mimetype
  });
});

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

  socket.on('send_message', async (data) => {
    let messageData = {};
    if (typeof data === 'string') {
      if (!data || data.trim() === '') return;
      messageData = { sender: socket.user.username, content: data.trim(), type: 'text' };
    } else if (typeof data === 'object') {
      if (!data.content && !data.fileUrl) return;
      messageData = {
        sender: socket.user.username,
        content: data.content || '',
        type: data.type || 'text',
        fileUrl: data.fileUrl || '',
        fileName: data.fileName || ''
      };
    } else {
      return;
    }
    
    const msg = await Message.create(messageData);
    io.emit('new_message', { 
      _id: msg._id, 
      sender: msg.sender, 
      content: msg.content, 
      type: msg.type,
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      createdAt: msg.createdAt 
    });
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
