export interface UserError {
    code: 'PROFILE_NOT_FOUND' | 'UPDATE_FAILED' | 'PERMISSION_DENIED';
    message: string;
    fieldErrors?: Record<string, string>;
  }