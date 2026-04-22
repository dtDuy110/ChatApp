const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  content: { type: String, required: true }, // For text or filename display
  type: { type: String, default: 'text' }, // 'text' | 'image' | 'file'
  fileUrl: { type: String }, // Used when type is 'image' or 'file'
  fileName: { type: String }, // Original filename
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
