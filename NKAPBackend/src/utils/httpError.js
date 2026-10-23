export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function sendError(res, error, next) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }
  return next(error);
}
