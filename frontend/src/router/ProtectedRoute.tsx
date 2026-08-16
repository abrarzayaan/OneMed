import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

export default function ProtectedRoute() {
  const { isLoggedIn, user } = useAuthStore();
  const isPartnerUser = Boolean(
    user?.role && (user.role.toLowerCase() === 'vendor' || user.role.toLowerCase() === 'rider')
  );
  const isConsumerLoggedIn = isLoggedIn && !isPartnerUser;

  return isConsumerLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
}
