const express = require('express');
const Donation = require('../models/Donation');
const Assignment = require('../models/Assignment');
const User = require('../models/User');

const router = express.Router();

router.get('/impact', async (req, res) => {
  try {
    const delivered = await Donation.find({ status: 'delivered' });
    const totalKgSaved = delivered.reduce((sum, d) => sum + (d.unit === 'kg' ? d.quantity : 0), 0);
    const totalDeliveries = delivered.length;

    const assignments = await Assignment.find({ status: 'delivered' });
    const totalWagesPaid = assignments.reduce((sum, a) => sum + a.fare, 0);

    const ngoCount = await User.countDocuments({ role: 'ngo', verified: true });
    const workerCount = await User.countDocuments({ role: 'worker' });

    const estimatedMeals = Math.round(totalKgSaved * 2.5);

    res.json({ totalKgSaved, totalDeliveries, totalWagesPaid, ngoCount, workerCount, estimatedMeals });
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute impact stats', error: err.message });
  }
});

router.get('/partners', async (req, res) => {
  try {
    const results = await Donation.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: '$donor', totalKg: { $sum: '$quantity' }, donations: { $sum: 1 } } },
      { $sort: { totalKg: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'donor' } },
      { $unwind: '$donor' },
      { $project: { name: '$donor.name', address: '$donor.address', totalKg: 1, donations: 1 } }
    ]);

    const withBadges = results.map((r) => ({
      ...r,
      badge:
        r.totalKg >= 500 ? 'Platinum' : r.totalKg >= 200 ? 'Gold' : r.totalKg >= 50 ? 'Silver' : 'Bronze'
    }));

    res.json(withBadges);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch partners', error: err.message });
  }
});

module.exports = router;