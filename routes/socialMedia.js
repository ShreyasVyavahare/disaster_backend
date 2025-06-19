const express = require('express');
const socialMediaService = require('../services/socialMedia');
const logger = require('../utils/logger');

const router = express.Router();

// GET /disasters/:id/social-media
router.get('/disasters/:id/social-media', async (req, res) => {
  try {
    const { id } = req.params;
    const { keywords } = req.query;
    const keywordArr = keywords ? keywords.split(',') : [];
    const result = await socialMediaService.getSocialMediaReports(id, keywordArr);
    const analysis = socialMediaService.analyzeReports(result.reports);
    logger.info(`Returned social media reports and analysis for disaster ${id}`);
    res.json({ ...result, analysis });
  } catch (error) {
    logger.error('Social media GET error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 