export interface LoginResponse {
    token: string;
    user: {
      email: string;
      name?: string;
      id?: string;
    };
    expiresIn?: number;
    refreshToken?: string;
  }