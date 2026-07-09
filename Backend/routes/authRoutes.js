const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Admin Login endpoints
router.post('/auth/login', authController.loginAdmin);
router.post('/auth/admin/login', authController.loginAdmin);

// User/Recipient Login endpoints
router.post('/auth/login-user', authController.loginUser);
router.post('/auth/user/login', authController.loginUser);

module.exports = router;
