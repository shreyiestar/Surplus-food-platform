const express = require('express');
const Donation = require('../models/Donation');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');
const { findNearestNGO, findNearestWorker, calculateFare } = require('../utils/matching');

const router = express.Router();

// POST /api/donations  (donor only)
// body: { donorType, foodType, description, quantity, unit, pickupAddress, lat, lng, expiryTime }
router.post('/', requireAuth, requireRole('donor'), async (req, res) => {
  try {
    const { donorType, foodType, description, quantity, unit, pickupAddress, lat, lng, expiryTime } =
      req.body;

    if (!foodType || !quantity || !pickupAddress || !lat || !lng || !expiryTime) {
      return res.status(400).json({
        message: 'foodType, quantity, pickupAddress, lat, lng, expiryTime are required'
      });
    }

    const coordinates = [Number(lng), Number(lat)];

    const donation = await Donation.create({
      donor: req.user.id,
      donorType,
      foodType,
      description,
      quantity,
      unit: unit || 'kg',
      pickupAddress,
      location: { type: 'Point', coordinates },
      expiryTime
    });

    // ---- Auto-matching pipeline ----
    // 1) Find nearest verified NGO that can take this donation
    const ngoMatch = await findNearestNGO(coordinates);
    let assignment = null;

    if (ngoMatch) {
      donation.ngo = ngoMatch._id;
      donation.status = 'matched';

      // 2) Find nearest available cooperative worker to do the pickup+drop
      const workerMatch = await findNearestWorker(coordinates);

      if (workerMatch) {
        const totalDistanceMeters = (workerMatch.distance || 0) + (ngoMatch.distance || 0);
        const fare = calculateFare(totalDistanceMeters);

        assignment = await Assignment.create({
          donation: donation._id,
          worker: workerMatch._id,
          ngo: ngoMatch._id,
          distanceKm: Math.round((totalDistanceMeters / 1000) * 10) / 10,
          fare,
          status: 'assigned'
        });

        donation.status = 'assigned';
        await User.findByIdAndUpdate(workerMatch._id, { available: false });
      }
    }

    await donation.save();

    res.status(201).json({ donation, assignment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create donation', error: err.message });
  }
});

// GET /api/donations  - role-aware listing
// donor -> their own donations, ngo -> donations matched to them, worker/admin -> all
router.get('/', requireAuth, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'donor') filter = { donor: req.user.id };
    if (req.user.role === 'ngo') filter = { ngo: req.user.id };

    const donations = await Donation.find(filter)
      .populate('donor', 'name phone address')
      .populate('ngo', 'name phone address')
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch donations', error: err.message });
  }
});

// GET /api/donations/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name phone address')
      .populate('ngo', 'name phone address');
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch donation', error: err.message });
  }
});

// PUT /api/donations/:id/cancel  (donor cancels before pickup)
router.put('/:id/cancel', requireAuth, requireRole('donor'), async (req, res) => {
  try {
    const donation = await Donation.findOne({ _id: req.params.id, donor: req.user.id });
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (['picked_up', 'delivered'].includes(donation.status)) {
      return res.status(400).json({ message: 'Cannot cancel - already in progress or completed' });
    }
    donation.status = 'cancelled';
    await donation.save();
    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel donation', error: err.message });
  }
});

module.exports = router;
