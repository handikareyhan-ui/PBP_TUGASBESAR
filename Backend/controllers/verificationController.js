const prisma = require('../config/db');
const zkpService = require('../services/zkpService');
const blockchainService = require('../services/blockchainService');

/**
 * Retrieve all verification logs
 * GET /api/verifications
 */
exports.getAllVerifications = async (req, res, next) => {
  try {
    const verifications = await prisma.verification.findMany({
      include: {
        application: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Adapt to frontend schema expectations by mapping application to recipient
    const mapped = verifications.map(v => ({
      id: v.id,
      recipientId: v.applicationId,
      proofHash: v.proofHash,
      proofVerified: v.proofVerified,
      verifiedAt: v.verifiedAt,
      status: v.status,
      createdAt: v.createdAt,
      recipient: v.application ? {
        id: v.application.id,
        nama: v.application.nama,
        nik: v.application.nik,
        alamat: v.application.alamat,
        pendapatan: v.application.pendapatan,
        jumlahTanggungan: v.application.jumlahTanggungan,
        statusKelayakan: v.application.statusKelayakan,
        claimStep: v.application.claimStep
      } : null
    }));

    return res.status(200).json(mapped);
  } catch (error) {
    next(error);
  }
};

/**
 * Request verification / submit new proof
 * POST /api/verifications
 */
exports.createVerification = async (req, res, next) => {
  try {
    const { recipientId, applicationId, proofHash, status } = req.body;
    const targetId = applicationId || recipientId;

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: 'Application ID wajib disertakan.'
      });
    }

    const application = await prisma.application.findUnique({
      where: { id: targetId }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Pengajuan tidak ditemukan.'
      });
    }

    const finalProof = proofHash || '0x' + require('crypto').randomBytes(16).toString('hex');
    const initialStatus = status || 'PENDING';

    const verification = await prisma.verification.create({
      data: {
        applicationId: targetId,
        proofHash: finalProof,
        proofVerified: initialStatus === 'VERIFIED',
        status: initialStatus
      },
      include: {
        application: true
      }
    });

    await blockchainService.submitTransaction(`Submitted ZKP verification request for applicant: ${application.nama}`);

    return res.status(201).json(verification);
  } catch (error) {
    next(error);
  }
};

/**
 * Get ZKP validation queue (for React frontend compatibility)
 * GET /api/zkp/queue
 */
