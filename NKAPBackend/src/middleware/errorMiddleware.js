const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let errorMessage = err.message || 'Erreur interne du serveur';

  if (err.name === 'ValidationError') {
    errorMessage = 'Données invalides';
  } else if (err.code === 'ER_DUP_ENTRY') {
    errorMessage = 'Cet email est déjà utilisé';
  }

  res.status(statusCode).json({
    message: errorMessage,
    ...(process.env.NODE_ENV === 'production' ? {} : { stack: err.stack }),
  });
};

export default errorMiddleware;
