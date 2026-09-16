const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    donation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    distanceKm: { type: Number, required: true },
    fare: { type: Number, required: true },

    status: {
      type: String,
      enum: ['assigned', 'picked_up', 'delivered', 'cancelled'],
      default: 'assigned'
    },

    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },

    foodSafetyCheck: {
      sealedOrCovered: { type: Boolean, default: false },
      withinExpiry: { type: Boolean, default: false },
      noSpoilageSigns: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
