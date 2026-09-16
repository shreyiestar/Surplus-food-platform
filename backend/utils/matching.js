const User = require('../models/User');

/**
 * Find the nearest verified NGO to a given point using MongoDB's $geoNear.
 * Returns the NGO document with an extra `distance` field (in meters), or null.
 */
async function findNearestNGO(coordinates, maxDistanceMeters = 15000) {
  const results = await User.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates },
        distanceField: 'distance',
        maxDistance: maxDistanceMeters,
        query: { role: 'ngo', verified: true },
        spherical: true
      }
    },
    { $limit: 1 }
  ]);
  return results[0] || null;
}

/**
 * Find the nearest available cooperative worker to a given point.
 * Returns the worker document with an extra `distance` field (in meters), or null.
 */
async function findNearestWorker(coordinates, maxDistanceMeters = 10000) {
  const results = await User.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates },
        distanceField: 'distance',
        maxDistance: maxDistanceMeters,
        query: { role: 'worker', available: true },
        spherical: true
      }
    },
    { $limit: 1 }
  ]);
  return results[0] || null;
}

/**
 * Fare/wage the cooperative worker earns for a job, based on total distance travelled
 * (worker's current location -> pickup point -> NGO drop point).
 * Tune baseFare / perKmRate to match local cooperative wage norms.
 */
function calculateFare(totalDistanceMeters) {
  const distanceKm = totalDistanceMeters / 1000;
  const baseFare = 30; // flat pickup fee (₹)
  const perKmRate = 8; // ₹ per km travelled
  const fare = baseFare + distanceKm * perKmRate;
  return Math.round(fare);
}

module.exports = { findNearestNGO, findNearestWorker, calculateFare };
