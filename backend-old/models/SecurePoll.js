const mongoose = require('mongoose');

const SecurePollSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  options: [{
    text: { 
      type: String, 
      required: true 
    }
  }],
  // Store encrypted votes as binary data
  encryptedVotes: {
    type: [Buffer],
    default: []
  },
  // Final tally will only be computed and revealed at the end
  finalResults: [{
    text: String,
    votes: Number
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  endDate: {
    type: Date,
    required: true
  }
});

module.exports = mongoose.model('SecurePoll', SecurePollSchema);