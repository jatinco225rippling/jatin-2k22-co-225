const express = require('express');
const auth = require('../middleware/auth');
const Recognition = require('../models/Recognition');
const Endorsement = require('../models/Endorsement');
const User = require('../models/User');

const router = express.Router();

// POST /api/endorsements
router.post('/', auth, async (req, res) => {
  console.log('[ENDORSEMENT] POST / body=', req.body, 'endorserId=', req.user.id);

  try {
    const { recognitionId } = req.body;
    if (!recognitionId) {
      console.warn('[ENDORSEMENT] No recognitionId provided');
      return res.status(400).json({ message: 'recognitionId is required' });
    }

    const recognition = await Recognition.findById(recognitionId);
    if (!recognition) {
      console.warn('[ENDORSEMENT] Recognition not found id=', recognitionId);
      return res.status(404).json({ message: 'Recognition not found' });
    }

    // Try to create endorsement (unique index will enforce one per user)
    try {
      const endorsement = await Endorsement.create({
        recognition: recognition._id,
        endorser: req.user.id,
      });

      // Increment receiver's endorsementsReceived
      const receiver = await User.findById(recognition.receiver);
      if (receiver) {
        receiver.endorsementsReceived += 1;
        await receiver.save();
      }

      console.log(
        `[ENDORSEMENT] Success recognitionId=${recognitionId} endorserId=${req.user.id}`
      );

      return res.status(201).json({
        id: endorsement._id,
        recognitionId: recognition._id,
      });
    } catch (err) {
      if (err.code === 11000) {
        console.warn(
          `[ENDORSEMENT] Duplicate endorsement attempt recognitionId=${recognitionId} endorserId=${req.user.id}`
        );
        return res
          .status(400)
          .json({ message: 'You have already endorsed this recognition' });
      }
      throw err;
    }
  } catch (err) {
    console.error('[ENDORSEMENT] Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
