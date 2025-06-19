const logger = require('../utils/logger');

// Mock users with roles
const mockUsers = {
  'netrunnerX': { id: 'netrunnerX', role: 'admin', name: 'Netrunner X' },
  'reliefAdmin': { id: 'reliefAdmin', role: 'admin', name: 'Relief Administrator' },
  'citizen1': { id: 'citizen1', role: 'contributor', name: 'Citizen Reporter' },
  'responder1': { id: 'responder1', role: 'contributor', name: 'Emergency Responder' },
  'volunteer1': { id: 'volunteer1', role: 'contributor', name: 'Volunteer Helper' }
};

// Mock authentication middleware
const authMiddleware = (req, res, next) => {
  // Get user from headers (in real app, this would be a JWT token)
  const userId = req.headers['x-user-id'] || req.headers['authorization'];
  
  if (!userId) {
    return res.status(401).json({ 
      error: 'Authentication required. Please provide x-user-id header or authorization token.' 
    });
  }

  // Extract user ID from Bearer token if provided
  let user;
  if (userId.startsWith('Bearer ')) {
    const token = userId.replace('Bearer ', '');
    user = mockUsers[token];
  } else {
    user = mockUsers[userId];
  }

  if (!user) {
    logger.warn(`Authentication failed for user: ${userId}`);
    return res.status(401).json({ 
      error: 'Invalid user credentials. Available users: netrunnerX, reliefAdmin, citizen1, responder1, volunteer1' 
    });
  }

  // Add user to request object
  req.user = user;
  
  logger.info(`User authenticated: ${user.id} (${user.role})`);
  next();
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      logger.warn(`Access denied: User ${req.user.id} (${userRole}) attempted to access ${req.path}`);
      return res.status(403).json({ 
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
      });
    }

    next();
  };
};

// Admin-only middleware
const requireAdmin = requireRole('admin');

// Contributor or admin middleware
const requireContributor = requireRole(['admin', 'contributor']);

module.exports = {
  authMiddleware,
  requireRole,
  requireAdmin,
  requireContributor,
  mockUsers
}; 