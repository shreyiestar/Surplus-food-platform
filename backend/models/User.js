const mongoose = require('mongoose');

// A single User model serves donors, NGOs, cooperative workers, and admins.
// The `role` field decides which extra fields are meaningful.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // stored as bcrypt hash
    role: {
      type: String,
      enum: ['donor', 'ngo', 'worker', 'admin'],
      required: true
    },
    phone: { type: String },
    address: { type: String },

    // GeoJSON point - required for $geoNear / $near matching queries
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    },

    // --- NGO-specific fields ---
    capacityKgPerDay: { type: Number, default: 0 },
    verified: { type: Boolean, default: false }, // admin verifies NGOs before they can receive matches

    // --- Cooperative worker-specific fields ---
    available: { type: Boolean, default: true }, // false while on an active delivery
    totalEarnings: { type: Number, default: 0 },
    completedDeliveries: { type: Number, default: 0 }
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
