const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Recognition = require('../models/Recognition');
const Endorsement = require('../models/Endorsement');
const { ensureMonthlyReset } = require('../utils/creditReset');

const router = express.Router();

// POST /api/recognitions  (send recognition)
router.post('/', auth, async (req, res) => {
  console.log('[RECOGNITION] POST / body=', req.body, 'senderId=', req.user.id);
  
  try {
    const { receiverId, credits, message } = req.body;
    const intCredits = parseInt(credits, 10);

    if (!receiverId || !intCredits || intCredits <= 0) {
      console.warn('[RECOGNITION] Missing receiverId or invalid credits');
      return res.status(400).json({ message: 'receiverId and positive credits are required' });
    }

    // Convert both to strings for comparison to handle ObjectId vs string mismatch
    const senderIdStr = req.user.id.toString();
    const receiverIdStr = receiverId.toString();

    if (receiverIdStr === senderIdStr) {
      console.warn('[RECOGNITION] Self-recognition attempt by userId=', req.user.id);
      return res.status(400).json({ message: 'Cannot send credits to yourself' });
    }

    // Convert receiverId to ObjectId if it's a string
    let receiverObjectId;
    try {
      receiverObjectId = mongoose.Types.ObjectId.isValid(receiverId) 
        ? new mongoose.Types.ObjectId(receiverId) 
        : receiverId;
    } catch (err) {
      return res.status(400).json({ message: 'Invalid receiverId format' });
    }

    const [sender, receiver] = await Promise.all([
      User.findById(req.user.id),
      User.findById(receiverObjectId),
    ]);

    if (!sender || !receiver) {
      console.warn('[RECOGNITION] Sender or receiver not found');
      return res.status(404).json({ message: 'Sender or receiver not found' });
    }

    // Apply monthly reset for sender if needed
    const changed = ensureMonthlyReset(sender);
    if (changed) {
      await sender.save();
    }

    // Business rules:
    if (sender.sendBalance < intCredits) {
      console.warn(
        `[RECOGNITION] Insufficient sendBalance. has=${sender.sendBalance}, wants=${intCredits}`
      );
      return res
        .status(400)
        .json({ message: 'Not enough sending credits available this month' });
    }

    if (sender.monthlySent + intCredits > 100) {
      console.warn(
        `[RECOGNITION] Monthly limit exceeded. monthlySent=${sender.monthlySent}, extra=${intCredits}`
      );
      return res
        .status(400)
        .json({ message: 'Cannot exceed monthly sending limit of 100 credits' });
    }

    // Update sender & receiver
    sender.sendBalance -= intCredits;
    sender.monthlySent += intCredits;
    receiver.receivedBalance += intCredits;
    receiver.totalReceived += intCredits;
    receiver.recognitionsReceivedCount += 1;

    const recognition = await Recognition.create({
      sender: sender._id,
      receiver: receiver._id,
      credits: intCredits,
      message: message || '',
    });

    await Promise.all([sender.save(), receiver.save()]);

    console.log(
      `[RECOGNITION] Success sender=${sender.email} -> receiver=${receiver.email} credits=${intCredits}`
    );

    res.status(201).json({
      id: recognition._id,
      senderId: sender._id,
      receiverId: receiver._id,
      credits: intCredits,
      message: recognition.message,
      createdAt: recognition.createdAt,
    });
  } catch (err) {
    console.error('[RECOGNITION] Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/recognitions  – global feed (optional)
router.get('/', auth, async (req, res) => {
  console.log('[RECOGNITION] GET / feed requested by userId=', req.user.id);
  
  try {
    const recognitions = await Recognition.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'fullName email')
      .populate('receiver', 'fullName email')
      .lean();

    // Filter out recognitions with null sender or receiver (deleted users)
    const validRecognitions = recognitions.filter(
      (r) => r.sender && r.receiver
    );

    const ids = validRecognitions.map((r) => r._id);

    let endorsementCounts = [];
    if (ids.length > 0) {
      endorsementCounts = await Endorsement.aggregate([
        { $match: { recognition: { $in: ids } } },
        { $group: { _id: '$recognition', count: { $sum: 1 } } },
      ]);
    }

    const countsMap = endorsementCounts.reduce((map, item) => {
      map[item._id.toString()] = item.count;
      return map;
    }, {});

    const withCounts = validRecognitions.map((r) => ({
      ...r,
      endorsementsCount: countsMap[r._id.toString()] || 0,
    }));

    res.json(withCounts);
  } catch (err) {
    console.error('[RECOGNITION] Error in GET /:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/recognitions/receiver/:id – recognitions for a specific student
router.get('/receiver/:id', auth, async (req, res) => {
  const receiverId = req.params.id;
  console.log(
    '[RECOGNITION] GET /receiver/:id receiverId=',
    receiverId,
    'requestedBy=',
    req.user.id
  );

  try {
    // Validate receiverId format
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: 'Invalid receiver ID format' });
    }

    const recognitions = await Recognition.find({ receiver: receiverId })
      .sort({ createdAt: -1 })
      .populate('sender', 'fullName email')
      .lean();

    // Filter out recognitions with null sender (deleted users)
    const validRecognitions = recognitions.filter((r) => r.sender);

    const ids = validRecognitions.map((r) => r._id);

    let endorsementCounts = [];
    if (ids.length > 0) {
      endorsementCounts = await Endorsement.aggregate([
        { $match: { recognition: { $in: ids } } },
        { $group: { _id: '$recognition', count: { $sum: 1 } } },
      ]);
    }

    const countsMap = endorsementCounts.reduce((map, item) => {
      map[item._id.toString()] = item.count;
      return map;
    }, {});

    const withCounts = validRecognitions.map((r) => ({
      id: r._id,
      senderName: r.sender.fullName,
      senderEmail: r.sender.email,
      credits: r.credits,
      message: r.message,
      createdAt: r.createdAt,
      endorsementsCount: countsMap[r._id.toString()] || 0,
    }));

    res.json(withCounts);
  } catch (err) {
    console.error('[RECOGNITION] Error in GET /receiver/:id:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

