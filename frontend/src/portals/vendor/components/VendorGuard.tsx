import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { vendorApi, type VendorProfile } from '@/api/vendor.api';
import { Loader2 } from 'lucide-react';

export const VendorGuard: React.FC = () => {
  const { isLoggedIn, user } = useAuthStore();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<VendorProfile | null>(null);

  const isVendorUser = Boolean(user?.role && user.role.toLowerCase() === 'vendor');

  useEffect(() => {
    if (isLoggedIn && isVendorUser) {
      checkVendorStatus();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, isVendorUser, location.pathname]);

  const checkVendorStatus = async () => {
    try {
      setLoading(true);
      const res = await vendorApi.getProfile();
      setProfile(res);
    } catch (err) {
      console.error('Vendor guard status check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return <Navigate to="/vendor/login" state={{ from: location }} replace />;
  }

  // Strict role check: If logged in as Rider/Consumer/Admin, restrict access to Vendor portal
  if (!isVendorUser) {
    return <Navigate to="/vendor/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0c10] flex flex-col items-center justify-center text-[#e0e6ed]">
        <Loader2 size={36} className="text-emerald-500 animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-400">Authenticating Vendor Partner Portal...</p>
      </div>
    );
  }

  // If vendor status is pending/inactive and not already on pending page
  if (
    profile &&
    profile.verification_status !== 'verified' &&
    location.pathname !== '/vendor/pending'
  ) {
    return <Navigate to="/vendor/pending" replace />;
  }

  // If vendor status is verified and currently on pending page -> Auto-redirect to dashboard
  if (
    profile &&
    profile.verification_status === 'verified' &&
    location.pathname === '/vendor/pending'
  ) {
    return <Navigate to="/vendor" replace />;
  }

  return <Outlet />;
};
