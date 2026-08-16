import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';


// ── Zod schema ────────────────────────────────────────────────────
const registerSchema = z
  .object({
    first_name: z.string().min(2, 'First name must be at least 2 characters'),
    last_name:  z.string().min(2, 'Last name must be at least 2 characters'),
    email:      z.string().email('Enter a valid email address'),
    phone:      z
      .string()
      .min(11, 'Phone must be 11 digits')
      .max(14, 'Phone number too long')
      .regex(/^[0-9+]+$/, 'Only digits and + allowed'),
    password:   z.string().min(8, 'Password must be at least 8 characters'),
    confirm:    z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ['confirm'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

// ── Password strength indicator ───────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Contains a number',     ok: /\d/.test(password) },
    { label: 'Contains a letter',     ok: /[a-zA-Z]/.test(password) },
  ];
  if (!password) return null;
  return (
    <ul className="mt-2 space-y-1">
      {checks.map(({ label, ok }) => (
        <li key={label} className={`flex items-center gap-2 text-xs ${ok ? 'text-green-400' : 'text-content-muted'}`}>
          <CheckCircle2 className={`h-3 w-3 ${ok ? 'text-green-400' : 'text-bg-border'}`} />
          {label}
        </li>
      ))}
    </ul>
  );
}

export default function RegisterPage() {
  const navigate  = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isLoggedIn && user) {
      const isVendorOrRider = Boolean(
        user.role && (user.role.toLowerCase() === 'vendor' || user.role.toLowerCase() === 'rider')
      );
      if (!isVendorOrRider) {
        navigate('/', { replace: true });
      }
    }
  }, [isLoggedIn, user, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: RegisterForm) => {
    try {
      await authApi.register({
        first_name: data.first_name,
        last_name:  data.last_name,
        email:      data.email,
        phone:      data.phone,
        password:   data.password,
        role:       'consumer',
      });

      toast.success('Account created! Please sign in. 🎉');
      navigate('/login', { state: { phone: data.phone } });
    } catch (err: any) {

      // Backend returns field-level errors as an object
      const errData = err?.response?.data;
      if (errData && typeof errData === 'object') {
        const msgs = Object.entries(errData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
          .join('\n');
        toast.error(msgs || 'Registration failed');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex">

      {/* ── Left: Brand panel ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-12 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent-600/20 via-bg-base to-bg-base" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-600/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/onemed-logo.png" alt="OneMed" className="w-10 h-10 rounded-xl object-cover glow-primary" />
          <span className="font-head font-bold text-2xl text-content-primary">
            One<span className="text-primary-400">Med</span>
          </span>
        </div>

        {/* Centre */}
        <div className="relative z-10 space-y-6">
          <h1 className="font-head font-bold text-4xl text-content-primary leading-tight">
            Join thousands<br />
            of <span className="text-accent-400">healthy</span> customers
          </h1>
          <p className="text-content-secondary text-lg leading-relaxed">
            Create your free account and get medicines delivered to your doorstep — fast, safe, and reliable.
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { value: '10K+', label: 'Happy customers' },
              { value: '1000+', label: 'Products' },
              { value: '24/7', label: 'Support' },
              { value: '30min', label: 'Avg. delivery' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-bg-card/60 rounded-xl p-4 border border-bg-border">
                <p className="font-head font-bold text-2xl text-primary-400">{value}</p>
                <p className="text-content-muted text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-content-muted text-sm">
          © {new Date().getFullYear()} OneMed. All rights reserved.
        </p>
      </motion.div>

      {/* ── Right: Register form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg space-y-6 py-8"
        >
          {/* Back link */}
          <Link
            to="/login"
            id="back-to-login"
            className="inline-flex items-center gap-1.5 text-sm text-content-muted hover:text-content-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>

          {/* Heading */}
          <div className="space-y-1">
            <h2 className="font-head font-bold text-3xl text-content-primary">Create account</h2>
            <p className="text-content-secondary text-sm">
              Register as a consumer to start shopping
            </p>
          </div>

          {/* Form */}
          <form
            id="register-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="reg-first-name"
                label="First Name"
                placeholder="Rahim"
                icon={<User className="h-4 w-4" />}
                error={errors.first_name?.message}
                {...register('first_name')}
              />
              <Input
                id="reg-last-name"
                label="Last Name"
                placeholder="Uddin"
                error={errors.last_name?.message}
                {...register('last_name')}
              />
            </div>

            <Input
              id="reg-email"
              label="Email Address"
              type="email"
              placeholder="rahim@example.com"
              icon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              id="reg-phone"
              label="Phone Number"
              type="tel"
              placeholder="01XXXXXXXXX"
              icon={<Phone className="h-4 w-4" />}
              error={errors.phone?.message}
              {...register('phone')}
            />

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="text-sm font-medium text-content-secondary">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min 8 characters"
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
                  id="toggle-reg-password"
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
              <PasswordStrength password={passwordValue} />
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label htmlFor="reg-confirm" className="text-sm font-medium text-content-secondary">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  className={[
                    'w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-sans',
                    'bg-bg-card border text-content-primary placeholder:text-content-muted',
                    'focus:outline-none focus:ring-1 transition-colors',
                    errors.confirm
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-bg-border focus:border-primary-500 focus:ring-primary-500',
                  ].join(' ')}
                  {...register('confirm')}
                />
                <button
                  type="button"
                  id="toggle-confirm-password"
                  aria-label={showConfirm ? 'Hide' : 'Show'}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-secondary transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirm && (
                <p className="text-xs text-red-400">{errors.confirm.message}</p>
              )}
            </div>

            {/* Terms note */}
            <p className="text-xs text-content-muted">
              By registering you agree to our{' '}
              <span className="text-primary-400 cursor-pointer hover:underline">Terms of Service</span>
              {' '}and{' '}
              <span className="text-primary-400 cursor-pointer hover:underline">Privacy Policy</span>.
            </p>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              id="register-submit-btn"
            >
              {isSubmitting ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          {/* Sign in link */}
          <p className="text-center text-sm text-content-secondary">
            Already have an account?{' '}
            <Link
              to="/login"
              id="go-to-login"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
