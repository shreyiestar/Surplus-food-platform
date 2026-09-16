const express = require('express');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/me - current logged-in user's profile (earnings, verified status, etc.)
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// GET /api/users/ngos/unverified  (admin only) - NGOs pending verification
router.get('/ngos/unverified', requireAuth, requireRole('admin'), async (req, res) => {
  const ngos = await User.find({ role: 'ngo', verified: false }).select('-password');
  res.json(ngos);
});

// PUT /api/users/:id/verify  (admin only) - approve an NGO so it starts receiving matches
router.put('/:id/verify', requireAuth, requireRole('admin'), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { verified: true }, { new: true }).select(
    '-password'
  );
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

module.exports = router;
