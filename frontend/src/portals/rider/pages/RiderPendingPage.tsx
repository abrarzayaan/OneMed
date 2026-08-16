import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Bike, RefreshCw, LogOut, PhoneCall, ShieldCheck, FileText } from 'lucide-react';
import { riderApi, type RiderProfile } from '@/api/rider.api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export const RiderPendingPage: React.FC = () => {
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await riderApi.getProfile();
      setProfile(res);
      if (res.verification_status === 'verified') {
        toast.success('Congratulations! Your Rider Partner account is verified. Unlocking portal...');
        navigate('/rider/dashboard', { replace: true });
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
    navigate('/rider/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased relative selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 relative">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 p-4 mb-2 shadow-2xl shadow-amber-500/10">
          <Bike className="w-10 h-10 animate-pulse text-amber-400" />
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-[11px] font-bold border border-amber-500/30 uppercase tracking-widest">
          <Clock className="w-3.5 h-3.5" />
          <span>APPLICATION UNDER REVIEW</span>
        </div>

        <h2 className="text-2xl font-black font-head text-white tracking-tight">
          Express Rider Verification Pending
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed px-4">
          Thank you for registering as an Express Rider Partner! Our Admin Operations team is currently verifying your National ID & Driving License documents.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative">
        <div className="bg-slate-900/90 backdrop-blur-2xl py-6 px-6 rounded-3xl border border-slate-800 shadow-2xl space-y-5">
          
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Verification Status</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold font-mono text-[10px] uppercase">
                {profile?.verification_status || 'PENDING'}
              </span>
            </div>

            <div className="text-sm font-bold text-white flex items-center justify-between">
              <span>{profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : 'Express Partner'}</span>
              <span className="text-xs font-mono text-cyan-400 uppercase bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                {profile?.vehicle_type || 'BIKE'}
              </span>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs text-slate-400 font-mono">
              <div className="flex items-center justify-between">
                <span>Phone:</span>
                <span className="text-slate-200">{profile?.phone || 'N/A'}</span>
              </div>
              {profile?.nid_no && (
                <div className="flex items-center justify-between">
                  <span>NID No:</span>
                  <span className="text-slate-200">{profile.nid_no}</span>
                </div>
              )}
              {profile?.license_no && (
                <div className="flex items-center justify-between">
                  <span>License No:</span>
                  <span className="text-slate-200">{profile.license_no}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] leading-relaxed flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>Once verified by Admin, your portal will automatically unlock live dispatches and delivery workload tasks.</span>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={fetchProfile}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Check Verification Status</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-slate-950 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 text-xs font-semibold transition-all"
            >
              <LogOut size={16} />
              <span>Log Out & Exit</span>
            </button>
          </div>

        </div>

        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <PhoneCall size={14} className="text-cyan-400" />
          <span>Need urgent approval? Contact Express Rider Helpline: +880 1700-000000</span>
        </div>
      </div>
    </div>
  );
};
