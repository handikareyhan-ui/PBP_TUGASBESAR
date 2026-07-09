const express = require('express');
const router = express.Router();
const distributionController = require('../controllers/distributionController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Distribution endpoints
router.get('/distributions', distributionController.getAllDistributions);
router.post('/distributions', authMiddleware, adminMiddleware, distributionController.createDistribution);

// Mass disbursement (React frontend compatibility)
router.post('/disbursement/distribute-all', authMiddleware, adminMiddleware, distributionController.distributeAll);

module.exports = router;
