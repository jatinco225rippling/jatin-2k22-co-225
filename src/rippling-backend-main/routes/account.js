const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Redemption = require('../models/Redemption');
const { ensureMonthlyReset } = require('../utils/creditReset');

const router = express.Router();

// GET /api/account/me
router.get('/me', auth, async (req, res) => {
  console.log('[ACCOUNT] GET /me for userId=', req.user.id);

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      console.warn('[ACCOUNT] User not found for id=', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const changed = ensureMonthlyReset(user);
    if (changed) {
      await user.save();
      console.log('[ACCOUNT] Monthly reset applied and saved for user=', user.email);
    }

    res.json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      sendBalance: user.sendBalance,
      monthlySent: user.monthlySent,
      receivedBalance: user.receivedBalance,
      totalReceived: user.totalReceived,
      recognitionsReceivedCount: user.recognitionsReceivedCount,
      endorsementsReceived: user.endorsementsReceived,
    });
  } catch (err) {
    console.error('[ACCOUNT] Error in /me:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/account/redeem
router.post('/redeem', auth, async (req, res) => {
  console.log('[ACCOUNT] POST /redeem body=', req.body, 'userId=', req.user.id);

  try {
    const { credits } = req.body;
    const intCredits = parseInt(credits, 10);

    if (!intCredits || intCredits <= 0) {
      console.warn('[ACCOUNT] Invalid credits to redeem:', credits);
      return res.status(400).json({ message: 'Credits must be a positive number' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      console.warn('[ACCOUNT] User not found for id=', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.receivedBalance < intCredits) {
      console.warn(
        `[ACCOUNT] Insufficient credits to redeem. has=${user.receivedBalance}, wants=${intCredits}`
      );
      return res
        .status(400)
        .json({ message: 'Cannot redeem more credits than available balance' });
    }

    const amountInINR = intCredits * 5;

    user.receivedBalance -= intCredits;
    await user.save();

    const redemption = await Redemption.create({
      user: user._id,
      creditsRedeemed: intCredits,
      amountInINR,
    });

    console.log(
      `[ACCOUNT] Redemption success user=${user.email} credits=${intCredits} amountInINR=${amountInINR}`
    );

    res.status(201).json({
      redemptionId: redemption._id,
      creditsRedeemed: intCredits,
      amountInINR,
      newReceivedBalance: user.receivedBalance,
    });
  } catch (err) {
    console.error('[ACCOUNT] Error in /redeem:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
