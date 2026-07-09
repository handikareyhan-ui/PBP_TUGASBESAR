const errorMiddleware = (err, req, res, next) => {
  console.error('Error occurred:', err);

  const status = err.status || 500;
  const message = err.message || 'Terjadi kesalahan internal pada server.';

  res.status(status).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorMiddleware;
