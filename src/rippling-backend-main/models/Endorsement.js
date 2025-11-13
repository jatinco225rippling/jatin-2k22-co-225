const mongoose = require('mongoose');

const endorsementSchema = new mongoose.Schema(
  {
    recognition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recognition',
      required: true,
    },
    endorser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// enforce: each endorser can endorse a recognition only once
endorsementSchema.index({ recognition: 1, endorser: 1 }, { unique: true });

module.exports = mongoose.model('Endorsement', endorsementSchema);
