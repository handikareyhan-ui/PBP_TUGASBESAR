const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Seed Admin User
  const hashedPassword = await bcrypt.hash('adminpassword', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Seeded admin user successfully.');

  // Clean existing tables to ensure clean slate
  await prisma.verification.deleteMany({});
  await prisma.distribution.deleteMany({});
  await prisma.fundTransaction.deleteMany({});
  await prisma.fundSource.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.auditLog.deleteMany({});

  console.log('Cleared existing records.');

  // Seed default FundSources (assistance programs)
  await prisma.fundSource.createMany({
    data: [
      {
        programName: 'Bansos Sembako',
        fundSource: 'APBN',
        institution: 'Kementerian Sosial',
        fiscalYear: 2026,
        allocatedBudget: 150000000.0,
        remainingBudget: 150000000.0,
        distributedBudget: 0.0,
        status: 'ACTIVE'
      },
      {
        programName: 'Bantuan Langsung Tunai',
        fundSource: 'APBD Provinsi',
        institution: 'Dinas Sosial Provinsi',
        fiscalYear: 2026,
        allocatedBudget: 200000000.0,
        remainingBudget: 200000000.0,
        distributedBudget: 0.0,
        status: 'ACTIVE'
      },
      {
        programName: 'Program Keluarga Harapan',
        fundSource: 'APBN',
        institution: 'Kementerian Sosial',
        fiscalYear: 2026,
        allocatedBudget: 300000000.0,
        remainingBudget: 300000000.0,
        distributedBudget: 0.0,
        status: 'ACTIVE'
      }
    ]
  });

  console.log('Seeded default fund sources successfully.');

  // 2. Seed Test Applications (Simulating citizens who submitted applications)
  const testApplications = [
    {
      nama: 'Reyhan Handika',
      nik: '3201234567890123',
      alamat: 'Kota Bandung',
      pendapatan: 1500000,
      jumlahTanggungan: 4,
      walletId: '0xba8ff8c1d7a770f16e87747a167f99ec64e44d3f',
      jenisBantuan: 'Bansos Sembako',
      statusKelayakan: 'LAYAK',
    },
    {
      nama: 'Andi Pratama',
      nik: '3201234567890124',
      alamat: 'Kota Jakarta',
      pendapatan: 2500000, // Pendapatan >= 2.000.000 (Tidak Layak)
      jumlahTanggungan: 4,
      walletId: null,
      jenisBantuan: 'Bansos Sembako',
      statusKelayakan: 'TIDAK_LAYAK',
    },
    {
      nama: 'Siti Aminah',
      nik: '3201234567890125',
      alamat: 'Kota Surabaya',
      pendapatan: 1200000,
      jumlahTanggungan: 2, // Tanggungan < 3 (Tidak Layak)
      walletId: null,
      jenisBantuan: 'Bantuan Langsung Tunai',
      statusKelayakan: 'TIDAK_LAYAK',
    },
    {
      nama: 'Budi Santoso',
      nik: '3201234567890126',
      alamat: 'Kota Medan',
      pendapatan: 3500000, // Pendapatan >= 2.000.000 (Tidak Layak)
      jumlahTanggungan: 1,
      walletId: null,
      jenisBantuan: 'Program Keluarga Harapan',
      statusKelayakan: 'TIDAK_LAYAK',
    }
  ];

  for (const app of testApplications) {
    const createdApp = await prisma.application.create({
      data: {
        nama: app.nama,
        nik: app.nik,
        alamat: app.alamat,
        pendapatan: app.pendapatan,
        jumlahTanggungan: app.jumlahTanggungan,
        walletId: app.walletId,
        statusKelayakan: app.statusKelayakan,
        jenisBantuan: app.jenisBantuan,
        dokumen: 'dokumen_ktp_kk.pdf',
        claimStep: 1,
      }
    });

    // Create a verification log for each application
    const isEligible = app.statusKelayakan === 'LAYAK';
    await prisma.verification.create({
      data: {
        applicationId: createdApp.id,
        proofHash: '0x' + require('crypto').randomBytes(16).toString('hex'),
        proofVerified: true,
        status: isEligible ? 'VERIFIED' : 'REJECTED',
        verifiedAt: new Date()
      }
    });
  }

  console.log('Seeded test applications and verifications successfully.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
