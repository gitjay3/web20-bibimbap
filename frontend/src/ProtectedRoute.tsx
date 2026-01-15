import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/store/AuthContext';
import type { User } from '@/types/user';

interface ProtectedRouteProps {
  allowedRoles?: User['role'][];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // 1. 비로그인 상태 -> 로그인 페이지로
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. 권한 부족 -> 메인 페이지로
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
