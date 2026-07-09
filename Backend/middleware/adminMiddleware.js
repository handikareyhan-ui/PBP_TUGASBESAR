const adminMiddleware = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Endpoint ini hanya untuk Administrator.'
    });
  }
  next();
};

module.exports = adminMiddleware;
