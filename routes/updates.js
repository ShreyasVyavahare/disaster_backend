const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

// GET /disasters/:id/official-updates
router.get('/disasters/:id/official-updates', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = [
      {
        id: `update_${id}_1`,
        title: 'FEMA: Flood Response Ongoing',
        url: 'https://www.fema.gov/disaster/nyc-flood',
        summary: 'FEMA teams are on the ground in Manhattan, NYC, providing relief and rescue operations.',
        source: 'FEMA',
        published_at: new Date(Date.now() - 3600 * 1000).toISOString()
      },
      {
        id: `update_${id}_2`,
        title: 'Red Cross: Shelter Locations Open',
        url: 'https://www.redcross.org/local/new-york.html',
        summary: 'Red Cross has opened emergency shelters in Lower East Side and Brooklyn.',
        source: 'Red Cross',
        published_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      }
    ];
    logger.info(`Returned ${updates.length} official updates for disaster ${id}`);
    res.json({ updates });
  } catch (error) {
    logger.error('Official updates GET error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 