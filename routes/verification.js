const express = require('express');
const geminiService = require('../services/gemini');
const logger = require('../utils/logger');

const router = express.Router();

// POST /disasters/:id/verify-image
router.post('/disasters/:id/verify-image', async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url } = req.body;
    if (!image_url) {
      return res.status(400).json({ error: 'image_url is required' });
    }
    const result = await geminiService.verifyImage(image_url);
    logger.info(`Image verification for disaster ${id}: ${JSON.stringify(result)}`);
    res.json({ verification: result });
  } catch (error) {
    logger.error('Image verification POST error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 