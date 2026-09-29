import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Save,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Phone,
  MessageSquare,
  Power,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { settingsApi, type WhatsAppSetting } from '@/api/settings.api';

export const SystemSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const isSuperAdmin = Boolean(
    user?.is_superuser || user?.role === 'SUPERADMIN'
  );

  // Fetch current WhatsApp settings
  const { data: setting, isLoading, isError, refetch } = useQuery<WhatsAppSetting>({
    queryKey: ['system-settings', 'whatsapp'],
    queryFn: () => settingsApi.getWhatsAppSetting(),
    enabled: isSuperAdmin,
  });

  // Local form state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [defaultMessage, setDefaultMessage] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);

  // Sync state when data is loaded
  useEffect(() => {
    if (setting) {
      setPhoneNumber(setting.whatsapp_support_number || '');
      setDefaultMessage(setting.whatsapp_default_message || '');
      setIsEnabled(setting.is_whatsapp_enabled ?? true);
    }
  }, [setting]);

  // Mutation for updating settings
  const updateMutation = useMutation({
    mutationFn: (data: Partial<WhatsAppSetting>) =>
      settingsApi.updateWhatsAppSetting(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['system-settings', 'whatsapp'], updated);
      queryClient.invalidateQueries({ queryKey: ['system-settings', 'whatsapp'] });
      toast.success('WhatsApp support configuration saved successfully!');
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to update WhatsApp support settings.';
      toast.error(msg);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error('WhatsApp support number cannot be empty.');
      return;
    }
    updateMutation.mutate({
      whatsapp_support_number: phoneNumber.trim(),
      whatsapp_default_message: defaultMessage.trim(),
      is_whatsapp_enabled: isEnabled,
    });
  };

  // Compute live test link
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  const encodedMsg = encodeURIComponent(defaultMessage);
  const livePreviewLink = cleanNumber
    ? `https://wa.me/${cleanNumber}?text=${encodedMsg}`
    : '#';

  // Super Admin security block
  if (!isSuperAdmin) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-content-primary">
              Super Admin Clearance Required
            </h2>
            <p className="text-sm text-content-secondary mt-1 max-w-md mx-auto">
              System Settings & Dynamic WhatsApp Support configuration is restricted strictly to
              authenticated <strong>Super Administrators</strong>.
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-mono bg-red-500/20 text-red-300 border border-red-500/40">
              HTTP 403 Forbidden - Role: {user?.role || 'Restricted Staff'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── HEADER TITLE & CONTROLS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-bg-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase bg-primary-500/20 text-primary-400 border border-primary-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> System Configuration
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
              Super Admin Only
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-head text-content-primary tracking-tight">
            WhatsApp Support & Helpline
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-0.5">
            Dynamically control customer support contact numbers, pre-filled welcome text, and button visibility across all portals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border hover:border-primary-500/50 text-content-secondary hover:text-content-primary text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
          <a
            href={livePreviewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs font-bold transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Test WhatsApp Link</span>
          </a>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-content-muted">Fetching latest system parameters...</p>
        </div>
      ) : isError ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-sm font-semibold text-red-300">Failed to load system settings from backend.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-bold"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── LEFT: CONFIGURATION FORM ── */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSave} className="bg-bg-card border border-bg-border rounded-2xl p-5 sm:p-6 shadow-card space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-bg-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 fill-emerald-500/20" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-content-primary">
                      Contact Number Parameters
                    </h3>
                    <p className="text-[11px] text-content-muted">
                      Direct WhatsApp API endpoint target configuration
                    </p>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-content-muted'
                    }`}
                  />
                  <span className="text-xs font-mono font-semibold text-content-secondary">
                    {isEnabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
              </div>

              {/* Master Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-bg-surface border border-bg-border">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-content-primary flex items-center gap-1.5">
                    <Power className="w-3.5 h-3.5 text-primary-400" />
                    Enable WhatsApp Support Feature
                  </span>
                  <p className="text-[11px] text-content-muted">
                    When enabled, the floating WhatsApp launcher and header helpline are visible to consumers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEnabled((v) => !v)}
                  className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none ${
                    isEnabled ? 'bg-emerald-500' : 'bg-bg-border'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* WhatsApp Support Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-content-secondary uppercase tracking-wider font-mono">
                  WhatsApp Support Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+880 1334-317864"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm font-mono text-content-primary placeholder:text-content-muted transition-all"
                  />
                </div>
                <p className="text-[11px] text-content-muted">
                  Must include country code (e.g., <code className="text-primary-400">+880 1334-317864</code> or <code className="text-primary-400">8801334317864</code>). Special characters and spaces will be sanitized automatically.
                </p>
              </div>

              {/* Default Welcome Message */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-content-secondary uppercase tracking-wider font-mono">
                  Default Pre-filled Chat Message
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-content-muted absolute left-3.5 top-3" />
                  <textarea
                    rows={3}
                    value={defaultMessage}
                    onChange={(e) => setDefaultMessage(e.target.value)}
                    placeholder="Hello OneMed Support, I need assistance with an order."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm text-content-primary placeholder:text-content-muted transition-all resize-none"
                  />
                </div>
                <p className="text-[11px] text-content-muted flex items-center justify-between">
                  <span>Pre-populates the customer's text box when WhatsApp opens.</span>
                  <span className="font-mono text-primary-400">{defaultMessage.length} chars</span>
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-between border-t border-bg-border">
                <div className="flex items-center gap-1.5 text-xs text-content-muted">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Last updated:{' '}
                    {setting?.updated_at
                      ? new Date(setting.updated_at).toLocaleString()
                      : 'Never'}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold text-xs shadow-glow transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Save className={`w-4 h-4 ${updateMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>{updateMutation.isPending ? 'Saving...' : 'Save Configuration'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* ── RIGHT: LIVE CONSUMER PREVIEW CARD ── */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-bg-card border border-bg-border rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-bg-border">
                <h3 className="font-bold text-sm text-content-primary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Live Consumer Preview
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-surface text-content-muted border border-bg-border">
                  Real-time Simulation
                </span>
              </div>

              {/* Header Need Help Preview */}
              <div className="p-3 rounded-xl bg-bg-surface border border-bg-border space-y-2">
                <p className="text-[11px] font-bold text-content-muted uppercase font-mono">
                  Header Helpline Preview:
                </p>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-bg-base border border-bg-border">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 fill-emerald-500/20" />
                  </div>
                  <div className="text-left leading-tight">
                    <span className="text-[9px] text-content-muted uppercase font-semibold flex items-center gap-1">
                      WhatsApp Help
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    </span>
                    <p className="text-xs font-extrabold text-content-primary">
                      {phoneNumber || '+880 1334-317864'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating Widget Preview */}
              <div className="p-3 rounded-xl bg-bg-surface border border-bg-border space-y-3">
                <p className="text-[11px] font-bold text-content-muted uppercase font-mono">
                  Floating Button Preview:
                </p>
                <div className="p-4 rounded-xl bg-bg-base border border-bg-border flex flex-col items-center justify-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/40 text-xs font-bold">
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Live Support</span>
                  </div>
                  <span className="text-[10px] text-content-muted">
                    {isEnabled
                      ? '✓ Widget active on consumer screens'
                      : '✕ Widget currently hidden on consumer screens'}
                  </span>
                </div>
              </div>

              {/* Generated URL Breakdown */}
              <div className="p-3 rounded-xl bg-bg-surface border border-bg-border space-y-1.5 text-xs">
                <span className="text-[10px] font-bold text-content-muted uppercase font-mono">
                  Generated WhatsApp Deep Link:
                </span>
                <div className="p-2 rounded bg-bg-base border border-bg-border text-[11px] font-mono break-all text-emerald-400">
                  {livePreviewLink}
                </div>
              </div>

              {/* Security info note */}
              <div className="p-3 rounded-xl bg-primary-500/5 border border-primary-500/20 text-xs text-content-secondary space-y-1">
                <div className="flex items-center gap-1.5 text-primary-400 font-bold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Audit Trail Enforced
                </div>
                <p className="text-[11px] text-content-muted">
                  Every change to this phone number is permanently recorded in the System Security Audit Log along with your Super Admin username and IP address.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettingsPage;
