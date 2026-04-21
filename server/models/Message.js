const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  content: { type: String }, // text content
  type: { type: String, enum: ['text', 'image', 'sticker'], default: 'text' },
  url: { type: String }, // image or sticker URL
  reactions: [{
    emoji: String,
    username: String
  }],
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
