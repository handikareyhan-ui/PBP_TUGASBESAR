const express = require('express');
const router = express.Router();
const recipientController = require('../controllers/recipientController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Recipient CRUD operations
router.get('/recipients', recipientController.getAllRecipients);
router.get('/recipients/:id', recipientController.getRecipientById);
router.post('/recipients', authMiddleware, adminMiddleware, recipientController.createRecipient);
router.put('/recipients/:id', authMiddleware, adminMiddleware, recipientController.updateRecipient);
router.patch('/recipients/:id/status', authMiddleware, adminMiddleware, recipientController.updateRecipientStatus);
router.delete('/recipients/:id', authMiddleware, adminMiddleware, recipientController.deleteRecipient);

// Citizen user portal claim step operations
router.get('/user/claim-step', authMiddleware, recipientController.getClaimStep);
router.post('/user/claim-step', authMiddleware, recipientController.setClaimStep);
router.post('/user/connect-wallet', authMiddleware, recipientController.connectWallet);
router.put('/user/connect-wallet', authMiddleware, recipientController.connectWallet);
router.get('/users/profile', authMiddleware, recipientController.getUserProfile);

// Public application endpoint
router.post('/applications', recipientController.createRecipient);

module.exports = router;
