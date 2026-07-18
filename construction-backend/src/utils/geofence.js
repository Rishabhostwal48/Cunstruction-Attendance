/**
 * Geofence Validation Utility
 * Uses Haversine Formula to calculate distance between two coordinates
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.asin(Math.sqrt(a));
  const distance = EARTH_RADIUS_KM * c * 1000; // Convert to meters
  
  return distance;
};

/**
 * Check if a location is within the geofence
 * @param {number} siteLatitude - Site latitude
 * @param {number} siteLongitude - Site longitude
 * @param {number} workerLatitude - Worker latitude
 * @param {number} workerLongitude - Worker longitude
 * @param {number} radiusMeters - Allowed radius in meters (default: 100m)
 * @returns {Object} Object with isInside boolean and distance in meters
 */
const validateGeofence = (siteLatitude, siteLongitude, workerLatitude, workerLongitude, radiusMeters = 100) => {
  const distance = calculateDistance(
    siteLatitude,
    siteLongitude,
    workerLatitude,
    workerLongitude
  );

  return {
    isInside: distance <= radiusMeters,
    distance: Math.round(distance),
    radius: radiusMeters,
    status: distance <= radiusMeters ? 'INSIDE' : 'OUTSIDE'
  };
};

/**
 * Validate multiple coordinates for geofence
 * @param {Object} site - Site object with latitude, longitude, radius
 * @param {number} workerLatitude - Worker latitude
 * @param {number} workerLongitude - Worker longitude
 * @returns {Object} Validation result
 */
const validateWorkerLocation = (site, workerLatitude, workerLongitude) => {
  if (!site || !site.latitude || !site.longitude) {
    throw new Error('Invalid site coordinates');
  }

  if (workerLatitude === undefined || workerLongitude === undefined) {
    throw new Error('Invalid worker coordinates');
  }

  const radius = site.radius || 100;
  return validateGeofence(site.latitude, site.longitude, workerLatitude, workerLongitude, radius);
};

module.exports = {
  calculateDistance,
  validateGeofence,
  validateWorkerLocation
};
