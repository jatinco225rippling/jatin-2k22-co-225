const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Helper: generate JWT
function generateToken(user) {
  console.log(`DEBUG: Generating token for user ID: ${user._id}`);
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  console.log('--- HIT: POST /api/auth/register ---');
  console.log('DEBUG: Request body:', req.body);
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      console.log('DEBUG: Registration failed - Missing fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    console.log(`DEBUG: Checking if email exists: ${email}`);
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('DEBUG: Registration failed - Email already registered');
      return res.status(400).json({ message: 'Email already registered' });
    }

    console.log('DEBUG: Email is unique. Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    console.log('DEBUG: Creating new user in database...');
    const user = await User.create({
      fullName,
      email,
      passwordHash,
      // initial credit fields use defaults
    });
    console.log(`DEBUG: User created successfully with ID: ${user._id}`);

    const token = generateToken(user);

    console.log(`DEBUG: Registration successful for ${user.email}`);
    res.status(201).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        sendBalance: user.sendBalance,
        receivedBalance: user.receivedBalance,
      },
      token,
    });
  } catch (err) {
    console.error('ERROR: Register route error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  console.log('--- HIT: POST /api/auth/login ---');
  console.log('DEBUG: Request body:', req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('DEBUG: Login failed - Missing email or password');
      return res.status(400).json({ message: 'Email and password required' });
    }

    console.log(`DEBUG: Attempting login for: ${email}`);
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`DEBUG: Login failed - User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`DEBUG: User found: ${user._id}. Comparing password...`);
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log(`DEBUG: Login failed - Password mismatch for ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('DEBUG: Password match. Generating token...');
    const token = generateToken(user);

    console.log(`DEBUG: Login successful for ${user.email}`);
    res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        sendBalance: user.sendBalance,
        receivedBalance: user.receivedBalance,
      },
      token,
    });
  } catch (err) {
    console.error('ERROR: Login route error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;