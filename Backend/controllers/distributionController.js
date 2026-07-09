const prisma = require('../config/db');
const blockchainService = require('../services/blockchainService');
const budgetService = require('../services/budgetService');

/**
 * Retrieve all distribution history logs
 * GET /api/distributions
 */
exports.getAllDistributions = async (req, res, next) => {
  try {
    const distributions = await prisma.distribution.findMany({
      include: {
        application: true,
        fundSource: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Map to match frontend expectations
    const mapped = distributions.map(d => ({
      id: d.id,
      recipientId: d.applicationId,
      nominal: d.nominal,
      status: d.status,
      createdAt: d.createdAt,
      txHash: d.txHash,
      fundSource: d.fundSource ? {
        id: d.fundSource.id,
        programName: d.fundSource.programName,
        fundSource: d.fundSource.fundSource,
        institution: d.fundSource.institution,
        fiscalYear: d.fundSource.fiscalYear,
        allocatedBudget: d.fundSource.allocatedBudget,
        distributedBudget: d.fundSource.distributedBudget,
        remainingBudget: d.fundSource.remainingBudget
      } : null,
      recipient: d.application ? {
        id: d.application.id,
        nama: d.application.nama,
        nik: d.application.nik,
        alamat: d.application.alamat,
        pendapatan: d.application.pendapatan,
        jumlahTanggungan: d.application.jumlahTanggungan,
        statusKelayakan: d.application.statusKelayakan,
        claimStep: d.application.claimStep
      } : null
    }));

    return res.status(200).json(mapped);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new distribution record for a single application
 * POST /api/distributions
 */
exports.createDistribution = async (req, res, next) => {
  try {
    const { recipientId, applicationId, nominal, status } = req.body;
    const targetId = applicationId || recipientId;

    if (!targetId || !nominal) {
      return res.status(400).json({
        success: false,
        message: 'Application ID dan Nominal wajib diisi.'
      });
    }

    const initialStatus = status || 'DISTRIBUTED';
    const nominalFloat = parseFloat(nominal);

    // Call the centralized Budget Service
    const result = await budgetService.processDistribution(targetId, nominalFloat, req.user.id, initialStatus);

    return res.status(201).json({
      success: true,
      data: {
        id: result.distribution.id,
        recipientId: result.distribution.applicationId,
        nominal: result.distribution.nominal,
        status: result.distribution.status,
        createdAt: result.distribution.createdAt,
        recipient: {
          id: result.distribution.application.id,
          nama: result.distribution.application.nama,
          nik: result.distribution.application.nik,
          alamat: result.distribution.application.alamat,
          statusKelayakan: result.distribution.application.statusKelayakan
        }
      },
      txHash: result.txHash
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Mass Batch Disbursement for all eligible (LAYAK) applications
 * POST /api/disbursement/distribute-all
 */
exports.distributeAll = async (req, res, next) => {
  try {
    // Find all applications with statusKelayakan = 'LAYAK'
    const eligibleApplications = await prisma.application.findMany({
      where: {
        statusKelayakan: 'LAYAK'
      }
    });

    if (eligibleApplications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada pengajuan bantuan dengan status LAYAK saat ini.'
      });
    }

    const nominalValue = 600000; // standard allowance of IDR 600,000

    const txHashes = [];
    
    // Enforce sequential processing to maintain accurate database budget logs
    for (const app of eligibleApplications) {
      const result = await budgetService.processDistribution(app.id, nominalValue, req.user.id, 'DISTRIBUTED');
      txHashes.push(result.txHash);
    }

    const primaryHash = txHashes[0] || '0xunknown';

    return res.status(200).json({
      success: true,
      message: `Dana bansos berhasil didistribusikan ke ${eligibleApplications.length} pengajuan.`,
      hash: primaryHash
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

