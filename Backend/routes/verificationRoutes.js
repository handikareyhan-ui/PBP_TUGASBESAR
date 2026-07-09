const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Verification records
router.get('/verifications', verificationController.getAllVerifications);
router.post('/verifications', authMiddleware, adminMiddleware, verificationController.createVerification);

// ZKP Queue operations (for React frontend)
router.get('/zkp/queue', verificationController.getZkpQueue);
router.post('/zkp/verify', authMiddleware, adminMiddleware, verificationController.verifyZkpDirect);
router.post('/zkp/verify/:id', authMiddleware, adminMiddleware, verificationController.verifyZkpApplicant);

module.exports = router;
