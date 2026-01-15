import type { User } from '@/types/user';
import { createContext, useContext } from 'react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 반드시 AuthProvider 내에서 사용되어야합니다.');
  }
  return context;
};
