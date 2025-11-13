require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// 🔹 1) Core middleware FIRST
app.use(express.json()); // <-- THIS is critical
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// 🔹 2) DB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// 🔹 3) Health
app.get('/api/health', (req, res) => {
  console.log('[HEALTH] /api/health hit');
  res.json({ status: 'ok' });
});

// 🔹 4) Routes (AFTER express.json())
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const recognitionRoutes = require('./routes/recognitions');
const endorsementRoutes = require('./routes/endorsements');
const leaderboardRoutes = require('./routes/leaderboard');
const userRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/recognitions', recognitionRoutes);
app.use('/api/endorsements', endorsementRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);

// 🔹 5) Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
