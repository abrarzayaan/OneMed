import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Phone, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

// ── Zod schema ────────────────────────────────────────────────────
const loginSchema = z.object({
  phone: z.string().min(3, 'Enter a valid phone number or username'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type LoginForm = z.infer<typeof loginSchema>;

// ── Decorative features for brand side ──────────────────────────────
const features = [
  '✅ 1000+ Medicines in Stock',
  '🚀 Fast Doorstep Delivery',
  '🔒 Secure & Private',
  '💊 Prescription Upload Support',
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const user = useAuthStore((s) => s.user);
  const [showPass, setShowPass] = useState(false);

  const prefillPhone = location.state?.phone || '';

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');

  useEffect(() => {
    if (isLoggedIn && user) {
      const isVendorOrRider = Boolean(
        user.role && (user.role.toLowerCase() === 'vendor' || user.role.toLowerCase() === 'rider')
      );
      if (isVendorOrRider) {
        return;
      }

      const isUserAdmin = Boolean(user.is_superuser || user.is_staff || user.role === 'SUPERADMIN' || user.role === 'ADMIN');

      if (isUserAdmin) {
        if (redirectParam) {
          navigate(redirectParam, { replace: true });
        } else {
          navigate('/admin', { replace: true });
        }
      } else {
        if (redirectParam && !redirectParam.startsWith('/admin')) {
          navigate(redirectParam, { replace: true });
        } else if (!redirectParam) {
          navigate('/', { replace: true });
        }
      }
    }
  }, [isLoggedIn, user, navigate, redirectParam]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: prefillPhone,
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await authApi.login(data);
      const { access, refresh, user: loggedUser } = res.data;

      // Ensure user object has a default consumer role if not vendor or rider
      const userData = loggedUser || { phone: data.phone, role: 'consumer' };
      if (!userData.role) userData.role = 'consumer';

      setAuth(access, refresh, userData);

      toast.success('Welcome back! 👋');

      const searchParams = new URLSearchParams(location.search);
      const redirectParam = searchParams.get('redirect');

      if (userData.role === 'vendor') {
        navigate('/vendor', { replace: true });
      } else if (userData.role === 'rider') {
        navigate('/rider', { replace: true });
      } else if (redirectParam) {
        navigate(redirectParam, { replace: true });
      } else if (userData.is_superuser || userData.is_staff || userData.role === 'SUPERADMIN' || userData.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        'Invalid phone number or password';
      toast.error(msg);
    }
  };


  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* ── Left: Brand panel ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/60 via-bg-base to-bg-base" />
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/onemed-logo.png" alt="OneMed" className="w-10 h-10 rounded-xl object-cover glow-primary" />
          <span className="font-head font-bold text-2xl text-content-primary">
            One<span className="text-primary-400">Med</span>
          </span>
        </div>

        {/* Centre content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h1 className="font-head font-bold text-4xl text-content-primary leading-tight">
              Your health,<br />
              <span className="text-primary-400">delivered</span> to your door.
            </h1>
            <p className="text-content-secondary text-lg leading-relaxed max-w-md">
              Bangladesh's trusted online pharmacy — medicines, vitamins, and health essentials, fast.
            </p>
          </div>

          <ul className="space-y-3">
            {features.map((f) => (
              <motion.li
                key={f}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3 text-content-secondary"
              >
                <span>{f}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Bottom quote */}
        <p className="relative z-10 text-content-muted text-sm">
          © {new Date().getFullYear()} OneMed. All rights reserved.
        </p>
      </motion.div>

      {/* ── Right: Login form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-2">
            <img src="/onemed-logo.png" alt="OneMed" className="w-9 h-9 rounded-xl object-cover" />
            <span className="font-head font-bold text-xl text-content-primary">
              One<span className="text-primary-400">Med</span>
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h2 className="font-head font-bold text-3xl text-content-primary">Welcome back</h2>
            <p className="text-content-secondary text-sm">
              Sign in with your phone number or username
            </p>
          </div>

          {/* Admin access notice if redirected from /admin */}
          {redirectParam?.startsWith('/admin') && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-400">
                <ShieldCheck className="w-4 h-4" /> Admin Access Required
              </div>
              <p>Please sign in with an authorized <strong>Super Admin</strong> or <strong>Staff Admin</strong> account to access the Admin Portal.</p>
            </div>
          )}

          {/* Form */}
          <form
            id="login-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            <Input
              id="login-phone"
              label="Phone Number or Username"
              type="text"
              placeholder="01XXXXXXXXX or admin"
              icon={<Phone className="h-4 w-4" />}
              error={errors.phone?.message}
              {...register('phone')}
            />

            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="text-sm font-medium text-content-secondary"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={[
                    'w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-sans',
                    'bg-bg-card border text-content-primary placeholder:text-content-muted',
                    'focus:outline-none focus:ring-1 transition-colors',
                    errors.password
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-bg-border focus:border-primary-500 focus:ring-primary-500',
                  ].join(' ')}
                  {...register('password')}
                />
                <button
                  type="button"
                  id="toggle-password"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-secondary transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              id="login-submit-btn"
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-bg-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-bg-base text-xs text-content-muted">
                New to OneMed?
              </span>
            </div>
          </div>

          {/* Register link */}
          <Link
            to="/register"
            id="go-to-register"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-bg-border
                       text-content-secondary hover:text-content-primary hover:border-primary-500
                       text-sm font-medium transition-all duration-200 hover:bg-bg-card"
          >
            <ShieldCheck className="h-4 w-4 text-accent-500" />
            Create a free account
          </Link>

          {/* Trust badge */}
          <p className="text-center text-xs text-content-muted">
            🔒 Your data is encrypted and never shared
          </p>
        </motion.div>
      </div>
    </div>
  );
}
