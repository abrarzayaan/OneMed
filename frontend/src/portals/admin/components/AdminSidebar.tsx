import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  FileCheck2,
  Package,
  Boxes,
  Sparkles,
  Percent,
  Building2,
  Truck,
  Bike,
  ShieldCheck,
  Database,
  History,
  ChevronLeft,
  ChevronRight,
  Pill,
  ShieldAlert,
  Sliders,
  PlusCircle,
} from 'lucide-react';
import type { NavGroup } from '../types/admin.types';

import { useAuthStore } from '@/store/auth.store';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    groupTitle: 'Core Operations',
    items: [
      { id: 'dashboard', label: 'Executive Dashboard', path: '/admin', iconName: 'LayoutDashboard' },
      { id: 'orders', label: 'Order Fulfillment Hub', path: '/admin/orders', iconName: 'ShoppingCart', badge: '12', badgeColor: 'indigo' },
      { id: 'prescriptions', label: 'Prescription Rx Queue', path: '/admin/prescriptions', iconName: 'FileCheck2', badge: '5', badgeColor: 'rose' },
    ],
  },
  {
    groupTitle: 'Catalog & Pricing',
    items: [
      { id: 'creation', label: 'Master Creation Hub', path: '/admin/creation', iconName: 'PlusCircle', badge: 'NEW', badgeColor: 'emerald' },
      { id: 'catalog', label: 'Catalog & Variant Discounts', path: '/admin/catalog', iconName: 'Package' },
      { id: 'inventory', label: 'Inventory & Stock Alerts', path: '/admin/inventory', iconName: 'Boxes', badge: '3', badgeColor: 'amber' },
    ],
  },
  {
    groupTitle: 'CMS & Marketing',
    items: [
      { id: 'cms', label: 'CMS & Hero Controller', path: '/admin/cms', iconName: 'Sparkles' },
      { id: 'promotions', label: 'Coupons & Flash Sales', path: '/admin/promotions', iconName: 'Percent' },
    ],
  },
  {
    groupTitle: 'Vendors & Logistics',
    items: [
      { id: 'vendor-verification', label: 'Vendor Verification', path: '/admin/vendor-verification', iconName: 'ShieldCheck', badge: 'NEW', badgeColor: 'amber' },
      { id: 'rider-verification', label: 'Rider Verification', path: '/admin/rider-verification', iconName: 'Bike', badge: 'NEW', badgeColor: 'cyan' },
      { id: 'vendors', label: 'Vendor Payout Ledger', path: '/admin/vendors', iconName: 'Building2' },
      { id: 'logistics', label: 'Fleet & Rider Tracking', path: '/admin/logistics', iconName: 'Truck' },
    ],
  },
  {
    groupTitle: 'System & Security',
    items: [
      { id: 'rbac', label: 'Staff Roles & RBAC', path: '/admin/rbac', iconName: 'ShieldCheck' },
      { id: 'explorer', label: 'Generic Model Explorer', path: '/admin/explorer', iconName: 'Database' },
      { id: 'audit-logs', label: 'Audit & Security Logs', path: '/admin/audit-logs', iconName: 'History' },
    ],
  },
];

const renderIcon = (iconName: string) => {
  const props = { className: 'w-5 h-5 flex-shrink-0 transition-colors duration-200' };
  switch (iconName) {
    case 'LayoutDashboard': return <LayoutDashboard {...props} />;
    case 'ShoppingCart': return <ShoppingCart {...props} />;
    case 'FileCheck2': return <FileCheck2 {...props} />;
    case 'Package': return <Package {...props} />;
    case 'Boxes': return <Boxes {...props} />;
    case 'Sparkles': return <Sparkles {...props} />;
    case 'Percent': return <Percent {...props} />;
    case 'Building2': return <Building2 {...props} />;
    case 'Truck': return <Truck {...props} />;
    case 'Bike': return <Bike {...props} />;
    case 'ShieldCheck': return <ShieldCheck {...props} />;
    case 'Database': return <Database {...props} />;
    case 'History': return <History {...props} />;
    case 'PlusCircle': return <PlusCircle {...props} />;
    default: return <Sliders {...props} />;
  }
};

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const isSuperAdmin = Boolean(user?.is_superuser || user?.role === 'SUPERADMIN');
  const userPerms = user?.permissions || {};

  // Filter Nav Groups based on dynamic permissions
  const filteredNavGroups = ADMIN_NAV_GROUPS.map((group) => {
    const visibleItems = group.items.filter((item) => {
      if (isSuperAdmin) return true;
      if (item.id === 'dashboard') return true;
      return Boolean(userPerms[item.id]);
    });
    return { ...group, items: visibleItems };
  }).filter((group) => group.items.length > 0);

  const getBadgeStyle = (color?: string) => {
    switch (color) {
      case 'rose':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'amber':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'indigo':
        return 'bg-primary-500/20 text-primary-400 border-primary-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Main Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-bg-surface border-r border-bg-border transition-all duration-300 shadow-2xl lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-72'}`}
      >
        {/* Header Branding */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-bg-border bg-bg-base/40">
          <div className="flex items-center space-x-3 overflow-hidden">
            <img src="/onemed-logo.png" alt="OneMed" className="w-10 h-10 rounded-xl object-cover shadow-glow flex-shrink-0" />
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-head font-bold text-lg text-content-primary tracking-tight truncate flex items-center gap-1.5">
                  OneMed <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 font-mono font-semibold border border-primary-500/30">ADMIN</span>
                </span>
                <span className="text-xs text-content-muted truncate font-mono">
                  {user?.staff_role || (isSuperAdmin ? 'Super Admin' : 'Staff Admin')}
                </span>
              </div>
            )}
          </div>

          {/* Desktop Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Modules Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-bg-border">
          {filteredNavGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[11px] font-bold text-content-muted uppercase tracking-wider font-mono">
                  {group.groupTitle}
                </div>
              )}
              {group.items.map((item) => {
                const isActive =
                  item.path === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/10 text-primary-400 border border-primary-500/30 shadow-glow font-semibold'
                        : 'text-content-secondary hover:text-content-primary hover:bg-bg-hover'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={isActive ? 'text-primary-400' : 'text-content-muted group-hover:text-content-primary'}>
                        {renderIcon(item.iconName)}
                      </div>
                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold border ${getBadgeStyle(
                          item.badgeColor
                        )}`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip hint when collapsed */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-bg-surface border border-bg-border text-content-primary text-xs font-medium whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                        {item.label}
                        {item.badge && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 font-mono">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer System Status */}
        <div className="p-3 border-t border-bg-border bg-bg-base/30">
          {!isCollapsed ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-bg-card border border-bg-border">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-content-primary">System Online</span>
                  <span className="text-[10px] text-content-muted font-mono">API: Connected (DRF)</span>
                </div>
              </div>
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
            </div>
          ) : (
            <div className="flex justify-center p-2" title="System Online (API Connected)">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
