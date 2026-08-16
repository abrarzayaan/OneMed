import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldAlert, RefreshCw, LogOut, CheckCircle2, PhoneCall } from 'lucide-react';
import { vendorApi, type VendorProfile } from '@/api/vendor.api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export const VendorPendingPage: React.FC = () => {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await vendorApi.getProfile();
      setProfile(res);
      if (res.verification_status === 'verified') {
        toast.success('Your vendor account has been verified! Unlocking dashboard...');
        navigate('/vendor', { replace: true });
      } else {
        toast('Verification status is still pending admin review.', { icon: '⏳' });
      }
    } catch (err) {
      console.error('Pending status check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/vendor/login');
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#e0e6ed] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 p-4 mb-4 shadow-xl shadow-amber-500/10">
          <Clock className="w-10 h-10 animate-pulse" />
        </div>

        <h2 className="text-2xl font-extrabold text-white">Verification Pending</h2>
        <p className="mt-2 text-sm text-gray-400 leading-relaxed">
          Thank you for registering <strong className="text-amber-400">{profile?.name || 'your pharmacy'}</strong>!
          Our Super Admin team is currently verifying your trade license and store credentials.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#12141c]/90 backdrop-blur-xl py-6 px-6 rounded-2xl border border-[#1e2230] shadow-2xl space-y-4">
          <div className="p-4 rounded-xl bg-[#171a26] border border-[#24283b] space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Account Status</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold uppercase text-[10px]">
                {profile?.verification_status || 'PENDING'}
              </span>
            </div>
            <div className="text-sm font-semibold text-white">
              {profile?.name}
            </div>
            <div className="text-xs text-gray-400 flex items-center justify-between">
              <span>Trade License:</span>
              <span className="font-mono text-gray-300">{profile?.trade_license_no || 'Submitted'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={fetchProfile}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Verification Status</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1a1d2b] hover:bg-rose-500/10 border border-[#2a2e42] hover:border-rose-500/30 text-gray-300 hover:text-rose-400 text-xs font-semibold transition-all"
            >
              <LogOut size={16} />
              <span>Log Out & Exit</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500 flex items-center justify-center gap-1">
          <PhoneCall size={14} className="text-emerald-400" />
          <span>Need urgent approval? Contact OneMed Support: +880 1334-317864</span>
        </div>
      </div>
    </div>
  );
};
