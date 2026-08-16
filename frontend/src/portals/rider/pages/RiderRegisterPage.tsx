import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bike, Phone, User, Mail, Lock, ArrowRight, ShieldCheck, Loader2, Sparkles } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import toast from 'react-hot-toast';

export const RiderRegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authApi.register({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        email: email,
        password: password,
        role: 'rider',
      });

      toast.success('Rider account created successfully! Please sign in.');
      navigate('/rider/login');
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.response?.data?.error || 'Registration failed';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-surface-base flex items-center justify-center p-4 overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

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
              <span>JOIN EXPRESS FLEET</span>
            </div>
            <h1 className="font-head font-black text-2xl text-content-primary">
              Rider Registration
            </h1>
            <p className="text-xs text-content-muted">
              Register as an Express Delivery Partner for OneMed
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-content-muted" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Tanvir"
                  className="w-full pl-9 pr-3 py-2 bg-surface-base/80 border border-border-default/80 rounded-xl text-xs text-content-primary focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ahmed"
                className="w-full px-3 py-2 bg-surface-base/80 border border-border-default/80 rounded-xl text-xs text-content-primary focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">
              Mobile Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-content-muted" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full pl-9 pr-3 py-2 bg-surface-base/80 border border-border-default/80 rounded-xl text-xs text-content-primary focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-content-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rider@example.com"
                className="w-full pl-9 pr-3 py-2 bg-surface-base/80 border border-border-default/80 rounded-xl text-xs text-content-primary focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">
              Set Account Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-content-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-surface-base/80 border border-border-default/80 rounded-xl text-xs text-content-primary focus:outline-none focus:border-cyan-500"
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
                <span>Complete Partner Signup</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-4 border-t border-border-default/60 text-center space-y-2">
          <p className="text-xs text-content-muted">
            Already registered?{' '}
            <Link to="/rider/login" className="font-bold text-cyan-300 hover:underline">
              Sign In Here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
