// TrainingSession 모델

const mongoose = require('mongoose');

const trainingSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true
  },
  trainingType: {
    type: String,
    enum: ['nbl', 'cupola'],
    default: 'nbl'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  phaseData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  performanceMetrics: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  overallScore: {
    type: Number,
    default: 0
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B', 'C', 'D', 'F'],
    default: 'F'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'failed'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TrainingSession', trainingSessionSchema);