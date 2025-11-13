const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    creditsRedeemed: {
      type: Number,
      required: true,
      min: 1,
    },
    amountInINR: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Redemption', redemptionSchema);
