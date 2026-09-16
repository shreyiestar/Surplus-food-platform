const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/register
// body: { name, email, password, role, phone, address, lat, lng, capacityKgPerDay? }
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, address, lat, lng, capacityKgPerDay } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password, role are required' });
    }
    if (!['donor', 'ngo', 'worker', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      phone,
      address,
      location: {
        type: 'Point',
        coordinates: [Number(lng) || 0, Number(lat) || 0]
      },
      capacityKgPerDay: role === 'ngo' ? capacityKgPerDay || 0 : undefined,
      // NGOs need admin verification before receiving matches; auto-verify others.
      verified: role === 'ngo' ? false : true
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, role: user.role, verified: user.verified }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// POST /api/auth/login
// body: { email, password }
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role, verified: user.verified }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

module.exports = router;
