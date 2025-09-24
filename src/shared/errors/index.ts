export class FdxError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: string,
  ) {
    super(message);
    this.name = 'FdxError';
  }
}

export class UnauthorizedError extends FdxError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends FdxError {
  constructor(
    message = 'Insufficient permissions',
    options?: { code?: string; details?: string | string[] },
  ) {
    super(
      options?.code || 'FORBIDDEN',
      message,
      403,
      typeof options?.details === 'string' ? options.details : options?.details?.join(', '),
    );
  }
}

export class NotFoundError extends FdxError {
  constructor(message = 'Resource not found') {
    super('NOT_FOUND', message, 404);
  }
}

export class ValidationError extends FdxError {
  constructor(message = 'Invalid request data', details?: string) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class ConflictError extends FdxError {
  constructor(message = 'Request conflicts with current state') {
    super('CONFLICT', message, 409);
  }
}
