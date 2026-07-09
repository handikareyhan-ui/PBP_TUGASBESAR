const crypto = require('crypto');
const prisma = require('../config/db');
const blockchainService = require('../services/blockchainService');
const budgetService = require('../services/budgetService');

/**
 * Helper mapper to convert DB Application fields into frontend-friendly model fields.
 */
const mapRecipientToFrontend = (r) => ({
  id: r.id,
  name: r.nama,
  nik: r.nik,
  region: r.alamat,
  status: r.statusKelayakan,
  pendapatan: r.pendapatan,
  jumlahTanggungan: r.jumlahTanggungan,
  walletId: r.walletId,
  claimStep: r.claimStep,
  jenisBantuan: r.jenisBantuan,
  dokumen: r.dokumen
});

/**
 * Retrieve all welfare applications
 * GET /api/recipients
 */
exports.getAllRecipients = async (req, res, next) => {
  try {
    const applications = await prisma.application.findMany({
      include: {
        distributions: {
          include: {
            fundSource: true
          }
        }
      },
      orderBy: { nama: 'asc' }
    });

    const mapped = applications.map(r => ({
      ...mapRecipientToFrontend(r),
      distributions: r.distributions ? r.distributions.map(d => ({
        id: d.id,
        nominal: d.nominal,
        status: d.status,
        txHash: d.txHash,
        createdAt: d.createdAt,
        fundSource: d.fundSource ? {
          id: d.fundSource.id,
          programName: d.fundSource.programName,
          fundSource: d.fundSource.fundSource,
          institution: d.fundSource.institution,
          fiscalYear: d.fundSource.fiscalYear,
          allocatedBudget: d.fundSource.allocatedBudget,
          distributedBudget: d.fundSource.distributedBudget,
          remainingBudget: d.fundSource.remainingBudget
        } : null
      })) : []
    }));
    return res.status(200).json(mapped);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve single application by ID
 * GET /api/recipients/:id
 */
exports.getRecipientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        distributions: {
          include: {
            fundSource: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Data pengajuan tidak ditemukan.'
      });
    }

    const mapped = {
      ...mapRecipientToFrontend(application),
      distributions: application.distributions ? application.distributions.map(d => ({
        id: d.id,
        nominal: d.nominal,
        status: d.status,
        txHash: d.txHash,
        createdAt: d.createdAt,
        fundSource: d.fundSource ? {
          id: d.fundSource.id,
          programName: d.fundSource.programName,
          fundSource: d.fundSource.fundSource,
          institution: d.fundSource.institution,
          fiscalYear: d.fundSource.fiscalYear,
          allocatedBudget: d.fundSource.allocatedBudget,
          distributedBudget: d.fundSource.distributedBudget,
          remainingBudget: d.fundSource.remainingBudget
        } : null
      })) : []
    };

    return res.status(200).json(mapped);
  } catch (error) {
    next(error);
  }
};

/**
 * Register/Create a new welfare application (from User Portal)
 * POST /api/recipients & POST /api/applications
 */
