const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// GET /api/users  – list all users (basic info)
router.get('/', auth, async (req, res) => {
  console.log('[USERS] GET / requested by=', req.user.id);
  try {
    const users = await User.find({})
      .select('fullName email')
      .sort({ fullName: 1 })
      .lean();

    res.json(
      users.map((u) => ({
        id: u._id,
        fullName: u.fullName,
        email: u.email,
      }))
    );
  } catch (err) {
    console.error('[USERS] Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
