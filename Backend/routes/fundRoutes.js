const express = require('express');
const router = express.Router();
const fundController = require('../controllers/fundController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// CRUD endpoints for managing budget programs
router.get('/funds', authMiddleware, adminMiddleware, fundController.getAllFunds);
router.get('/funds/dashboard-stats', authMiddleware, adminMiddleware, fundController.getDashboardStats);
router.get('/funds/:id', authMiddleware, adminMiddleware, fundController.getFundById);
router.post('/funds', authMiddleware, adminMiddleware, fundController.createFund);
router.put('/funds/:id', authMiddleware, adminMiddleware, fundController.updateFund);
router.delete('/funds/:id', authMiddleware, adminMiddleware, fundController.deleteFund);

module.exports = router;
