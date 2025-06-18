const mongoose = require('mongoose');

const PollSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  options: [{
    text: { 
      type: String, 
      required: true 
    },
    votes: { 
      type: Number, 
      default: 0 
    }
  }],
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
});

module.exports = mongoose.model('Poll', PollSchema);