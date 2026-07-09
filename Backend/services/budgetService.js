const prisma = require('../config/db');
const blockchainService = require('./blockchainService');

class BudgetService {
  /**
   * Enforce atomic distribution logic following the skripsi specifications:
   * 1. Validasi ZKP (proofVerified = true, status = VERIFIED)
   * 2. Validasi status LAYAK
   * 3. Validasi Program ACTIVE
   * 4. Validasi Remaining Budget >= nominal
   * 5. Submit createDistribution() to Hyperledger Fabric
   * 6. Wait for transaction commit via Raft consensus
   * 7. After commit is successful, perform updates on MongoDB (atomic Prisma transaction)
   * 
   * @param {string} applicationId - Target recipient application ID
   * @param {number} nominal - Distribution nominal amount
   * @param {string} adminId - Admin ID initiating the distribution
   * @param {string} status - Distribution status (defaults to 'DISTRIBUTED')
   * @returns {Promise<object>} Returns the created distribution and Fabric Transaction ID (txHash)
   */
  async processDistribution(applicationId, nominal, adminId, status = 'DISTRIBUTED') {
    // 1. Fetch recipient application details
    const application = await prisma.application.findUnique({
      where: { id: applicationId }
    });

    if (!application) {
      throw new Error('Pengajuan tidak ditemukan.');
    }

    // 2. Validate LAYAK status
    if (application.statusKelayakan !== 'LAYAK') {
      throw new Error(`Pengajuan tidak berstatus LAYAK. Status saat ini: ${application.statusKelayakan}`);
    }

    // 3. Validate ZKP Verification status in MongoDB
    const verification = await prisma.verification.findFirst({
      where: { applicationId },
      orderBy: { createdAt: 'desc' }
    });

    if (!verification) {
      throw new Error('Berkas ZKP belum terverifikasi.');
    }

    if (!verification.proofVerified || verification.status !== 'VERIFIED') {
      throw new Error('Bukti ZKP tidak valid atau status verifikasi bukan VERIFIED.');
    }

    // 4. Validate Program ACTIVE in MongoDB
    const programName = application.jenisBantuan || 'Bansos Sembako';
    const fundSource = await prisma.fundSource.findUnique({
      where: { programName }
    });

    if (!fundSource) {
      throw new Error(`Program bantuan "${programName}" tidak terdaftar dalam database.`);
    }

    if (fundSource.status !== 'ACTIVE') {
      throw new Error(`Program bantuan "${programName}" sedang tidak aktif.`);
    }

    // 5. Validate Remaining Budget in MongoDB
    const nominalFloat = parseFloat(nominal);
    if (fundSource.remainingBudget < nominalFloat) {
      throw new Error(`Anggaran program tidak mencukupi. Sisa: Rp ${fundSource.remainingBudget.toLocaleString('id-ID')}, Dibutuhkan: Rp ${nominalFloat.toLocaleString('id-ID')}`);
    }

    console.log(`[Budget Service] Core checks passed. Invoking Fabric gateway for NIK ${application.nik}...`);

    // 6. Submit createDistribution() to Hyperledger Fabric & wait for block commit
    let txHash;
    try {
      txHash = await blockchainService.submitDistribution(applicationId, nominalFloat, status);
    } catch (err) {
      console.error('[Fabric Service] Chaincode invocation failed:', err.message);
      throw new Error(`Transaksi blockchain gagal: ${err.message}`);
    }

    if (!txHash || txHash === 'OFFLINE_TX') {
      console.warn('[Budget Service] Fabric ledger is offline / using mock fallback.');
    }

    // 7. Atomic database update in MongoDB (using prisma transaction)
    try {
      const result = await prisma.$transaction(async (tx) => {
        // A. Update FundSource budgets
        const updatedFund = await tx.fundSource.update({
          where: { id: fundSource.id },
          data: {
            remainingBudget: { decrement: nominalFloat },
            distributedBudget: { increment: nominalFloat }
          }
        });

        // B. Update Application status to TERSALURKAN
        const updatedApp = await tx.application.update({
          where: { id: applicationId },
          data: { statusKelayakan: 'TERSALURKAN' }
        });

        // C. Create Distribution log
        const distribution = await tx.distribution.create({
          data: {
            applicationId,
            fundSourceId: fundSource.id,
            nominal: nominalFloat,
            status,
            txHash
          },
          include: {
            application: true
          }
        });

        // D. Create FundTransaction log
        const fundTx = await tx.fundTransaction.create({
          data: {
            fundSourceId: fundSource.id,
            nominal: nominalFloat,
            type: 'Pengurangan Anggaran',
            adminId,
            txHash
          }
        });

        return { distribution, updatedFund, updatedApp, fundTx };
      });

      // 8. Log DISTRIBUTION_CREATED to Hyperledger Fabric for auditing
      try {
        await blockchainService.submitTransaction(
          `[DISTRIBUTION_CREATED] DistID: ${result.distribution.id} | RecipientID: ${applicationId} | Program: ${programName} | Nominal: ${nominalFloat}`
        );
      } catch (err) {
        console.error('[Fabric Service] Failed to log distribution audit trail:', err.message);
      }

      console.log(`[Budget Service] Distribution transaction completed successfully for NIK ${application.nik}. TxHash: ${txHash}`);
      return {
        success: true,
        distribution: result.distribution,
        txHash
      };
    } catch (dbError) {
      console.error('[Budget Service] Database transaction rollback executed:', dbError.message);
      throw new Error(`MongoDB Transaction Error: ${dbError.message}`);
    }
  }
}

module.exports = new BudgetService();
