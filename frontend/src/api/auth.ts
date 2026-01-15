import type { User } from '@/types/user';
import api from './api';

const getMe = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me');
  return response.data;
};

export default getMe;
