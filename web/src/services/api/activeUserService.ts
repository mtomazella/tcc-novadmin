import api from './api';
import type { UserProfile } from '../types/user/userProfile';
import type { ApiError } from '../types/shared/apiError';

const ENDPOINT = '/users/me';

export const getProfile = async (): Promise<UserProfile> => {
  try {
    const response = await api.get<UserProfile>(ENDPOINT);
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(apiError.message || 'Failed to load profile');
  }
};

export const updateProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    const response = await api.patch<UserProfile>(ENDPOINT, data);
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(apiError.message || 'Failed to update profile');
  }
};