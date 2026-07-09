const prisma = require('../config/db');
const blockchainService = require('../services/blockchainService');

/**
 * Retrieve all fund programs
 * GET /api/funds
 */
exports.getAllFunds = async (req, res, next) => {
  try {
    const funds = await prisma.fundSource.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(funds);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve single fund program by ID
 * GET /api/funds/:id
 */
exports.getFundById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fund = await prisma.fundSource.findUnique({
      where: { id }
    });

    if (!fund) {
      return res.status(404).json({
        success: false,
        message: 'Program bantuan tidak ditemukan.'
      });
    }

    return res.status(200).json(fund);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new program / fund source
 * POST /api/funds
 */
exports.createFund = async (req, res, next) => {
  try {
    const { programName, fundSource, institution, fiscalYear, allocatedBudget } = req.body;

    if (!programName || !fundSource || !institution || allocatedBudget === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Parameter programName, fundSource, institution, dan allocatedBudget wajib diisi.'
      });
    }

    const budgetFloat = parseFloat(allocatedBudget);
    if (isNaN(budgetFloat) || budgetFloat < 0) {
      return res.status(400).json({
        success: false,
        message: 'Nominal allocatedBudget tidak valid.'
      });
    }

    const yearInt = fiscalYear ? parseInt(fiscalYear) : 2026;

    // Check unique programName
    const existing = await prisma.fundSource.findUnique({
      where: { programName }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Program bantuan dengan nama ini sudah terdaftar.'
      });
    }

    // Write to MongoDB
    const newFund = await prisma.fundSource.create({
      data: {
        programName,
        fundSource,
        institution,
        fiscalYear: yearInt,
        allocatedBudget: budgetFloat,
        remainingBudget: budgetFloat,
        distributedBudget: 0,
        status: 'ACTIVE'
      }
    });

    // Submit audit logs to Hyperledger Fabric
    let txHash = 'OFFLINE_TX';
    try {
      txHash = await blockchainService.submitTransaction(
        `[PROGRAM_CREATED] ID: ${newFund.id} | Name: ${programName} | Allocated: ${budgetFloat} | Source: ${fundSource}`
      );
      await blockchainService.submitTransaction(
        `[BUDGET_INCREASED] ID: ${newFund.id} | Program: ${programName} | Added: ${budgetFloat} | Total: ${budgetFloat}`
      );
    } catch (err) {
      console.error('[Fabric Service] Failed to log program creation on-chain:', err.message);
    }

    // Save budget change transaction in MongoDB
    await prisma.fundTransaction.create({
      data: {
        fundSourceId: newFund.id,
        nominal: budgetFloat,
        type: 'Penambahan Anggaran',
        adminId: req.user.id,
        txHash
      }
    });

    return res.status(201).json({
      success: true,
      data: newFund,
      txHash
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing program
 * PUT /api/funds/:id
 */
exports.updateFund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { programName, fundSource, institution, fiscalYear, allocatedBudget, status } = req.body;

    const existing = await prisma.fundSource.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Program bantuan tidak ditemukan.'
      });
    }

    const budgetFloat = allocatedBudget !== undefined ? parseFloat(allocatedBudget) : existing.allocatedBudget;
    const statusVal = status !== undefined ? status : existing.status;
    const yearInt = fiscalYear ? parseInt(fiscalYear) : existing.fiscalYear;

    let newRemaining = existing.remainingBudget;
    let budgetTxType = null;
    let budgetDiff = 0;

    // Check budget changes
    if (allocatedBudget !== undefined && budgetFloat !== existing.allocatedBudget) {
      budgetDiff = budgetFloat - existing.allocatedBudget;
      newRemaining = existing.remainingBudget + budgetDiff;

      if (newRemaining < 0) {
        return res.status(400).json({
          success: false,
          message: 'Pengurangan anggaran tidak boleh melebihi sisa anggaran saat ini.'
        });
      }

      budgetTxType = budgetDiff > 0 ? 'Penambahan Anggaran' : 'Pengurangan Anggaran';
    }

    // Perform database updates
    const updatedFund = await prisma.fundSource.update({
      where: { id },
      data: {
        programName: programName !== undefined ? programName : existing.programName,
        fundSource: fundSource !== undefined ? fundSource : existing.fundSource,
        institution: institution !== undefined ? institution : existing.institution,
        fiscalYear: yearInt,
        allocatedBudget: budgetFloat,
        remainingBudget: newRemaining,
        status: statusVal
      }
    });

    let txHash = 'OFFLINE_TX';
    try {
      // 1. Log generic PROGRAM_UPDATED
      txHash = await blockchainService.submitTransaction(
        `[PROGRAM_UPDATED] ID: ${id} | Name: ${updatedFund.programName} | Allocated: ${budgetFloat} | Status: ${statusVal}`
      );

      // 2. Log status transitions
      if (status !== undefined && status !== existing.status) {
        if (status === 'ACTIVE') {
          await blockchainService.submitTransaction(`[PROGRAM_ACTIVATED] ID: ${id} | Name: ${updatedFund.programName}`);
        } else if (status === 'INACTIVE') {
          await blockchainService.submitTransaction(`[PROGRAM_DEACTIVATED] ID: ${id} | Name: ${updatedFund.programName}`);
        }
      }

      // 3. Log budget change events
      if (budgetTxType) {
        const absDiff = Math.abs(budgetDiff);
        if (budgetDiff > 0) {
          await blockchainService.submitTransaction(
            `[BUDGET_INCREASED] ID: ${id} | Program: ${updatedFund.programName} | Added: ${absDiff} | Total: ${budgetFloat}`
          );
        } else {
          await blockchainService.submitTransaction(
            `[BUDGET_DECREASED] ID: ${id} | Program: ${updatedFund.programName} | Subtracted: ${absDiff} | Total: ${budgetFloat}`
          );
        }
      }
    } catch (err) {
      console.error('[Fabric Service] Failed to log program updates on-chain:', err.message);
    }

    // Write budget change transaction to MongoDB if budget changed
    if (budgetTxType) {
      await prisma.fundTransaction.create({
        data: {
          fundSourceId: id,
          nominal: Math.abs(budgetDiff),
          type: budgetTxType,
          adminId: req.user.id,
          txHash
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedFund,
      txHash
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a program
 * DELETE /api/funds/:id
 */
exports.deleteFund = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.fundSource.findUnique({
      where: { id },
      include: {
        distributions: true
      }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Program bantuan tidak ditemukan.'
      });
    }

    // Check if distributions exist
    if (existing.distributions && existing.distributions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Program tidak dapat dihapus karena sudah memiliki transaksi distribusi yang tercatat.'
      });
    }

    // Delete from MongoDB
    await prisma.fundSource.delete({
      where: { id }
    });

    // Log deletion on Fabric
    let txHash = 'OFFLINE_TX';
    try {
      txHash = await blockchainService.submitTransaction(
        `[PROGRAM_DELETED] ID: ${id} | Name: ${existing.programName}`
      );
    } catch (err) {
      console.error('[Fabric Service] Failed to log program deletion on-chain:', err.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Program bantuan berhasil dihapus.',
      txHash
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve dynamic dashboard statistics
 * GET /api/funds/dashboard-stats
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const budgetTotals = await prisma.fundSource.aggregate({
      _sum: {
        allocatedBudget: true,
        distributedBudget: true,
        remainingBudget: true
      }
    });

    const totalAnggaran = budgetTotals._sum.allocatedBudget || 0;
    const danaTersalurkan = budgetTotals._sum.distributedBudget || 0;
    const sisaAnggaran = budgetTotals._sum.remainingBudget || 0;

    const totalProgram = await prisma.fundSource.count();
    const programAktif = await prisma.fundSource.count({
      where: { status: 'ACTIVE' }
    });

    const penerimaLayak = await prisma.application.count({
      where: { statusKelayakan: 'LAYAK' }
    });

    const totalDistribusi = await prisma.distribution.count();

    return res.status(200).json({
      success: true,
      totalAnggaran,
      danaTersalurkan,
      sisaAnggaran,
      programAktif,
      totalProgram,
      penerimaLayak,
      totalDistribusi
    });
  } catch (error) {
    next(error);
  }
};

