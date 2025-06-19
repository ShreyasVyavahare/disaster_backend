const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const disasterRoutes = require('./routes/disasters');
const socialMediaRoutes = require('./routes/socialMedia');
const resourceRoutes = require('./routes/resources');
const updateRoutes = require('./routes/updates');
const verificationRoutes = require('./routes/verification');
const geocodingRoutes = require('./routes/geocoding');
const { authMiddleware } = require('./middleware/auth');

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173', 'https://disaster-frontend-gamma.vercel.app/'
];

function dynamicCorsOrigin(origin, callback) {
  if (
    allowedOrigins.includes(origin) ||
    /^https:\/\/disaster-frontend.*\.vercel\.app$/.test(origin)
  ) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
}

app.use(cors({
  origin: dynamicCorsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    deployed: process.env.VERCEL === '1'
  });
});

// API Routes
app.use('/api/disasters', authMiddleware, disasterRoutes);
app.use('/api/social-media', authMiddleware, socialMediaRoutes);
app.use('/api/resources', authMiddleware, resourceRoutes);
app.use('/api/updates', authMiddleware, updateRoutes);
app.use('/api/verification', authMiddleware, verificationRoutes);
app.use('/api/geocode', authMiddleware, geocodingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { 
    stack: err.stack, 
    url: req.url, 
    method: req.method 
  });
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export the app for Vercel serverless
module.exports = app; 