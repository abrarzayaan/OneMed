import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/auth.api';
import { ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminAccessDeniedRedirect: React.FC = () => {
  useEffect(() => {
    toast.error('Access Denied: Please log in with an authorized Admin account.');
  }, []);

  return <Navigate to="/admin/login" replace />;
};

export const AdminGuard: React.FC = () => {
  const { isLoggedIn, user, token, updateUser, logout } = useAuthStore();
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifyAdminSession = async () => {
      // 1. If not logged in or no token, reject immediately
      if (!isLoggedIn || !token) {
        if (isMounted) {
          setIsValidToken(false);
          setIsValidating(false);
        }
        return;
      }

      // 2. Reject obvious fake/dummy preview tokens immediately
      if (token.startsWith('preview-') || token.startsWith('demo-')) {
        logout();
        if (isMounted) {
          setIsValidToken(false);
          setIsValidating(false);
        }
        return;
      }

      // 3. Verify real token validity against backend /api/auth/me/
      try {
        const res = await authApi.me();
        const serverUser = res.data;
        if (isMounted) {
          updateUser(serverUser);
          setIsValidToken(true);
          setIsValidating(false);
        }
      } catch (err: any) {
        // If 401 Unauthorized or invalid token, clean stale state & redirect to login
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          logout();
        }
        if (isMounted) {
          setIsValidToken(false);
          setIsValidating(false);
        }
      }
    };

    verifyAdminSession();

    return () => {
      isMounted = false;
    };
  }, [token, isLoggedIn, logout, updateUser]);

  if (isValidating) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-xs font-mono text-content-muted">Verifying enterprise security credentials...</p>
        </div>
      </div>
    );
  }

  // Not authenticated or token invalid
  if (!isLoggedIn || !isValidToken || !user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  // Check if user has Admin / Superadmin privileges
  const isSuperAdmin = Boolean(user.is_superuser || user.role === 'SUPERADMIN');
  const isAdminStaff = Boolean(user.is_staff || user.role === 'ADMIN');

  if (!isSuperAdmin && !isAdminStaff) {
    return <AdminAccessDeniedRedirect />;
  }

  // Super Admin has access to everything
  if (isSuperAdmin) {
    return <Outlet />;
  }

  // Route-level dynamic permission check for Staff Admin
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentModule = pathSegments[1] || 'dashboard';

  const userPerms = user.permissions || {};
  const perm = userPerms[currentModule];
  const hasModulePermission = currentModule === 'dashboard' || perm === true || perm === 'FULL' || perm === 'READ';

  if (!hasModulePermission) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 rounded-3xl bg-bg-card border border-amber-500/30 shadow-2xl space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-head font-bold text-content-primary">Sub-Module Access Restricted</h2>
          <p className="text-xs text-content-muted max-w-md mx-auto">
            Your assigned Staff Role (<strong className="text-amber-400">{user.staff_role || 'Staff Member'}</strong>) does not have authorization to view or edit the <span className="text-primary-400 font-mono font-bold">/{currentModule}</span> section.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-bg-surface border border-bg-border text-xs font-mono text-content-muted text-left space-y-1">
          <div>Module Requested: <span className="text-amber-400 font-bold">/{currentModule}</span></div>
          <div>Permission Required: <span className="text-rose-400 font-bold">TRUE</span></div>
          <div>Your Status: <span className="text-content-primary">RESTRICTED BY SUPER ADMIN</span></div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

