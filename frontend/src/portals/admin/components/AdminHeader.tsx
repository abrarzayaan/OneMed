import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Palette,
  Menu,
  User,
  LogOut,
  Shield,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Package,
  Command,
  X,
  ExternalLink,
} from 'lucide-react';
import { useThemeStore, THEME_OPTIONS } from '@/store/theme.store';
import type { ThemeId } from '@/store/theme.store';
import { useAuthStore } from '@/store/auth.store';
import type { AdminNotification } from '../types/admin.types';

interface AdminHeaderProps {
  onOpenMobileSidebar: () => void;
}

const MOCK_NOTIFICATIONS: AdminNotification[] = [
  {
    id: 'n1',
    title: 'New Prescription Uploaded',
    message: 'Order #1089 requires prescription Rx verification.',
    type: 'rx',
    timestamp: '2 mins ago',
    isRead: false,
    actionUrl: '/admin/prescriptions',
  },
  {
    id: 'n2',
    title: 'Low Stock Alert',
    message: 'Napa Extra 500mg stock is below reorder threshold (12 left).',
    type: 'stock',
    timestamp: '15 mins ago',
    isRead: false,
    actionUrl: '/admin/inventory',
  },
  {
    id: 'n3',
    title: 'New Vendor Settlement Request',
    message: 'Lazz Pharma requested payout of ৳45,200.',
    type: 'order',
    timestamp: '1 hour ago',
    isRead: true,
    actionUrl: '/admin/vendors',
  },
];

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onOpenMobileSidebar }) => {
  const navigate = useNavigate();
  const { currentTheme, setTheme } = useThemeStore();
  const { user, logout } = useAuthStore();

  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<AdminNotification[]>(MOCK_NOTIFICATIONS);

  const themeRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Listen for Ctrl+K / Cmd+K for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setIsThemeOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-6 bg-bg-surface/85 backdrop-blur-md border-b border-bg-border shadow-sm">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-bg-hover lg:hidden transition-colors"
          title="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Instant Search Bar Input */}
        <div className="relative hidden md:block w-72 lg:w-96">
          <div
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border hover:border-primary-500/50 cursor-pointer text-content-muted transition-all shadow-inner"
          >
            <div className="flex items-center space-x-2 text-sm text-content-muted">
              <Search className="w-4 h-4 text-primary-400" />
              <span>Global Search (Order #, SKU, Vendor)...</span>
            </div>
            <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-bg-surface border border-bg-border text-[10px] font-mono text-content-muted">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Controls: Search Mobile Button, Theme Picker, Notifications, User Profile */}
      <div className="flex items-center space-x-2 lg:space-x-3">
        {/* Mobile Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="md:hidden p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Dynamic Theme Switcher Dropdown */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setIsThemeOpen((prev) => !prev)}
            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-bg-card border border-bg-border hover:border-primary-500/40 text-content-secondary hover:text-content-primary transition-all text-xs font-medium"
            title="Switch Visual System Theme"
          >
            <Palette className="w-4 h-4 text-primary-400" />
            <span className="hidden sm:inline capitalize">
              {THEME_OPTIONS.find((t) => t.id === currentTheme)?.name || 'Theme'}
            </span>
          </button>

          {isThemeOpen && (
            <div className="absolute right-0 mt-2 w-64 p-2 rounded-2xl bg-bg-surface border border-bg-border shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-3 py-2 text-xs font-bold text-content-muted uppercase tracking-wider font-mono border-b border-bg-border mb-1">
                System Visual Themes
              </div>
              <div className="space-y-1">
                {THEME_OPTIONS.map((theme) => {
                  const isSelected = currentTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setTheme(theme.id);
                        setIsThemeOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                          : 'hover:bg-bg-hover text-content-secondary'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm flex-shrink-0"
                          style={{ backgroundColor: theme.preview.primary }}
                        />
                        <div>
                          <div className="text-xs font-semibold text-content-primary">{theme.name}</div>
                          <div className="text-[10px] text-content-muted">{theme.tagline}</div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Real-Time Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative p-2 rounded-xl text-content-secondary hover:text-content-primary hover:bg-bg-hover transition-colors"
            title="System Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-rose-500 text-[10px] font-mono font-bold text-white shadow-glow">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-bg-surface border border-bg-border shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-4 py-3 bg-bg-base/40 border-b border-bg-border">
                <div className="flex items-center space-x-2">
                  <span className="font-head font-bold text-sm text-content-primary">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-mono font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary-400 hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-bg-border">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-content-muted text-xs">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.actionUrl) navigate(n.actionUrl);
                        setIsNotifOpen(false);
                      }}
                      className={`p-3.5 flex items-start space-x-3 cursor-pointer hover:bg-bg-hover transition-colors ${
                        !n.isRead ? 'bg-primary-500/5' : ''
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-bg-card border border-bg-border text-primary-400 flex-shrink-0 mt-0.5">
                        {n.type === 'rx' ? (
                          <FileText className="w-4 h-4 text-rose-400" />
                        ) : n.type === 'stock' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Package className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-content-primary truncate">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-content-muted font-mono">{n.timestamp}</span>
                        </div>
                        <p className="text-xs text-content-secondary mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-bg-hover transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center text-white font-bold font-head text-sm shadow-glow">
              {user?.first_name ? user.first_name[0].toUpperCase() : 'A'}
            </div>
            <div className="hidden xl:flex flex-col text-left min-w-0">
              <span className="text-xs font-bold text-content-primary truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Super Admin'}
              </span>
              <span className="text-[10px] text-primary-400 font-mono flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" /> SUPER USER
              </span>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 p-2 rounded-2xl bg-bg-surface border border-bg-border shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 bg-bg-base/50 rounded-xl border border-bg-border mb-2">
                <p className="text-xs font-bold text-content-primary">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'OneMed Admin'}
                </p>
                <p className="text-[11px] text-content-muted font-mono truncate">{user?.email || 'admin@onemed.com'}</p>
                <span className="mt-2 inline-block px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold border border-emerald-500/30">
                  FULL SYSTEM SCOPE
                </span>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    navigate('/admin/rbac');
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-content-secondary hover:text-content-primary hover:bg-bg-hover transition-colors"
                >
                  <User className="w-4 h-4 text-primary-400" />
                  <span>Manage Profile & Staff Roles</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/');
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-content-secondary hover:text-content-primary hover:bg-bg-hover transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-accent-400" />
                  <span>Open Consumer Portal</span>
                </button>
                <div className="border-t border-bg-border my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout from Admin Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Command Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4">
          <div className="w-full max-w-2xl bg-bg-surface border border-bg-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center px-4 border-b border-bg-border bg-bg-base/40">
              <Search className="w-5 h-5 text-primary-400 mr-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, SKU, phone number, vendor, or customer..."
                className="w-full py-4 bg-transparent text-content-primary placeholder-content-muted outline-none text-sm font-medium"
                autoFocus
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-bg-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="text-xs font-mono font-bold text-content-muted uppercase tracking-wider mb-2">
                Quick Command Shortcuts
              </div>
              <div className="space-y-1">
                {[
                  { label: 'View Pending Prescription Queue', path: '/admin/prescriptions', badge: 'Rx Review' },
                  { label: 'Fulfill & Assign Vendor Orders', path: '/admin/orders', badge: 'Orders' },
                  { label: 'Update Dynamic Variant Discounts', path: '/admin/catalog', badge: 'Pricing' },
                  { label: 'Configure Homepage Banners & CMS', path: '/admin/cms', badge: 'CMS' },
                  { label: 'Generic Database Model Explorer', path: '/admin/explorer', badge: 'CRUD' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      navigate(item.path);
                      setIsSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-bg-hover cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-medium text-content-primary">{item.label}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-500/20 text-primary-400 border border-primary-500/30">
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
