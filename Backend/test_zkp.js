const { PrismaClient } = require('@prisma/client');
const zkpService = require('./services/zkpService');
const prisma = new PrismaClient();

async function runTests() {
  console.log('=== STARTING BACKEND ZKP ELIGIBILITY TESTS ===');

  const recipients = await prisma.application.findMany({
    orderBy: { nama: 'asc' }
  });

  console.log(`Found ${recipients.length} recipients to test:\n`);

  for (const r of recipients) {
    console.log(`--------------------------------------------------`);
    console.log(`Testing Recipient: ${r.nama}`);
    console.log(`NIK: ${r.nik}`);
    console.log(`Pendapatan: Rp ${r.pendapatan}`);
    console.log(`Tanggungan: ${r.jumlahTanggungan}`);
    console.log(`Status Kelayakan Awal: ${r.statusKelayakan}`);

    try {
      // 1. Generate Proof
      const proofResult = await zkpService.generateProof(r.pendapatan, r.jumlahTanggungan);
      console.log(`- ZKP Proof Generated! Proof Hash: ${proofResult.proofHash}`);
      console.log(`- Public Signals: ${JSON.stringify(proofResult.publicSignals)}`);

      // 2. Verify Proof
      const isProofValid = await zkpService.verifyProof(proofResult.proof, proofResult.publicSignals);
      console.log(`- ZKP Proof Mathematically Valid: ${isProofValid}`);

      // 3. Evaluate eligibility
      const isEligible = isProofValid && (proofResult.publicSignals[0] === '1' || proofResult.publicSignals[0] === 1);
      console.log(`- Evaluated Eligibility (Income < 2M AND Dependents >= 3): ${isEligible ? 'LAYAK ✓' : 'TIDAK LAYAK ✗'}`);

      // Verify logic results against expectations
      if (r.nama === 'Reyhan Handika') {
        if (isEligible) console.log('✅ PASS: Reyhan Handika is eligible as expected.');
        else console.error('❌ FAIL: Reyhan Handika should be eligible.');
      } else {
        if (!isEligible) console.log(`✅ PASS: ${r.nama} is NOT eligible as expected.`);
        else console.error(`❌ FAIL: ${r.nama} should NOT be eligible.`);
      }

    } catch (error) {
      console.error(`- Error testing ${r.nama}:`, error);
    }
  }

  console.log('\n=== ZKP ELIGIBILITY TESTS COMPLETED ===');
}

runTests().finally(() => prisma.$disconnect());
