import { useState, useEffect, type ReactNode } from 'react';
import getMe from '@/api/auth';
import type { User } from '@/types/user';
import { AuthContext } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const userData = await getMe();
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return <AuthContext value={{ user, isLoading }}>{children}</AuthContext>;
}

export default AuthProvider;
