const express = require('express');
const { supabase } = require('../utils/supabase');
const logger = require('../utils/logger');

const router = express.Router();

// GET /disasters/:id/resources?lat=...&lon=...
router.get('/disasters/:id/resources', async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lon, radius = 10000, limit = 50, offset = 0 } = req.query;
    let query = supabase
      .from('resources')
      .select('*')
      .eq('disaster_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // If lat/lon provided, filter by geospatial distance (mock logic: just return all for now)
    // In real use, would use ST_DWithin in Supabase/PostGIS
    // For mock, just return all resources for the disaster
    const { data: resources, error } = await query;
    if (error) {
      logger.error('Error fetching resources:', error);
      return res.status(500).json({ error: 'Failed to fetch resources' });
    }
    logger.info(`Returned ${resources.length} resources for disaster ${id}`);
    res.json({
      resources,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: resources.length
      }
    });
  } catch (error) {
    logger.error('Resources GET error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 