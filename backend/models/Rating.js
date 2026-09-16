const mongoose = require('mongoose');

// A single rating given after a donation is delivered.
// e.g. the NGO rates the donor (food quality) and the worker (professionalism).
const ratingSchema = new mongoose.Schema(
  {
    donation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
    ratedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['donor', 'worker'], required: true },
    target: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stars: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 300 }
  },
  { timestamps: true }
);

ratingSchema.index({ donation: 1, ratedBy: 1, targetType: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);