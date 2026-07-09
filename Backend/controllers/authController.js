const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const blockchainService = require('../services/blockchainService');

/**
 * Handle Administrator authentication
 * POST /api/auth/login & POST /api/auth/admin/login
 */
exports.loginAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      console.log("REQUEST BODY (missing info):", req.body);
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi.'
      });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      console.log("REQUEST BODY (user not found):", req.body);
      console.log("USER FOUND:", null);
      return res.status(401).json({
        success: false,
        message: 'Username atau password admin salah.'
      });
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.password);
    const passwordMatch = isMatch;
    
    console.log("REQUEST BODY:", req.body);
    console.log("USER FOUND:", user);
    console.log("PASSWORD MATCH:", passwordMatch);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password admin salah.'
      });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role.toLowerCase() },
      process.env.JWT_SECRET || 'bansoschain_super_secret_jwt_key_2026',
      { expiresIn: '1d' }
    );

    // Track login in blockchain audit log
    await blockchainService.submitTransaction(`Admin login session initiated: ${username}`);

    return res.status(200).json({
      success: true,
      token,
      role: user.role.toLowerCase()
    });
  } catch (error) {
    console.error("EXCEPTION OCCURRED IN loginAdmin:", error.stack || error);
    next(error);
  }
};

/**
 * Handle Recipient (User) authentication via NIK or Wallet Address
 * POST /api/auth/login-user & POST /api/auth/user/login
 */
exports.loginUser = async (req, res, next) => {
  try {
    const { identifier, method } = req.body;

    // NOTE: SMS OTP and Biometric validation methods are simulated for prototype/demo purposes.
    // The backend directly authenticates the user using their NIK identifier.

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'NIK wajib disediakan.'
      });
    }

    let application = null;

    // Otorisasi murni menggunakan NIK warga
    application = await prisma.application.findUnique({
      where: { nik: identifier }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Kredensial tidak terdaftar dalam database pengajuan bansos.'
      });
    }

    // Verify status eligibility
    if (application.statusKelayakan === 'TIDAK_LAYAK') {
      return res.status(403).json({
        success: false,
        message: 'Status Anda dinyatakan TIDAK LAYAK untuk menerima bantuan sosial.'
      });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: application.id, role: 'user', identifier: identifier },
      process.env.JWT_SECRET || 'bansoschain_super_secret_jwt_key_2026',
      { expiresIn: '1d' }
    );

    // Track user login session in audit log
    await blockchainService.submitTransaction(`User session authorized for ID: ${application.id.substring(0, 8)}...`);

    return res.status(200).json({
      success: true,
      token,
      role: 'user',
      identifier: identifier,
      recipient: {
        id: application.id,
        name: application.nama,
        nik: application.nik,
        region: application.alamat,
        status: application.statusKelayakan,
        pendapatan: application.pendapatan,
        jumlahTanggungan: application.jumlahTanggungan,
        claimStep: application.claimStep,
        jenisBantuan: application.jenisBantuan,
        dokumen: application.dokumen
      }
    });
  } catch (error) {
    next(error);
  }
};
