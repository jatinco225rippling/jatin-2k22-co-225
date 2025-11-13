const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },

    // --- Credits for sending recognitions (monthly) ---
    sendBalance: {
      type: Number,
      default: 100, // current month available to send
    },
    monthlySent: {
      type: Number,
      default: 0, // how much sent this month
    },
    lastResetMonth: {
      type: String, // "YYYY-MM"
      default: () => new Date().toISOString().slice(0, 7),
    },

    // --- Credits & stats for receiving & leaderboard ---
    receivedBalance: {
      type: Number,
      default: 0, // credits available to redeem
    },
    totalReceived: {
      type: Number,
      default: 0, // lifetime credits received (for leaderboard)
    },
    recognitionsReceivedCount: {
      type: Number,
      default: 0, // number of recognitions received
    },
    endorsementsReceived: {
      type: Number,
      default: 0, // total endorsements on recognitions received
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
