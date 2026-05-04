export class AppError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'CONSTRAINT' | 'VALIDATION' | 'INTERNAL',
    public original?: Error
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
