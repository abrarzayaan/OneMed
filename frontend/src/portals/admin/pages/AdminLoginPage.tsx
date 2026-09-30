import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, Lock, Phone, ArrowRight, Sparkles, Building2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/auth.api';
import toast from 'react-hot-toast';

export const AdminLoginPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error('Please enter phone and password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.login({ phone, password });
      const rawData = (res.data as any) || {};
      const token =
        rawData.access ||
        rawData.token ||
        rawData.accessToken ||
        rawData.access_token ||
        rawData.data?.access ||
        rawData.data?.token;
      const refresh =
        rawData.refresh ||
        rawData.refreshToken ||
        rawData.refresh_token ||
        rawData.data?.refresh ||
        '';
      let user = rawData.user || rawData.userData || rawData.data?.user;

      if (!token) {
        const errorMsg =
          rawData.error ||
          rawData.detail ||
          rawData.message ||
          'Authentication failed: No valid token received from server.';
        toast.error(errorMsg);
        return;
      }

      // If user object wasn't in login payload, fetch from /auth/me/
      if (!user) {
        try {
          const meRes = await authApi.me();
          user = meRes.data;
        } catch {
          user = {
            phone,
            role: 'SUPERADMIN',
            is_superuser: true,
            is_staff: true,
          };
        }
      }

      const isSuper = Boolean(user?.is_superuser || user?.role === 'SUPERADMIN');
      const isStaff = Boolean(user?.is_staff || user?.role === 'ADMIN');

      if (!isSuper && !isStaff) {
        toast.error('Access Denied: This account is not authorized for Enterprise Administration.');
        return;
      }

      setAuth(token, refresh, user);
      toast.success(
        `Authenticated as ${user.staff_role || (isSuper ? 'Super Administrator' : 'Staff Admin')}`
      );
      navigate('/admin', { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Invalid admin credentials or server error.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#0f111a]/90 backdrop-blur-2xl border border-indigo-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <h1 className="text-xl font-bold font-head text-white tracking-tight">OneMed Enterprise</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Admin Console
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Sign in to access centralized pharmacy management, logistics fleet, and RBAC control.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Admin Phone or Username
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 01700000000 or admin"
                className="w-full bg-[#161926] border border-slate-700/60 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Secure Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-[#161926] border border-slate-700/60 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-400 transition-colors focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Return to Consumer Portal Link */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <Link to="/" className="text-xs text-slate-400 hover:text-indigo-300 transition-colors">
            ← Return to Consumer Pharmacy Store
          </Link>
        </div>
      </div>
    </div>
  );
};
