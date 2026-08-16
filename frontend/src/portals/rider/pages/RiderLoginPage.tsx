import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bike, Phone, Lock, ArrowRight, ShieldCheck, Loader2, Sparkles } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { riderApi } from '@/api/rider.api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export const RiderLoginPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await authApi.login({ phone, password });
      setAuth(
        res.data.access,
        res.data.refresh,
        {
          phone: phone,
          first_name: res.data.user?.first_name || '',
          last_name: res.data.user?.last_name || '',
          email: res.data.user?.email || '',
          role: 'rider',
        }
      );

      // Check rider profile status immediately
      try {
        const profile = await riderApi.getProfile();
        if (profile && profile.verification_status === 'verified') {
          toast.success('Welcome back to Express Rider Portal!');
          navigate('/rider/dashboard');
        } else {
          toast.error('Your rider account verification is pending admin approval.');
          navigate('/rider/pending');
        }
      } catch {
        navigate('/rider/pending');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.response?.data?.error || 'Invalid credentials or login failed';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-surface-base flex items-center justify-center p-4 overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-surface-card/90 backdrop-blur-2xl border border-border-default/80 rounded-3xl p-8 shadow-2xl shadow-cyan-950/30 space-y-6">
        
        {/* Logo & Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-500 p-[1px] shadow-xl shadow-cyan-500/20">
            <div className="w-full h-full bg-surface-base rounded-[15px] flex items-center justify-center text-cyan-400">
              <Bike className="w-8 h-8 animate-bounce" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-[11px] font-bold border border-cyan-500/30 uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>LOGISTICS FLEET SIGN IN</span>
            </div>
            <h1 className="font-head font-black text-2xl text-content-primary">
              Rider Partner Portal
            </h1>
            <p className="text-xs text-content-muted">
              Access your express delivery workload & active orders console
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1.5">
              Mobile Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-content-muted" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full pl-10 pr-4 py-3 bg-surface-base/80 border border-border-default/80 rounded-2xl text-xs text-content-primary focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1.5">
              Account Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-content-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-surface-base/80 border border-border-default/80 rounded-2xl text-xs text-content-primary focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-cyan-500/25 transition-transform hover:scale-[1.02] flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <>
                <span>Sign In to Express Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info & Signup Link */}
        <div className="pt-4 border-t border-border-default/60 text-center space-y-2">
          <p className="text-xs text-content-muted">
            Don't have a rider account yet?{' '}
            <Link to="/rider/register" className="font-bold text-cyan-300 hover:underline">
              Register as Express Rider
            </Link>
          </p>
          <div className="flex items-center justify-center space-x-1.5 text-[11px] text-content-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted DRF Logistics Authentication</span>
          </div>
        </div>

      </div>
    </div>
  );
};