exports.createRecipient = async (req, res, next) => {
  try {
    const { name, nik, region, pendapatan, jumlahTanggungan, jenisBantuan, walletId, dokumen } = req.body;

    if (!name || !nik || !region) {
      return res.status(400).json({
        success: false,
        message: 'Nama Lengkap, NIK, dan Wilayah/Alamat wajib diisi.'
      });
    }

    // Verify NIK uniqueness
    const existing = await prisma.application.findUnique({
      where: { nik }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Nomor NIK ini sudah terdaftar di sistem.'
      });
    }

    const incomeVal = pendapatan !== undefined ? parseFloat(pendapatan) : 1500000;
    const dependentsVal = jumlahTanggungan !== undefined ? parseInt(jumlahTanggungan) : 0;
    const finalWallet = walletId || null;
    const finalJenisBantuan = jenisBantuan || 'Bansos Sembako';
    const finalDokumen = dokumen || 'dokumen_pendukung.pdf';

    // 1. Create Application in SQLite
    const newApplication = await prisma.application.create({
      data: {
        nik,
        nama: name,
        alamat: region,
        pendapatan: incomeVal,
        jumlahTanggungan: dependentsVal,
        walletId: finalWallet,
        jenisBantuan: finalJenisBantuan,
        dokumen: finalDokumen,
        statusKelayakan: 'PENDING'
      }
    });

    console.log(`[ZKP Auto] Initiating automatic ZKP verification for NIK: ${nik}`);

    // 2. Automate ZKP Generation & Verification
    let isEligible = false;
    let isProofValid = false;
    let proofHash = '0x' + crypto.randomBytes(16).toString('hex');

    try {
      const zkpService = require('../services/zkpService');
      const zkpResult = await zkpService.generateProof(incomeVal, dependentsVal);
      isProofValid = await zkpService.verifyProof(zkpResult.proof, zkpResult.publicSignals);
      isEligible = isProofValid && (zkpResult.publicSignals[0] === '1' || zkpResult.publicSignals[0] === 1);
      proofHash = zkpResult.proofHash;

      const statusKelayakan = isEligible ? 'LAYAK' : 'TIDAK_LAYAK';
      const statusVerification = isEligible ? 'VERIFIED' : 'REJECTED';

      // 3. Save ZKP outcome to Verification table
      await prisma.verification.create({
        data: {
          applicationId: newApplication.id,
          proofHash,
          proofVerified: isProofValid,
          verifiedAt: new Date(),
          status: statusVerification
        }
      });

      // 4. Update Application status
      const updatedApplication = await prisma.application.update({
        where: { id: newApplication.id },
        data: { statusKelayakan }
      });

      // 5. Submit log to ledger/blockchain
      const activityLog = `ZKP_AUTO_VERIFY: Pengajuan ${name} (${nik}) diproses otomatis. Hasil: ${statusKelayakan}. proofVerified: ${isProofValid}`;
      await blockchainService.submitTransaction(activityLog);

      return res.status(201).json(mapRecipientToFrontend(updatedApplication));
    } catch (zkpErr) {
      console.error('[ZKP Auto] Circom generator or verification error:', zkpErr.stack || zkpErr.message);

      // Save ZKP_FAILED status to Verification table along with the error log
      await prisma.verification.create({
        data: {
          applicationId: newApplication.id,
          proofHash: `ERROR: ${zkpErr.message || 'ZKP Execution Failed'}`,
          proofVerified: false,
          verifiedAt: new Date(),
          status: 'ZKP_FAILED'
        }
      });

      // Keep application status as PENDING (no updates made to statusKelayakan)
      const activityLog = `ZKP_AUTO_VERIFY_FAILED: Pengajuan ${name} (${nik}) gagal diverifikasi sirkuit. Status ditangguhkan (PENDING).`;
      await blockchainService.submitTransaction(activityLog);

      return res.status(201).json(mapRecipientToFrontend(newApplication));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update application details
 * PUT /api/recipients/:id
 */
exports.updateRecipient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, nik, region, status, pendapatan, jumlahTanggungan, walletId, jenisBantuan, dokumen } = req.body;

    const existing = await prisma.application.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Data pengajuan tidak ditemukan.'
      });
    }

    if (nik && nik !== existing.nik) {
      const duplicateNik = await prisma.application.findUnique({
        where: { nik }
      });
      if (duplicateNik) {
        return res.status(400).json({
          success: false,
          message: 'Nomor NIK ini sudah digunakan pada pengajuan lain.'
        });
      }
    }

    const dependentsVal = jumlahTanggungan !== undefined ? parseInt(jumlahTanggungan) : existing.jumlahTanggungan;

    const updated = await prisma.application.update({
      where: { id },
      data: {
        nama: name !== undefined ? name : existing.nama,
        nik: nik !== undefined ? nik : existing.nik,
        alamat: region !== undefined ? region : existing.alamat,
        statusKelayakan: status !== undefined ? status : existing.statusKelayakan,
        pendapatan: pendapatan !== undefined ? parseFloat(pendapatan) : existing.pendapatan,
        jumlahTanggungan: dependentsVal,
        walletId: walletId !== undefined ? walletId : existing.walletId,
        jenisBantuan: jenisBantuan !== undefined ? jenisBantuan : existing.jenisBantuan,
        dokumen: dokumen !== undefined ? dokumen : existing.dokumen
      }
    });

    await blockchainService.submitTransaction(`Updated application profile: ${updated.nama} (ID: ${updated.id.substring(0, 8)})`);

    return res.status(200).json(mapRecipientToFrontend(updated));
  } catch (error) {
    next(error);
  }
};

/**
 * Update application status and record STATUS_CHANGE audit trail
 * PATCH /api/recipients/:id/status
 */
