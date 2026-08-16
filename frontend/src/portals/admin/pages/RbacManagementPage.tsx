import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Users,
  Search,
  Lock,
  Edit3,
  Trash2,
  Key,
  Sliders,
  CheckCircle2,
  XCircle,
  Plus,
  Sparkles,
  Filter,
  ShieldAlert,
  Phone,
  Mail,
  UserPlus,
  RefreshCw,
  Check,
  Shield,
  Layers,
  History,
  Eye,
  Edit,
  LayoutDashboard,
  ShoppingCart,
  FileCheck2,
  Package,
  Boxes,
  Percent,
  Building2,
  Truck,
  Database,
  PlusCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminRbacApi } from '../api/adminRbac.api';
import type {
  StaffRole as AdminRole,
  StaffUser,
  SecurityAuditLog as AuditLog,
  PermissionLevel,
} from '../api/adminRbac.api';

// Super Admin Menu Sections (Matches AdminSidebar.tsx exactly)
export const SUPER_ADMIN_MENU_SECTIONS = [
  {
    groupTitle: 'Core Operations',
    icon: LayoutDashboard,
    modules: [
      { key: 'dashboard', label: 'Executive Dashboard', desc: 'Real-time revenue KPIs & operational summary' },
      { key: 'orders', label: 'Order Fulfillment Hub', desc: 'Manage customer orders, status & dispatch' },
      { key: 'prescriptions', label: 'Prescription Rx Queue', desc: 'Verify customer uploaded prescriptions' },
    ],
  },
  {
    groupTitle: 'Catalog & Pricing',
    icon: Package,
    modules: [
      { key: 'creation', label: 'Master Creation Hub', desc: 'Create products, generics, brands & categories' },
      { key: 'catalog', label: 'Catalog & Variant Discounts', desc: 'Product catalog prices, discounts & stock' },
      { key: 'inventory', label: 'Inventory & Stock Alerts', desc: 'Warehouse inventory batches & expiry tracking' },
    ],
  },
  {
    groupTitle: 'CMS & Marketing',
    icon: Sparkles,
    modules: [
      { key: 'cms', label: 'CMS & Hero Controller', desc: 'Homepage hero banners & health tip cards' },
      { key: 'promotions', label: 'Coupons & Flash Sales', desc: 'Manage promotional coupons & discounts' },
    ],
  },
  {
    groupTitle: 'Vendors & Logistics',
    icon: Building2,
    modules: [
      { key: 'vendor-verification', label: 'Vendor Verification', desc: 'Review & approve new vendor applications' },
      { key: 'vendors', label: 'Vendor Payout Ledger', desc: 'Vendor directory, commission & payout ledgers' },
      { key: 'logistics', label: 'Fleet & Rider Tracking', desc: 'Logistics fleet & live rider delivery dispatch' },
    ],
  },
  {
    groupTitle: 'System & Security',
    icon: ShieldCheck,
    modules: [
      { key: 'rbac', label: 'Staff Roles & RBAC', desc: 'Configure staff roles & module access levels' },
      { key: 'explorer', label: 'Generic Model Explorer', desc: 'Direct database table browser & raw model viewer' },
      { key: 'audit-logs', label: 'Audit & Security Logs', desc: 'System security logs & admin activity trails' },
    ],
  },
];

// Flattened modules list helper
const ALL_FLAT_MODULES = SUPER_ADMIN_MENU_SECTIONS.flatMap((sec) => sec.modules);

