const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// GET /api/leaderboard?limit=10
router.get('/', auth, async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  console.log('[LEADERBOARD] GET / limit=', limit, 'requestedBy=', req.user.id);

  try {
    const users = await User.find({})
      .sort({ totalReceived: -1, _id: 1 }) // tie-break by id asc
      .limit(limit)
      .select(
        'fullName email totalReceived recognitionsReceivedCount endorsementsReceived'
      )
      .lean();

    const ranked = users.map((u, idx) => ({
      rank: idx + 1,
      id: u._id,
      fullName: u.fullName,
      email: u.email,
      totalCreditsReceived: u.totalReceived,
      recognitionsReceivedCount: u.recognitionsReceivedCount,
      endorsementsReceived: u.endorsementsReceived,
    }));

    res.json(ranked);
  } catch (err) {
    console.error('[LEADERBOARD] Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
