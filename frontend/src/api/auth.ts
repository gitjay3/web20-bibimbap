import type { User } from '@/types/user';
import api from './api';

export const getMe = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me');
  return response.data;
};

export const logout = async () => {
  await api.get('/auth/logout');
};
