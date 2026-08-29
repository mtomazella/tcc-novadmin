export interface AuthError {
    code: 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'TOKEN_EXPIRED';
    message: string;
    remainingAttempts?: number;
  }