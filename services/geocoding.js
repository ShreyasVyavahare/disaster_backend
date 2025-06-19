const logger = require('../utils/logger');
const cacheManager = require('../utils/cache');

class GeocodingService {
  constructor() {}

  async geocode(locationName) {
    const cacheKey = `geocode_${Buffer.from(locationName).toString('base64').substring(0, 50)}`;
    return cacheManager.cached(cacheKey, async () => {
      const knownLocations = {
        'Manhattan, NYC': { lat: 40.7831, lng: -73.9712, service: 'mock', formatted_address: 'Manhattan, NYC' },
        'Lower East Side, NYC': { lat: 40.7150, lng: -73.9843, service: 'mock', formatted_address: 'Lower East Side, NYC' },
        'Brooklyn, NYC': { lat: 40.6782, lng: -73.9442, service: 'mock', formatted_address: 'Brooklyn, NYC' },
        'Queens, NYC': { lat: 40.7282, lng: -73.7949, service: 'mock', formatted_address: 'Queens, NYC' },
        'Bronx, NYC': { lat: 40.8448, lng: -73.8648, service: 'mock', formatted_address: 'Bronx, NYC' },
        'Staten Island, NYC': { lat: 40.5795, lng: -74.1502, service: 'mock', formatted_address: 'Staten Island, NYC' }
      };
      if (knownLocations[locationName]) {
        logger.info(`Mock geocoded ${locationName}`);
        return knownLocations[locationName];
      }
      const lat = 40.7 + Math.random() * 0.2;
      const lng = -74.0 + Math.random() * 0.1;
      logger.info(`Mock geocoded unknown location: ${locationName}`);
      return { lat, lng, service: 'mock', formatted_address: locationName };
    }, 86400);
  }

  // Reverse geocoding (mock)
  async reverseGeocode(lat, lng) {
    return { address: `Mock address for (${lat}, ${lng})`, service: 'mock' };
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  toRadians(degrees) { return degrees * (Math.PI / 180); }
  isValidCoordinates(lat, lng) { return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180; }
}

module.exports = new GeocodingService(); 