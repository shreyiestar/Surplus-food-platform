const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    donorType: {
      type: String,
      enum: ['restaurant', 'hostel', 'college_canteen', 'household', 'wedding_event', 'other'],
      default: 'other'
    },
    foodType: { type: String, required: true }, // e.g. "Cooked rice & curry"
    description: { type: String },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'kg' },

    pickupAddress: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true } // [lng, lat]
    },

    expiryTime: { type: Date, required: true }, // food must be picked up before this

    status: {
      type: String,
      enum: ['pending', 'matched', 'assigned', 'picked_up', 'delivered', 'cancelled', 'expired'],
      default: 'pending'
    },

    ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

donationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Donation', donationSchema);
