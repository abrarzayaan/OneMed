import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowRight, Store, ShieldCheck } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import toast from 'react-hot-toast';

export const VendorRegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !phone || !email || !password) {
      toast.error('Please fill in all required fields (First Name, Phone, Email, Password)');
      return;
    }

    try {
      setLoading(true);
      // Calls main auth registration endpoint with role: 'vendor'
      await authApi.register({
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
        password,
        role: 'vendor',
      });

      toast.success('Vendor account registered successfully! Please sign in and complete your Store Profile.');
      navigate('/vendor/login');
    } catch (err: any) {
      console.error('Vendor registration error:', err);
      const errMsg =
        err.response?.data?.phone?.[0] ||
        err.response?.data?.email?.[0] ||
        err.response?.data?.error ||
        'Registration failed. Please check your credentials.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#e0e6ed] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20 mb-3">
          <div className="w-full h-full bg-[#12141c] rounded-[14px] flex items-center justify-center">
            <Store className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">Vendor Sign Up</h2>
        <p className="mt-2 text-sm text-gray-400">
          Create your vendor account. Store details and pharmacy trade license will be filled in during Store Profile completion.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-[#12141c]/90 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-2xl border border-[#1e2230] shadow-2xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#1a1d2b] border border-[#2a2e42] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="John"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#1a1d2b] border border-[#2a2e42] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Mobile Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Mobile Phone Number *
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#1a1d2b] border border-[#2a2e42] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
                  placeholder="01700000000"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#1a1d2b] border border-[#2a2e42] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="vendor@pharmacy.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#1a1d2b] border border-[#2a2e42] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span>Registering Vendor Account...</span>
                ) : (
                  <>
                    <span>Create Vendor Account</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-[#1e2230] text-center">
            <p className="text-sm text-gray-400">
              Already have an active account?{' '}
              <Link
                to="/vendor/login"
                className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 p-3 bg-[#12141c]/50 rounded-xl border border-[#1e2230] text-xs text-gray-400 flex items-center justify-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
          <span>After registration, edit & complete your Store Profile to manage inventory stock.</span>
        </div>
      </div>
    </div>
  );
};
