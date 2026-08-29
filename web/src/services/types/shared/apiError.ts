export interface ApiError<T = unknown> {
    statusCode: number;
    message: string;
    errorCode?: string;
    details?: T;
    timestamp?: string;
    path?: string;
  }