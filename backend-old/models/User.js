const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  fullName: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  profileImage: {
    type: String,
    default: ''
  },
  votedPolls: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Poll' 
  }]
});

module.exports = mongoose.model('User', UserSchema);