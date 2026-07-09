const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');

// Audit logs list
router.get('/audits', auditController.getAllAudits);

// Transactions queue logs (for React frontend)
router.get('/transactions', auditController.getTransactions);

// Telemetry cluster logs (for React frontend)
router.get('/telemetry', auditController.getTelemetry);

module.exports = router;
