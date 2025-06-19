const express = require('express');
const geminiService = require('../services/gemini');
const geocodingService = require('../services/geocoding');
const logger = require('../utils/logger');

const router = express.Router();

// POST /geocode
router.post('/', async (req, res) => {
  try {
    const { description, location_name } = req.body;
    if (!description && !location_name) {
      return res.status(400).json({ error: 'description or location_name is required' });
    }
    // Use Gemini to extract location if not provided
    let locName = location_name;
    if (!locName && description) {
      locName = await geminiService.extractLocation(description);
    }
    if (!locName) {
      return res.status(404).json({ error: 'No location could be extracted' });
    }
    // Use mock geocoding
    const coordinates = await geocodingService.geocode(locName);
    logger.info(`Geocoded location: ${locName} -> ${JSON.stringify(coordinates)}`);
    res.json({ location_name: locName, coordinates });
  } catch (error) {
    logger.error('Geocode POST error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 