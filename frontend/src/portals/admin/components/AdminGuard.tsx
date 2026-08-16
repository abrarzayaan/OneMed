import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminAccessDeniedRedirect: React.FC = () => {
  useEffect(() => {
    toast.error('Access Denied: Please log in with an authorized Admin account.');
  }, []);

  return <Navigate to="/login?redirect=/admin" replace />;
};

export const AdminGuard: React.FC = () => {
  const { isLoggedIn, user } = useAuthStore();
  const location = useLocation();

  // Check if user is authenticated
  if (!isLoggedIn || !user) {
    return <Navigate to="/login?redirect=/admin" replace />;
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

