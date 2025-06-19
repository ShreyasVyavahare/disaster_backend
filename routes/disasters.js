const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../utils/supabase');
const logger = require('../utils/logger');
const geminiService = require('../services/gemini');
const geocodingService = require('../services/geocoding');
const { requireAdmin, requireContributor } = require('../middleware/auth');

const router = express.Router();

// GET /disasters - List all disasters with optional filtering
router.get('/', async (req, res) => {
  try {
    const { tag, owner_id, limit = 50, offset = 0 } = req.query;
    
    let query = supabase
      .from('disasters')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (tag) {
      query = query.contains('tags', [tag]);
    }
    
    if (owner_id) {
      query = query.eq('owner_id', owner_id);
    }

    const { data: disasters, error } = await query;

    if (error) {
      logger.error('Error fetching disasters:', error);
      return res.status(500).json({ error: 'Failed to fetch disasters' });
    }

    logger.info(`Retrieved ${disasters.length} disasters`);
    res.json({
      disasters,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: disasters.length
      }
    });
  } catch (error) {
    logger.error('Disasters GET error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /disasters/:id - Get specific disaster
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: disaster, error } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Disaster not found' });
      }
      logger.error('Error fetching disaster:', error);
      return res.status(500).json({ error: 'Failed to fetch disaster' });
    }

    logger.info(`Retrieved disaster: ${disaster.title}`);
    res.json({ disaster });
  } catch (error) {
    logger.error('Disaster GET error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /disasters - Create new disaster
router.post('/', requireContributor, async (req, res) => {
  try {
    const { title, location_name, description, tags = [] } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ 
        error: 'Title and description are required' 
      });
    }

    // Extract location from description if not provided
    let finalLocationName = location_name;
    if (!finalLocationName) {
      finalLocationName = await geminiService.extractLocation(description);
      logger.info(`Extracted location: ${finalLocationName} from description`);
    }

    // Geocode the location
    let coordinates = null;
    if (finalLocationName) {
      coordinates = await geocodingService.geocode(finalLocationName);
      if (coordinates) {
        logger.info(`Geocoded location: ${finalLocationName} to ${coordinates.lat}, ${coordinates.lng}`);
      }
    }

    const disaster = {
      id: uuidv4(),
      title,
      location_name: finalLocationName,
      location: coordinates ? `POINT(${coordinates.lng} ${coordinates.lat})` : null,
      description,
      tags: Array.isArray(tags) ? tags : [tags],
      owner_id: req.user.id,
      created_at: new Date().toISOString(),
      audit_trail: [{
        action: 'create',
        user_id: req.user.id,
        timestamp: new Date().toISOString()
      }]
    };

    const { data, error } = await supabase
      .from('disasters')
      .insert(disaster)
      .select()
      .single();

    if (error) {
      logger.error('Error creating disaster:', error);
      return res.status(500).json({ error: 'Failed to create disaster' });
    }

    // Note: WebSocket emit removed for serverless compatibility
    // io.emit('disaster_created', { disaster: data });

    logger.info(`Disaster created: ${data.title} by ${req.user.id}`);
    res.status(201).json({ 
      disaster: data,
      message: 'Disaster created successfully'
    });
  } catch (error) {
    logger.error('Disaster POST error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /disasters/:id - Update disaster
router.put('/:id', requireContributor, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, location_name, description, tags } = req.body;
    
    // Check if disaster exists and user has permission
    const { data: existingDisaster, error: fetchError } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Disaster not found' });
      }
      logger.error('Error fetching disaster for update:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch disaster' });
    }

    // Only admin or owner can update
    if (req.user.role !== 'admin' && existingDisaster.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Prepare update data
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (tags) updateData.tags = Array.isArray(tags) ? tags : [tags];

    // Handle location updates
    if (location_name || description) {
      let finalLocationName = location_name || existingDisaster.location_name;
      
      if (!finalLocationName && description) {
        finalLocationName = await geminiService.extractLocation(description);
        logger.info(`Extracted location: ${finalLocationName} from description`);
      }

      if (finalLocationName) {
        updateData.location_name = finalLocationName;
        
        // Re-geocode if location changed
        if (finalLocationName !== existingDisaster.location_name) {
          const coordinates = await geocodingService.geocode(finalLocationName);
          if (coordinates) {
            updateData.location = `POINT(${coordinates.lng} ${coordinates.lat})`;
            logger.info(`Re-geocoded location: ${finalLocationName} to ${coordinates.lat}, ${coordinates.lng}`);
          }
        }
      }
    }

    // Add audit trail entry
    const auditEntry = {
      action: 'update',
      user_id: req.user.id,
      timestamp: new Date().toISOString(),
      changes: Object.keys(updateData)
    };

    updateData.audit_trail = [
      ...(existingDisaster.audit_trail || []),
      auditEntry
    ];

    const { data, error } = await supabase
      .from('disasters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating disaster:', error);
      return res.status(500).json({ error: 'Failed to update disaster' });
    }

    // Note: WebSocket emit removed for serverless compatibility
    // const io = req.app.get('io');
    // io.emit('disaster_updated', { disaster: data });

    logger.info(`Disaster updated: ${data.title} by ${req.user.id}`);
    res.json({ 
      disaster: data,
      message: 'Disaster updated successfully'
    });
  } catch (error) {
    logger.error('Disaster PUT error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /disasters/:id - Delete disaster
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if disaster exists
    const { data: existingDisaster, error: fetchError } = await supabase
      .from('disasters')
      .select('title')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Disaster not found' });
      }
      logger.error('Error fetching disaster for deletion:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch disaster' });
    }

    const { error } = await supabase
      .from('disasters')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting disaster:', error);
      return res.status(500).json({ error: 'Failed to delete disaster' });
    }

    // Note: WebSocket emit removed for serverless compatibility
    // const io = req.app.get('io');
    // io.emit('disaster_deleted', { disaster_id: id });

    logger.info(`Disaster deleted: ${existingDisaster.title} by ${req.user.id}`);
    res.json({ 
      message: 'Disaster deleted successfully',
      disaster_id: id
    });
  } catch (error) {
    logger.error('Disaster DELETE error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /disasters/:id/reports - Get reports for a disaster
router.get('/:id/reports', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('disaster_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching reports:', error);
      return res.status(500).json({ error: 'Failed to fetch reports' });
    }

    logger.info(`Retrieved ${reports.length} reports for disaster ${id}`);
    res.json({
      reports,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: reports.length
      }
    });
  } catch (error) {
    logger.error('Reports GET error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 