const prisma = require('../config/db');
const blockchainService = require('../services/blockchainService');

/**
 * Retrieve all audit log entries
 * GET /api/audits
 */
exports.getAllAudits = async (req, res, next) => {
  try {
    let audits = [];
    let fromLedger = false;

    if (blockchainService.isConnected) {
      try {
        const contractInstance = await blockchainService.getContractInstance();
        const resultBytes = await contractInstance.evaluateTransaction('getAllAuditLogs');
        const ledgerAudits = JSON.parse(Buffer.from(resultBytes).toString());

        audits = ledgerAudits.map((log) => ({
          id: log.id,
          txHash: log.txHash,
          aktivitas: log.aktivitas,
          timestamp: new Date(log.timestamp)
        }));

        // Sort by timestamp descending
        audits.sort((a, b) => b.timestamp - a.timestamp);
        fromLedger = true;
      } catch (err) {
        console.error('[Audit Controller] Failed to read audits from Fabric ledger, falling back to SQLite:', err.message);
      }
    }

    if (!fromLedger) {
      audits = await prisma.auditLog.findMany({
        orderBy: {
          timestamp: 'desc'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: audits,
      fromLedger
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve blockchain transactions formatted for the React frontend
 * GET /api/transactions
 */
exports.getTransactions = async (req, res, next) => {
  try {
    let auditLogs = [];
    let fromLedger = false;

    if (blockchainService.isConnected) {
      try {
        const contractInstance = await blockchainService.getContractInstance();
        const resultBytes = await contractInstance.evaluateTransaction('getAllAuditLogs');
        const ledgerAudits = JSON.parse(Buffer.from(resultBytes).toString());

        auditLogs = ledgerAudits.map((log) => ({
          id: log.id,
          txHash: log.txHash,
          aktivitas: log.aktivitas,
          timestamp: new Date(log.timestamp)
        }));

        auditLogs.sort((a, b) => b.timestamp - a.timestamp);
        fromLedger = true;
      } catch (err) {
        console.error('[Audit Controller] Failed to read transactions from Fabric ledger, falling back to SQLite:', err.message);
      }
    }

    if (!fromLedger) {
      auditLogs = await prisma.auditLog.findMany({
        orderBy: {
          timestamp: 'desc'
        },
        take: 20
      });
    }

    const formattedTransactions = auditLogs.map((log) => {
      let type = 'System Audit';
      let recipientName = 'System Kernel';

      if (log.aktivitas.includes('Disbursed') || log.aktivitas.includes('disbursement') || log.aktivitas.includes('Claim') || log.aktivitas.includes('DISTRIBUTION')) {
        type = 'Disbursement';
        
        // Extract recipient info if present
        const match = log.aktivitas.match(/disalurkan ke (.+?)(?=\snominal)/) || log.aktivitas.match(/recipient (.+?)(?=\s\()/) || log.aktivitas.match(/NIK: (.+)/);
        recipientName = match ? match[1] : 'Welfare recipient';
      } else if (log.aktivitas.includes('STATUS_CHANGE')) {
        type = 'Status Change';
        const match = log.aktivitas.match(/Penerima (.+?)(?=\sdiubah)/);
        recipientName = match ? match[1] : 'Status Modification';
      } else if (log.aktivitas.includes('Verified') || log.aktivitas.includes('ZKP')) {
        type = 'Verification';
        
        const match = log.aktivitas.match(/applicant (.+?)(?=\s\()/) || log.aktivitas.match(/recipient: (.+)/) || log.aktivitas.match(/Penerima (.+?)(?=\sdiubah)/);
        recipientName = match ? match[1] : 'Biometric ID Sync';
      } else if (log.aktivitas.includes('Registered')) {
        type = 'Registration';
        
        const match = log.aktivitas.match(/recipient: (.+?)(?=\s\()/);
        recipientName = match ? match[1] : 'New Registry Record';
      }

      // Calculate simple relative time or display timestamp
      const timeDiff = Date.now() - new Date(log.timestamp).getTime();
      let timeString = 'Just now';
      const diffMins = Math.floor(timeDiff / 60000);
      if (diffMins > 0 && diffMins < 60) {
        timeString = `${diffMins}m ago`;
      } else if (diffMins >= 60 && diffMins < 1440) {
        timeString = `${Math.floor(diffMins / 60)}h ago`;
      } else if (diffMins >= 1440) {
        timeString = `${Math.floor(diffMins / 1440)}d ago`;
      }

      return {
        id: log.id,
        hash: log.txHash.length > 25 ? `${log.txHash.substring(0, 10)}...${log.txHash.substring(log.txHash.length - 8)}` : log.txHash,
        fullHash: log.txHash,
        type,
        recipient: recipientName,
        state: 'CONFIRMED',
        time: timeString,
        rawTimestamp: log.timestamp,
        fromLedger
      };
    });

    return res.status(200).json(formattedTransactions);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve blockchain telemetry status
 * GET /api/telemetry
 */
exports.getTelemetry = async (req, res, next) => {
  try {
    const telemetry = await blockchainService.getTelemetryStatus();
    return res.status(200).json(telemetry);
  } catch (error) {
    next(error);
  }
};
