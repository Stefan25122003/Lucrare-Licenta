const mongoose = require('mongoose');

const BlindTokenSchema = new mongoose.Schema({
  tokenHash: {
    type: String,
    required: true,
    unique: true
  },
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SecurePoll',
    required: true
  },
  usedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BlindToken', BlindTokenSchema);