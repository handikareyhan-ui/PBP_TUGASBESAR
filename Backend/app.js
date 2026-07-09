const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development and integration
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const recipientRoutes = require('./routes/recipientRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const distributionRoutes = require('./routes/distributionRoutes');
const fundRoutes = require('./routes/fundRoutes');
const auditRoutes = require('./routes/auditRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');

// Mount Routes under /api namespace
app.use('/api', authRoutes);
app.use('/api', recipientRoutes);
app.use('/api', verificationRoutes);
app.use('/api', distributionRoutes);
app.use('/api/disbursement', distributionRoutes); // Direct mapping mount for robustness
app.use('/api', fundRoutes);
app.use('/api', auditRoutes);

// Base route for connectivity test
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    message: 'BansosChain backend service is active and healthy.'
  });
});

// Centralized error handler middleware
app.use(errorMiddleware);

module.exports = app;