exports.getZkpQueue = async (req, res, next) => {
  try {
    // Get all verifications that are still PENDING
    const queueItems = await prisma.verification.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        application: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Format for React frontend ZKP queue
    const mappedQueue = queueItems.map(item => {
      if (!item.application) return null;
      const nameParts = item.application.nama.split(' ');
      const initial = nameParts.map(p => p[0]).join('').slice(0, 2).toUpperCase();
      
      // Masking name like "Ahmad Subagja" -> "A. S."
      let maskedName = item.application.nama;
      if (nameParts.length >= 2) {
        maskedName = `${nameParts[0][0]}. ${nameParts[1][0]}.`;
      } else if (nameParts.length === 1) {
        maskedName = `${nameParts[0][0]}.`;
      }

      // Masking NIK
      const maskedNik = item.application.nik ? `${item.application.nik.substring(0, 6)}...${item.application.nik.substring(12)}` : 'No NIK';

      return {
        id: item.id,
        initial,
        name: maskedName,
        fullName: item.application.nama,
        nik: maskedNik,
        status: item.status
      };
    }).filter(Boolean);

    return res.status(200).json(mappedQueue);
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to run actual ZKP generation & verification, save to DB, and log audit trail
 * 
 * @param {string} applicationId - The database application ID
 * @param {string} [verificationId] - Optional verification queue record ID to update
 * @returns {Promise<object>} The verification response object
 */
async function executeZkpVerification(applicationId, verificationId = null) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId }
  });

  if (!application) {
    throw new Error('Pengajuan tidak ditemukan.');
  }

  console.log(`[Verification Controller] Starting real ZKP flow for ${application.nama}...`);

  try {
    // 1. Generate proof on backend from application socio-demographic data
    const zkpResult = await zkpService.generateProof(
      application.pendapatan,
      application.jumlahTanggungan
    );

    // 2. Verify proof via snarkjs
    const isProofValid = await zkpService.verifyProof(zkpResult.proof, zkpResult.publicSignals);

    // 3. Evaluate eligibility criteria: income < 2000000 AND dependents >= 3 (output signal is 1)
    const isEligible = isProofValid && (zkpResult.publicSignals[0] === '1' || zkpResult.publicSignals[0] === 1);

    const status = isEligible ? 'VERIFIED' : 'REJECTED';
    const statusKelayakan = isEligible ? 'LAYAK' : 'TIDAK_LAYAK';
    const verifiedAt = new Date();

    // 4. Update or create Verification record in database
    let verificationRecord;
    if (verificationId) {
      verificationRecord = await prisma.verification.update({
        where: { id: verificationId },
        data: {
          proofHash: zkpResult.proofHash,
          proofVerified: isProofValid,
          verifiedAt,
          status
        }
      });
    } else {
      verificationRecord = await prisma.verification.create({
        data: {
          applicationId: application.id,
          proofHash: zkpResult.proofHash,
          proofVerified: isProofValid,
          verifiedAt,
          status
        }
      });
    }

    // 5. Update application eligibility status
    await prisma.application.update({
      where: { id: application.id },
      data: { statusKelayakan }
    });

    // 5.5. Submit verification outcome immediately to Fabric ledger
    try {
      await blockchainService.submitVerification(
        application.id,
        zkpResult.proofHash,
        isProofValid,
        statusKelayakan
      );
    } catch (err) {
      console.error('[Fabric Service] Failed to write verification outcome to Fabric ledger:', err.message);
    }

    // 6. Automatically log immutable audit trail
    const activityLog = `ZKP_VERIFY: Pengajuan ${application.nama} (${application.nik}) diproses. Pendapatan: Rp ${application.pendapatan}, Tanggungan: ${application.jumlahTanggungan}. Hasil: ${statusKelayakan}. proofVerified: ${isProofValid}`;
    await blockchainService.submitTransaction(activityLog);

    return {
      success: isEligible,
      status: statusKelayakan,
      proofVerified: isProofValid
    };
  } catch (zkpErr) {
    console.error('[Verification Controller] ZKP generation or verification failed:', zkpErr.stack || zkpErr.message);

    // Save ZKP_FAILED status to Verification table
    const verifiedAt = new Date();
    if (verificationId) {
      await prisma.verification.update({
        where: { id: verificationId },
        data: {
          proofHash: `ERROR: ${zkpErr.message || 'ZKP Execution Failed'}`,
          proofVerified: false,
          verifiedAt,
          status: 'ZKP_FAILED'
        }
      });
    } else {
      await prisma.verification.create({
        data: {
          applicationId: application.id,
          proofHash: `ERROR: ${zkpErr.message || 'ZKP Execution Failed'}`,
          proofVerified: false,
          verifiedAt,
          status: 'ZKP_FAILED'
        }
      });
    }

    // Keep application status as PENDING (no automatic rules fallback)
    await prisma.application.update({
      where: { id: application.id },
      data: { statusKelayakan: 'PENDING' }
    });

    // Submit failure log to ledger/blockchain
    const activityLog = `ZKP_VERIFY_FAILED: Verifikasi manual ${application.nama} (${application.nik}) gagal sirkuit. Status dikembalikan ke PENDING.`;
    await blockchainService.submitTransaction(activityLog);

    throw new Error(`Validasi ZKP Gagal: ${zkpErr.message || 'Error Generating Proof'}`);
  }
}

/**
 * Verify applicant in ZKP validation queue (for React frontend compatibility)
 * POST /api/zkp/verify/:id
 */
exports.verifyZkpApplicant = async (req, res, next) => {
  try {
    const { id } = req.params;

    const verification = await prisma.verification.findUnique({
      where: { id },
      include: { application: true }
    });

    if (verification) {
      const result = await executeZkpVerification(verification.applicationId, verification.id);
      return res.status(200).json(result);
    }

    const application = await prisma.application.findUnique({
      where: { id }
    });

    if (application) {
      const result = await executeZkpVerification(application.id);
      return res.status(200).json(result);
    }

    return res.status(404).json({
      success: false,
      status: 'TIDAK_LAYAK',
      proofVerified: false,
      message: 'ID tidak cocok dengan antrean verifikasi atau data pengajuan mana pun.'
    });
  } catch (error) {
    console.error('Error during ZKP verification queue processing:', error);
    return res.status(400).json({
      success: false,
      status: 'TIDAK_LAYAK',
      proofVerified: false,
      message: error.message || 'Gagal memproses validasi ZKP.'
    });
  }
};

/**
 * Direct Endpoint for POST /api/zkp/verify (Accepts recipientId or id in request body)
 * POST /api/zkp/verify
 */
exports.verifyZkpDirect = async (req, res, next) => {
  try {
    const { recipientId, applicationId, id } = req.body;
    const targetId = applicationId || recipientId || id;

    if (!targetId) {
      return res.status(400).json({
        success: false,
        status: 'TIDAK_LAYAK',
        proofVerified: false,
        message: 'applicationId atau id wajib dicantumkan dalam request body.'
      });
    }

    const pendingVerification = await prisma.verification.findFirst({
      where: {
        applicationId: targetId,
        status: 'PENDING'
      }
    });

    const result = await executeZkpVerification(targetId, pendingVerification ? pendingVerification.id : null);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error during direct ZKP verification:', error);
    return res.status(400).json({
      success: false,
      status: 'TIDAK_LAYAK',
      proofVerified: false,
      message: error.message || 'Gagal memproses validasi ZKP.'
    });
  }
};