exports.updateRecipientStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'LAYAK', 'TIDAK_LAYAK', 'TIDAK LAYAK', 'TERSALURKAN', 'DITOLAK', 'DIBLOKIR', 'NONAKTIF'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status tidak valid. Harus salah satu dari: ${validStatuses.join(', ')}`
      });
    }

    const application = await prisma.application.findUnique({
      where: { id }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Pengajuan tidak ditemukan.'
      });
    }

    const oldStatus = application.statusKelayakan;

    const updated = await prisma.application.update({
      where: { id },
      data: { statusKelayakan: status }
    });

    // Record immutable audit log
    await blockchainService.submitTransaction(
      `STATUS_CHANGE: Pengajuan ${application.nama} diubah dari ${oldStatus} menjadi ${status}`
    );

    return res.status(200).json({
      success: true,
      data: mapRecipientToFrontend(updated)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete application record (Disabled for blockchain immutability)
 * DELETE /api/recipients/:id
 */
exports.deleteRecipient = async (req, res, next) => {
  return res.status(405).json({
    success: false,
    message: 'Fitur penghapusan data pengajuan dinonaktifkan secara permanen untuk menjaga integritas ledger blockchain.'
  });
};

/**
 * Get claim step progress of standard recipient portal session
 * GET /api/user/claim-step
 */
exports.getClaimStep = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Hanya penerima bantuan terautentikasi yang dapat mengakses claim step.'
      });
    }

    const application = await prisma.application.findUnique({
      where: { id: req.user.id }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Data pengajuan tidak ditemukan.'
      });
    }

    return res.status(200).json({
      success: true,
      step: application.claimStep
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set claim step progress of standard recipient portal session
 * POST /api/user/claim-step
 */
exports.setClaimStep = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Hanya penerima bantuan terautentikasi yang dapat mengupdate claim step.'
      });
    }

    const { step } = req.body;
    if (step === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Langkah (step) wajib dicantumkan.'
      });
    }

    const stepInt = parseInt(step);

    const application = await prisma.application.findUnique({
      where: { id: req.user.id }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Pengajuan tidak ditemukan.'
      });
    }

    const updated = await prisma.application.update({
      where: { id: req.user.id },
      data: { claimStep: stepInt }
    });

    if (stepInt === 3) {
      try {
        const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        const adminId = adminUser ? adminUser.id : application.id;

        // Execute ZKP and budget checks atomically
        const result = await budgetService.processDistribution(application.id, 600000, adminId, 'DISTRIBUTED');

        // Log CLAIM_COMPLETED
        await blockchainService.submitTransaction(
          `[CLAIM_COMPLETED] NIK: ${application.nik} | DistID: ${result.distribution.id} | Wallet: ${application.walletId}`
        );
        console.log(`[Claim Portal] Automated distribution logged for NIK: ${application.nik}`);
      } catch (err) {
        console.error('[Claim Portal] Automated distribution failed:', err.message);
        // Log CLAIM_FAILED
        try {
          await blockchainService.submitTransaction(
            `[CLAIM_FAILED] NIK: ${application.nik} | Reason: ${err.message}`
          );
        } catch (fErr) {
          console.error('[Fabric Service] Failed to log claim failure:', fErr.message);
        }
        return res.status(400).json({
          success: false,
          message: `Klaim gagal: ${err.message}`
        });
      }
    } else {
      await blockchainService.submitTransaction(`Recipient NIK: ${application.nik} moved to claim step ${stepInt}`);
    }

    return res.status(200).json({
      success: true,
      step: updated.claimStep
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Connect MetaMask Wallet to citizen profile
 * POST /api/user/connect-wallet
 */
exports.connectWallet = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Hanya penerima bantuan terautentikasi yang dapat menautkan wallet.'
      });
    }

    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address wajib disertakan.'
      });
    }

    const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
    if (!isValidAddress) {
      return res.status(400).json({
        success: false,
        message: 'Format wallet address Ethereum/MetaMask tidak valid.'
      });
    }

    const duplicate = await prisma.application.findFirst({
      where: {
        walletId: walletAddress,
        NOT: { id: req.user.id }
      }
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address ini sudah ditautkan ke pengajuan lain.'
      });
    }

    const application = await prisma.application.findUnique({
      where: { id: req.user.id }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Pengajuan tidak ditemukan.'
      });
    }

    const oldWallet = application.walletId;

    const updated = await prisma.application.update({
      where: { id: req.user.id },
      data: { walletId: walletAddress }
    });

    await blockchainService.submitTransaction(
      `STATUS_CHANGE: Penerima ${application.nama} menautkan wallet address ${walletAddress} (Old: ${oldWallet})`
    );

    return res.status(200).json({
      success: true,
      message: 'MetaMask wallet berhasil ditautkan.',
      walletId: updated.walletId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile based on decoded JWT identity
 * GET /api/users/profile
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Endpoint ini hanya untuk warga penerima bantuan.'
      });
    }

    const application = await prisma.application.findUnique({
      where: { id: req.user.id },
      include: {
        distributions: {
          include: {
            fundSource: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Profil warga tidak ditemukan.'
      });
    }

    const mapped = {
      ...mapRecipientToFrontend(application),
      distributions: application.distributions ? application.distributions.map(d => ({
        id: d.id,
        nominal: d.nominal,
        status: d.status,
        txHash: d.txHash,
        createdAt: d.createdAt,
        fundSource: d.fundSource ? {
          id: d.fundSource.id,
          programName: d.fundSource.programName,
          fundSource: d.fundSource.fundSource,
          institution: d.fundSource.institution,
          fiscalYear: d.fundSource.fiscalYear,
          allocatedBudget: d.fundSource.allocatedBudget,
          distributedBudget: d.fundSource.distributedBudget,
          remainingBudget: d.fundSource.remainingBudget
        } : null
      })) : []
    };

    return res.status(200).json(mapped);
  } catch (error) {
    next(error);
  }
};