export const RbacManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'audit'>('users');

  const LOCAL_STORAGE_KEY = 'onemed_admin_roles_v1';
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

  // Selected user for editing role
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<number>(1);
  const [savingUserRole, setSavingUserRole] = useState(false);

  // Modal: Create / Edit Role
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [roleFormName, setRoleFormName] = useState('');
  const [roleFormDesc, setRoleFormDesc] = useState('');
  const [roleFormPermissions, setRoleFormPermissions] = useState<Record<string, PermissionLevel>>({});
  const [savingRole, setSavingRole] = useState(false);

  // Modal: Create Admin User (Matches Registration Form + Admin Role)
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [userFormFirstName, setUserFormFirstName] = useState('');
  const [userFormLastName, setUserFormLastName] = useState('');
  const [userFormPhone, setUserFormPhone] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  // Load live DB data from Django API
  const loadData = async (query = '') => {
    if (query) setSearching(true);
    else setLoading(true);

    try {
      const [rData, sData, aData] = await Promise.all([
        adminRbacApi.getRoles(),
        adminRbacApi.getStaffUsers(query),
        adminRbacApi.getAuditLogs(),
      ]);
      setRoles(rData);
      setStaffUsers(sData);
      setAuditLogs(aData);
    } catch (err) {
      toast.error('Failed to load RBAC data from Database API');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Search Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(searchQuery);
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    loadData('');
  };

  // Open Edit User Role Modal
  const handleOpenUserMatrix = (user: StaffUser) => {
    setSelectedUser(user);
    setEditingRoleId(user.role_id || 1);
  };

  // Save user's assigned role in DB
  const handleSaveUserRole = async () => {
    if (!selectedUser) return;
    setSavingUserRole(true);
    try {
      const updated = await adminRbacApi.updateStaffUserRole(selectedUser.id, editingRoleId);
      toast.success(`Role updated in DB for user '${selectedUser.username || selectedUser.full_name}'!`);
      
      setStaffUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, ...updated } : u))
      );
      setSelectedUser(null);
      loadData(searchQuery);
    } catch (err) {
      toast.error('Failed to update user role in DB');
    } finally {
      setSavingUserRole(false);
    }
  };

  // Toggle user status (ACTIVE / SUSPENDED)
  const handleToggleUserStatus = async (user: StaffUser) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await adminRbacApi.updateStaffStatus(user.id, newStatus);
      toast.success(`User '${user.username || user.full_name}' is now ${newStatus}`);
      setStaffUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  // Create Admin User Submit (Registration fields + Assigned Role: Admin)
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormPhone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    if (!userFormPassword.trim()) {
      toast.error('Password is required');
      return;
    }

    // Find "Admin" role or fallback to first non-superadmin role
    const adminRole = roles.find((r) => r.name.toLowerCase() === 'admin' || (r.name.toLowerCase().includes('admin') && r.name !== 'Super Admin')) || roles[0];

    setCreatingUser(true);
    try {
      await adminRbacApi.createStaffUser({
        first_name: userFormFirstName.trim(),
        last_name: userFormLastName.trim(),
        phone_number: userFormPhone.trim(),
        username: userFormPhone.trim(),
        email: userFormEmail.trim(),
        password: userFormPassword,
        role_id: adminRole ? adminRole.id : 5,
      });
      toast.success(`Admin User created in database with role '${adminRole?.name || 'Admin'}'!`);
      setIsCreateUserModalOpen(false);
      setUserFormFirstName('');
      setUserFormLastName('');
      setUserFormPhone('');
      setUserFormEmail('');
      setUserFormPassword('');
      loadData(searchQuery);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.detail || 'Failed to create Admin User in DB';
      toast.error(serverMsg);
    } finally {
      setCreatingUser(false);
    }
  };

  // Open Modal to Create new Role
  const handleOpenCreateRole = () => {
    setSelectedRole(null);
    setRoleFormName('');
    setRoleFormDesc('');
    const defaultPerms: Record<string, PermissionLevel> = {};
    ALL_FLAT_MODULES.forEach((m) => {
      defaultPerms[m.key] = 'NONE';
    });
    setRoleFormPermissions(defaultPerms);
    setIsRoleModalOpen(true);
  };

  // Open Modal to Edit existing Role
  const handleOpenEditRole = (role: AdminRole) => {
    setSelectedRole(role);
    setRoleFormName(role.name);
    setRoleFormDesc(role.description);
    const existingPerms = (role.permissions as any) || {};
    const normPerms: Record<string, PermissionLevel> = {};
    ALL_FLAT_MODULES.forEach((m) => {
      const val = existingPerms[m.key];
      if (val === 'FULL' || val === true || val === 'write') normPerms[m.key] = 'FULL';
      else if (val === 'READ' || val === 'read') normPerms[m.key] = 'READ';
      else normPerms[m.key] = 'NONE';
    });
    setRoleFormPermissions(normPerms);
    setIsRoleModalOpen(true);
  };

  // Save Role (Create or Update in DB)
  const handleSaveRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleFormName.trim()) {
      toast.error('Role name is required');
      return;
    }

    setSavingRole(true);
    try {
      if (selectedRole) {
        await adminRbacApi.updateRole(selectedRole.id, {
          name: roleFormName.trim(),
          description: roleFormDesc.trim(),
          permissions: roleFormPermissions as any,
        });
        toast.success(`Role '${roleFormName}' updated in database!`);
      } else {
        await adminRbacApi.createRole({
          name: roleFormName.trim(),
          description: roleFormDesc.trim(),
          permissions: roleFormPermissions as any,
          is_system: false,
        });
        toast.success(`Custom Role '${roleFormName}' created in database!`);
      }
      setIsRoleModalOpen(false);
      loadData(searchQuery);
    } catch (err) {
      toast.error('Failed to save Role in database');
    } finally {
      setSavingRole(false);
    }
  };

  // Toggle Permission Level for module in Role Form
  const setModuleLevel = (moduleKey: string, level: PermissionLevel) => {
    setRoleFormPermissions((prev) => ({
      ...prev,
      [moduleKey]: level,
    }));
  };

  // Helper to determine exact module permission level (FULL, READ, NONE) for a user or role
  const getUserModulePermissionLevel = (user: StaffUser, moduleKey: string): PermissionLevel => {
    if (user.is_superuser || user.role_name === 'Super Admin') return 'FULL';
    const userPerms = user.permissions || {};
    const val = userPerms[moduleKey];
    if (val === 'FULL' || val === true || val === 'write') return 'FULL';
    if (val === 'READ' || val === 'read') return 'READ';
    return 'NONE';
  };

  const getRoleModuleLevel = (role: AdminRole, moduleKey: string): PermissionLevel => {
    if (role.is_system && role.name === 'Super Admin') return 'FULL';
    const perms = (role.permissions as any) || {};
    const val = perms[moduleKey];
    if (val === 'FULL' || val === true || val === 'write') return 'FULL';
    if (val === 'READ' || val === 'read') return 'READ';
    return 'NONE';
  };

  return (
    <div className="space-y-8 pb-12 font-sans text-content-primary">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-bg-card border border-bg-border shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary-400" />
            <h1 className="text-2xl font-head font-extrabold tracking-tight">
              Database Admin RBAC Management
            </h1>
          </div>
          <p className="text-xs text-content-muted">
            Manage live Database Admin Users, search accounts by username or phone number, and assign Super Admin menu permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(searchQuery)}
            className="p-2.5 rounded-2xl bg-bg-surface border border-bg-border hover:border-primary-500/50 text-content-secondary hover:text-primary-400 transition-all shadow-sm"
            title="Refresh Live DB Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateRole}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-bg-surface border border-primary-500/30 hover:bg-primary-500/10 text-primary-400 font-bold text-xs transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Role</span>
          </button>

          <button
            onClick={() => setIsCreateUserModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-glow transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Admin User</span>
          </button>
        </div>
      </div>

      {/* ── Search & Navigation Tabs Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center p-1.5 rounded-2xl bg-bg-card border border-bg-border w-fit shadow-md">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'users'
                ? 'bg-primary-500 text-white shadow-glow'
                : 'text-content-secondary hover:text-content-primary hover:bg-bg-surface'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Admin Users ({staffUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'roles'
                ? 'bg-primary-500 text-white shadow-glow'
                : 'text-content-secondary hover:text-content-primary hover:bg-bg-surface'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Staff Roles ({roles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'audit'
                ? 'bg-primary-500 text-white shadow-glow'
                : 'text-content-secondary hover:text-content-primary hover:bg-bg-surface'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Logs ({auditLogs.length})</span>
          </button>
        </div>

        {/* Live Database Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Username, Phone Number..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-bg-card border border-bg-border focus:border-primary-500 text-xs font-mono text-content-primary placeholder:text-content-muted outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2.5 rounded-2xl bg-bg-surface border border-primary-500/30 hover:bg-primary-500/10 text-primary-400 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
          >
            {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Search DB</span>
          </button>
        </form>
      </div>

      {/* ── Main Tab Contents ── */}
      {loading ? (
        <div className="py-20 text-center space-y-4">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto text-primary-400" />
          <p className="text-xs font-mono text-content-muted">Fetching Live RBAC Data from Database...</p>
        </div>
      ) : activeTab === 'users' ? (
        /* ────────────── TAB 1: ADMIN USERS LIST ────────────── */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {staffUsers.length === 0 ? (
              <div className="col-span-full py-16 text-center space-y-3 bg-bg-card border border-bg-border rounded-3xl">
                <Users className="w-12 h-12 text-content-muted mx-auto" />
                <h3 className="text-base font-bold text-content-primary">No Admin Users Found</h3>
                <p className="text-xs text-content-muted max-w-sm mx-auto">
                  No admin users matched your search "{searchQuery}". Click "Create Admin User" to add a new admin account.
                </p>
                <button
                  onClick={() => setIsCreateUserModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-primary-500 text-white text-xs font-bold shadow-glow"
                >
                  + Create Admin User
                </button>
              </div>
            ) : (
              staffUsers.map((u) => {
                const isSuper = u.is_superuser || u.role_name === 'Super Admin';
                return (
                  <div
                    key={u.id}
                    className="p-6 rounded-3xl bg-bg-card border border-bg-border hover:border-primary-500/40 transition-all shadow-xl space-y-6 flex flex-col justify-between group"
                  >
                    <div className="space-y-5">
                      {/* User Avatar & Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-primary-600/20 border border-primary-500/40 flex items-center justify-center font-head font-extrabold text-primary-400 text-lg uppercase shadow-inner">
                            {(u.username || u.full_name || 'A')[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-head font-bold text-base text-content-primary group-hover:text-primary-400 transition-colors">
                                {u.username || u.full_name}
                              </h3>
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                isSuper
                                  ? 'bg-primary-500/20 text-primary-300 border-primary-500/40'
                                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                              }`}>
                                {u.role_name}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono text-content-muted flex items-center gap-1.5 mt-1">
                              <Phone className="w-3 h-3 text-primary-400" /> Username / Phone: <strong className="text-content-primary">{u.phone_number || u.username}</strong>
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {u.status}
                        </span>
                      </div>

                      {/* Super Admin Menu Permissions Breakdown for this User */}
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between border-b border-bg-border pb-2">
                          <h4 className="text-xs font-bold text-content-muted uppercase tracking-wider flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-primary-400" />
                            <span>Super Admin Menu Access Scope</span>
                          </h4>
                          <span className="text-[10px] font-mono text-primary-400 font-bold">
                            {isSuper ? 'UNRESTRICTED ACCESS' : 'ROLE GOVERNED'}
                          </span>
                        </div>

                        {/* Grouped by the 5 Super Admin Menu Sections */}
                        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                          {SUPER_ADMIN_MENU_SECTIONS.map((sec) => {
                            const SectionIcon = sec.icon;
                            return (
                              <div key={sec.groupTitle} className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-content-secondary">
                                  <SectionIcon className="w-3.5 h-3.5 text-primary-400" />
                                  <span>{sec.groupTitle}</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {sec.modules.map((m) => {
                                    const level = getUserModulePermissionLevel(u, m.key);
                                    return (
                                      <div
                                        key={m.key}
                                        className={`p-2 rounded-xl border text-[10px] font-mono flex items-center justify-between transition-all ${
                                          level === 'FULL'
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                            : level === 'READ'
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                            : 'bg-bg-surface border-bg-border text-content-muted opacity-50'
                                        }`}
                                      >
                                        <span className="truncate pr-1 font-bold">{m.label}</span>
                                        <span className="font-extrabold text-[9px] px-1.5 py-0.5 rounded">
                                          {level === 'FULL' ? 'CAN VIEW & EDIT' : level === 'READ' ? 'CAN VIEW ONLY' : 'NO ACCESS'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-bg-border flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenUserMatrix(u)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 font-bold text-xs border border-primary-500/30 transition-all shadow-sm"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Edit User Assigned Role</span>
                      </button>

                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        className={`p-2.5 rounded-xl border transition-all text-xs font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}
                        title={u.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : activeTab === 'roles' ? (
        /* ────────────── TAB 2: STAFF ROLES FROM DB ────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {roles.map((r) => (
            <div
              key={r.id}
              className="p-6 rounded-3xl bg-bg-card border border-bg-border hover:border-primary-500/40 transition-all shadow-xl space-y-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary-400" />
                    <h3 className="font-head font-bold text-lg text-content-primary">{r.name}</h3>
                    {r.is_system && (
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        System Role
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-content-muted">{r.description || 'Database staff role configuration'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenEditRole(r)}
                    className="p-2 rounded-xl bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 border border-primary-500/30 text-xs font-bold transition-all flex items-center gap-1"
                    title="Edit Role Permissions"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Permissions</span>
                  </button>
                </div>
              </div>

              {/* Module Permissions Breakdown Grouped by Super Admin Menu Sections */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-content-muted uppercase tracking-wider">Super Admin Menu Access Scope</h4>
                
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {SUPER_ADMIN_MENU_SECTIONS.map((sec) => {
                    const SectionIcon = sec.icon;
                    return (
                      <div key={sec.groupTitle} className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-content-secondary">
                          <SectionIcon className="w-3.5 h-3.5 text-primary-400" />
                          <span>{sec.groupTitle}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {sec.modules.map((m) => {
                            const level = getRoleModuleLevel(r, m.key);
                            return (
                              <div
                                key={m.key}
                                className={`p-2 rounded-xl border text-[10px] font-mono flex items-center justify-between ${
                                  level === 'FULL'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                    : level === 'READ'
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                    : 'bg-bg-surface border-bg-border text-content-muted opacity-50'
                                }`}
                              >
                                <span className="truncate pr-1 font-bold">{m.label}</span>
                                <span className="font-extrabold text-[9px] px-1.5 py-0.5 rounded">
                                  {level === 'FULL' ? 'FULL (R/W)' : level === 'READ' ? 'READ ONLY' : 'NO ACCESS'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ────────────── TAB 3: AUDIT LOGS ────────────── */
        <div className="rounded-3xl bg-bg-card border border-bg-border overflow-hidden shadow-xl">
          <div className="p-6 border-b border-bg-border flex items-center justify-between">
            <h3 className="font-head font-bold text-base text-content-primary flex items-center gap-2">
              <History className="w-5 h-5 text-primary-400" />
              <span>Administrative Security Audit Log</span>
            </h3>
            <span className="text-xs font-mono text-content-muted">Showing last 100 system events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-bg-surface text-content-muted border-b border-bg-border uppercase text-[10px]">
                <tr>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Module</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border text-content-primary">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-bg-surface/50 transition-colors">
                    <td className="p-4 font-bold text-primary-400">{log.actor_name}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-300 border border-primary-500/30">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="p-4 text-content-secondary">{log.module}</td>
                    <td className="p-4 font-sans text-content-primary">{log.description}</td>
                    <td className="p-4 text-content-muted">{log.ip_address}</td>
                    <td className="p-4 text-content-muted">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL 1: CREATE / EDIT ROLE WITH GRANULAR PERMISSION MATRIX ── */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveRoleSubmit}
            className="max-w-3xl w-full rounded-3xl bg-bg-card border border-bg-border shadow-2xl p-6 sm:p-8 space-y-6 my-8 animate-in fade-in zoom-in duration-200"
          >
            <div className="flex items-start justify-between border-b border-bg-border pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sliders className="w-6 h-6 text-primary-400" />
                  <h2 className="text-xl font-head font-bold text-content-primary">
                    {selectedRole ? `Edit Role Permissions: ${selectedRole.name}` : 'Create New Custom Staff Role'}
                  </h2>
                </div>
                <p className="text-xs text-content-muted">
                  Configure permission level (NO ACCESS, READ ONLY, CAN VIEW & EDIT) for Super Admin menu sections.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="text-content-muted hover:text-content-primary text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-content-primary font-bold">Role Name *</label>
                <input
                  type="text"
                  required
                  value={roleFormName}
                  onChange={(e) => setRoleFormName(e.target.value)}
                  placeholder="e.g. Senior Order Auditor"
                  className="w-full p-3 rounded-xl bg-bg-surface border border-bg-border focus:border-primary-500 text-content-primary outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-content-primary font-bold">Description</label>
                <input
                  type="text"
                  value={roleFormDesc}
                  onChange={(e) => setRoleFormDesc(e.target.value)}
                  placeholder="e.g. Manages order dispatches & fulfillment"
                  className="w-full p-3 rounded-xl bg-bg-surface border border-bg-border focus:border-primary-500 text-content-primary outline-none"
                />
              </div>
            </div>

            {/* Module Permission Matrix Controls Grouped by Super Admin Menu Sections */}
            <div className="space-y-4 pt-2">
              <label className="text-xs font-bold text-content-primary uppercase tracking-wider block">
                Super Admin Menu Permission Matrix
              </label>

              <div className="max-h-72 overflow-y-auto pr-1 space-y-4">
                {SUPER_ADMIN_MENU_SECTIONS.map((sec) => {
                  const SectionIcon = sec.icon;
                  return (
                    <div key={sec.groupTitle} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary-400 bg-bg-surface p-2 rounded-xl border border-bg-border">
                        <SectionIcon className="w-4 h-4" />
                        <span>{sec.groupTitle}</span>
                      </div>

                      <div className="space-y-2 pl-2">
                        {sec.modules.map((m) => {
                          const currentLevel = roleFormPermissions[m.key] || 'NONE';
                          return (
                            <div
                              key={m.key}
                              className="p-3 rounded-2xl bg-bg-surface border border-bg-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-content-primary block">{m.label}</span>
                                <span className="text-[10px] text-content-muted font-sans">{m.desc}</span>
                              </div>

                              {/* Level selector buttons */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setModuleLevel(m.key, 'NONE')}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-[10px] border transition-all ${
                                    currentLevel === 'NONE'
                                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-sm'
                                      : 'bg-bg-card border-bg-border text-content-muted hover:text-content-primary'
                                  }`}
                                >
                                  NO ACCESS
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setModuleLevel(m.key, 'READ')}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-[10px] border transition-all ${
                                    currentLevel === 'READ'
                                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-sm'
                                      : 'bg-bg-card border-bg-border text-content-muted hover:text-content-primary'
                                  }`}
                                >
                                  CAN VIEW ONLY
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setModuleLevel(m.key, 'FULL')}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-[10px] border transition-all ${
                                    currentLevel === 'FULL'
                                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm'
                                      : 'bg-bg-card border-bg-border text-content-muted hover:text-content-primary'
                                  }`}
                                >
                                  CAN VIEW & EDIT
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-bg-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-secondary hover:text-content-primary text-xs font-bold"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={savingRole}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-glow transition-all"
              >
                {savingRole ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save Role to Database</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL 2: EDIT USER ROLE MODAL ── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full rounded-3xl bg-bg-card border border-bg-border shadow-2xl p-6 sm:p-8 space-y-6 my-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between border-b border-bg-border pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sliders className="w-6 h-6 text-primary-400" />
                  <h2 className="text-xl font-head font-bold text-content-primary">
                    Assign Role to Admin User
                  </h2>
                </div>
                <p className="text-xs text-content-muted">
                  Assigning staff role for <strong className="text-primary-400">{selectedUser.username || selectedUser.full_name}</strong> ({selectedUser.phone_number})
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-content-muted hover:text-content-primary text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-content-primary uppercase tracking-wider block">
                Select Database Staff Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roles.map((r) => {
                  const isSelected = editingRoleId === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setEditingRoleId(r.id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-primary-600/20 border-primary-500 shadow-glow text-white'
                          : 'bg-bg-surface border-bg-border hover:border-primary-500/40 text-content-secondary'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-head font-bold text-sm text-content-primary">{r.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-400" />}
                      </div>
                      <p className="text-[11px] text-content-muted line-clamp-2">{r.description || 'Database staff role'}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-bg-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-secondary hover:text-content-primary text-xs font-bold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveUserRole}
                disabled={savingUserRole}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-glow transition-all"
              >
                {savingUserRole ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save Assigned Role</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: CREATE ADMIN USER MODAL (Registration Form + Fixed Admin Role) ── */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateUserSubmit}
            className="max-w-lg w-full rounded-3xl bg-bg-card border border-bg-border shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in duration-200"
          >
            <div className="flex items-start justify-between border-b border-bg-border pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-6 h-6 text-primary-400" />
                  <h2 className="text-xl font-head font-bold text-content-primary">Create Admin Account</h2>
                </div>
                <p className="text-xs text-content-muted">Register a new Admin staff user into the database.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateUserModalOpen(false)}
                className="text-content-muted hover:text-content-primary text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* Name Row: First Name & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-content-primary font-bold">First Name</label>
                  <input
                    type="text"
                    value={userFormFirstName}
                    onChange={(e) => setUserFormFirstName(e.target.value)}
                    placeholder="e.g. Rahim"
                    className="w-full p-3 rounded-xl bg-bg-surface border border-bg-border focus:border-primary-500 text-content-primary outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-content-primary font-bold">Last Name</label>
                  <input
                    type="text"
                    value={userFormLastName}
                    onChange={(e) => setUserFormLastName(e.target.value)}
                    placeholder="e.g. Uddin"
                    className="w-full p-3 rounded-xl bg-bg-surface border border-bg-border focus:border-primary-500 text-content-primary outline-none"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-content-primary font-bold">Email Address</label>
                <input
                  type="email"
                  value={userFormEmail}
                  onChange={(e) => setUserFormEmail(e.target.value)}
                  placeholder="e.g. admin@onemed.com"
                  className="w-full p-3 rounded-xl bg-bg-surface border border-bg-border focus:border-primary-500 text-content-primary outline-none"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-content-primary font-bold">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={userFormPhone}
                  onChange={(e) => setUserFormPhone(e.target.value)}
                  placeholder="e.g. 01XXXXXXXXX"
                  className="w-full p-3 rounded-xl bg-bg-surface border border-bg-border focus:border-primary-500 text-content-primary outline-none"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-content-primary font-bold">Password *</label>
                <input
                  type="password"
                  required
                  value={userFormPassword}
                  onChange={(e) => setUserFormPassword(e.target.value)}
                  placeholder="Enter secure password (min 8 chars)"
                  className="w-full p-3 rounded-xl bg-bg-surface border border-bg-border focus:border-primary-500 text-content-primary outline-none"
                />
              </div>

              {/* Assigned Role: Shows ONLY 1 option: "Admin" */}
              <div className="space-y-1.5 pt-1">
                <label className="text-content-primary font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary-400" />
                  <span>Assigned System Role</span>
                </label>
                <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary-400" />
                    <span className="font-head font-extrabold text-sm text-content-primary">Admin</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/40">
                    System Staff Role
                  </span>
                </div>
                <p className="text-[10px] text-content-muted">
                  Super Admin is 1 unique system account. All newly created staff users receive the <strong className="text-content-primary">Admin</strong> role.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-bg-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateUserModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-secondary hover:text-content-primary text-xs font-bold"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={creatingUser}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-glow transition-all"
              >
                {creatingUser ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>Create Admin Account</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RbacManagementPage;
