import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, MapPin, Package, Heart, LogOut, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function AccountSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { label: 'My Profile', href: '/account/profile', icon: <User className="w-4 h-4" /> },
    { label: 'Delivery Addresses', href: '/account/addresses', icon: <MapPin className="w-4 h-4" /> },
    { label: 'My Orders', href: '/account/orders', icon: <Package className="w-4 h-4" /> },
    { label: 'Saved Wishlist', href: '/wishlist', icon: <Heart className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-6">
      {/* User Info Card */}
      <div className="bg-bg-card border border-bg-border rounded-3xl p-6 flex items-center gap-4 shadow-card">
        <div className="w-14 h-14 rounded-2xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400 font-head font-extrabold text-xl shrink-0">
          {user?.first_name ? user.first_name[0].toUpperCase() : user?.phone ? user.phone.slice(-2) : 'U'}
        </div>
        <div className="min-w-0 space-y-0.5">
          <h3 className="font-head font-bold text-sm text-content-primary truncate">
            {user?.first_name || user?.last_name
              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
              : 'Valued Customer'}
          </h3>
          <p className="text-[11px] font-mono text-content-muted truncate">
            {user?.phone || user?.email || 'Consumer Account'}
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold pt-0.5">
            <ShieldCheck className="w-3 h-3" /> Verified Consumer
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="bg-bg-card border border-bg-border rounded-3xl p-3 shadow-card space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-primary-600 text-white shadow-glow'
                  : 'text-content-secondary hover:text-content-primary hover:bg-bg-surface'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-left mt-2 border-t border-bg-border/60"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
