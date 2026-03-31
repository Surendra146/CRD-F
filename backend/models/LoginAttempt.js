const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  lockedUntil: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 900
  }
});

loginAttemptSchema.index({ identifier: 1 });

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);