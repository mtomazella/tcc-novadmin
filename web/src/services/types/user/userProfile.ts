export interface UserProfile {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    createdAt: string;
    lastLogin?: string;
    isVerified: boolean;
  }