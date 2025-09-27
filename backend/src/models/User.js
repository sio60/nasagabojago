// MongoDB 모델 생성 : User 모델

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  weight: {
    type: Number,
    required: true,
    default: 70.0
  },
  height: {
    type: Number,
    required: true,
    default: 175.0
  },
  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);