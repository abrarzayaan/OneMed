import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { riderApi, type RiderProfile } from '@/api/rider.api';
import { Loader2 } from 'lucide-react';

export const RiderGuard: React.FC = () => {
  const { isLoggedIn, user } = useAuthStore();
  const location = useLocation();
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<RiderProfile | null>(null);

  const isRiderUser = Boolean(user?.role && user.role.toLowerCase() === 'rider');

  useEffect(() => {
    if (isLoggedIn && isRiderUser) {
      checkRiderStatus();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, isRiderUser, location.pathname]);

  const checkRiderStatus = async () => {
    try {
      setLoading(true);
      const res = await riderApi.getProfile();
      setProfile(res);
    } catch (err) {
      console.error('Rider guard status check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return <Navigate to="/rider/login" state={{ from: location }} replace />;
  }

  // Strict role check: If not rider role, redirect to rider login
  if (!isRiderUser) {
    return <Navigate to="/rider/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <Loader2 size={36} className="text-cyan-400 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-400">Authenticating Express Logistics Partner...</p>
      </div>
    );
  }

  // If rider status is pending/rejected and not already on pending page
  if (
    profile &&
    profile.verification_status !== 'verified' &&
    location.pathname !== '/rider/pending'
  ) {
    return <Navigate to="/rider/pending" replace />;
  }

  // If rider status is verified and currently on pending page -> Auto-redirect to dashboard
  if (
    profile &&
    profile.verification_status === 'verified' &&
    location.pathname === '/rider/pending'
  ) {
    return <Navigate to="/rider/dashboard" replace />;
  }

  return <Outlet />;
};
