import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/auth.api';
import { vendorApi } from '@/api/vendor.api';
import toast from 'react-hot-toast';

export const VendorLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.login({ phone: username, password });
      const { access, refresh, user } = res.data;

      // Set auth in store
      setAuth(access, refresh, {
        phone: user?.phone || username,
        email: user?.email,
        first_name: user?.first_name || 'Vendor',
        last_name: user?.last_name || '',
        role: user?.role || 'vendor',
      });

      // Check vendor profile status immediately
      try {
        const profile = await vendorApi.getProfile();
        if (profile && profile.verification_status === 'verified') {
          toast.success('Welcome back to Vendor Partner Portal!');
          navigate('/vendor');
        } else {
          toast.error('Your vendor account verification is pending admin approval.');
          navigate('/vendor/pending');
        }
      } catch {
        navigate('/vendor/pending');
      }
    } catch (err: any) {
      console.error('Vendor login error:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Invalid phone/username or password.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#e0e6ed] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20 mb-4">
          <div className="w-full h-full bg-[#12141c] rounded-[14px] flex items-center justify-center">
            <Building2 className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">Vendor Partner Portal</h2>
        <p className="mt-2 text-sm text-gray-400">
          Sign in to manage store stock, view daily item dispatches & track payouts.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-[#12141c]/80 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-2xl border border-[#1e2230] shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Username or Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-[#1a1d2b] border border-[#2a2e42] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm transition-all"
                  placeholder="pharmacy_vendor or email@pharmacy.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Account Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 bg-[#1a1d2b] border border-[#2a2e42] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm transition-all"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In to Vendor Dashboard</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-[#1e2230] text-center">
            <p className="text-sm text-gray-400">
              New pharmacy or supplier partner?{' '}
              <Link
                to="/vendor/register"
                className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline inline-flex items-center gap-1"
              >
                <span>Register New Vendor Store</span>
              </Link>
            </p>
          </div>
        </div>

        {/* Feature Pill Callouts */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-400">
          <div className="p-3 bg-[#12141c]/50 rounded-xl border border-[#1e2230] flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            <span>Automatic Stock Deduction on Admin Confirmation</span>
          </div>
          <div className="p-3 bg-[#12141c]/50 rounded-xl border border-[#1e2230] flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
            <span>Real-time Dispatches & Payout Management</span>
          </div>
        </div>
      </div>
    </div>
  );
};
