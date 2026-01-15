import type { User } from '@/types/user';
import api from './api';

export const getMe = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me');
  return response.data;
};

export const adminLogin = async (payload: { id: string; password: string }) => {
  await api.post('/auth/login', payload);
};
