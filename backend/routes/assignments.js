const express = require('express');
const Assignment = require('../models/Assignment');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/assignments/donation/:donationId - find the worker assigned to a donation (used for rating)
router.get('/donation/:donationId', requireAuth, async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ donation: req.params.donationId }).populate(
      'worker',
      'name phone'
    );
    if (!assignment) return res.status(404).json({ message: 'No assignment found for this donation' });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch assignment', error: err.message });
  }
});
router.get('/mine', requireAuth, requireRole('worker'), async (req, res) => {
  try {
    const assignments = await Assignment.find({ worker: req.user.id })
      .populate({ path: 'donation', populate: { path: 'donor', select: 'name phone address' } })
      .populate('ngo', 'name phone address')
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch assignments', error: err.message });
  }
});

router.put('/:id/status', requireAuth, requireRole('worker'), async (req, res) => {
  try {
    const { status, foodSafetyCheck } = req.body;
    if (!['picked_up', 'delivered'].includes(status)) {
      return res.status(400).json({ message: 'status must be picked_up or delivered' });
    }

    if (status === 'picked_up') {
      const c = foodSafetyCheck || {};
      if (!c.sealedOrCovered || !c.withinExpiry || !c.noSpoilageSigns) {
        return res.status(400).json({ message: 'All food safety checks must be confirmed before pickup' });
      }
    }

    const assignment = await Assignment.findOne({ _id: req.params.id, worker: req.user.id });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    assignment.status = status;
    if (status === 'picked_up') {
      assignment.pickedUpAt = new Date();
      assignment.foodSafetyCheck = foodSafetyCheck;
    }
    if (status === 'delivered') assignment.deliveredAt = new Date();
    await assignment.save();

    await Donation.findByIdAndUpdate(assignment.donation, { status });

    if (status === 'delivered') {
      await User.findByIdAndUpdate(assignment.worker, {
        $inc: { totalEarnings: assignment.fare, completedDeliveries: 1 },
        available: true
      });
    }

    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update assignment', error: err.message });
  }
});

module.exports = router;