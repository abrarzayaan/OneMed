import api from '../../../api/axios';

export type PermissionLevel = 'NONE' | 'READ' | 'FULL';

export interface ModulePermissions {
  orders: PermissionLevel;
  catalog: PermissionLevel;
  users: PermissionLevel;
  prescriptions: PermissionLevel;
  cms: PermissionLevel;
  analytics: PermissionLevel;
  [key: string]: PermissionLevel;
}

export interface StaffRole {
  id: number;
  name: string;
  description: string;
  permissions: ModulePermissions;
  is_system: boolean;
  member_count: number;
}

export interface StaffUser {
  id: number;
  full_name: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  email: string;
  phone_number: string;
  password?: string;
  role_id: number;
  role_name: string;
  is_superuser?: boolean;
  is_staff?: boolean;
  permissions?: Record<string, boolean | string>;
  status: 'ACTIVE' | 'SUSPENDED';
  joined_date: string;
}

export interface SecurityAuditLog {
  id: number;
  actor_name: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'AUTH' | 'STATUS_CHANGE';
  module: string;
  description: string;
  ip_address: string;
  timestamp: string;
}

export const adminRbacApi = {
  getRoles: async (): Promise<StaffRole[]> => {
    try {
      const res = await api.get('/auth/rbac/roles/');
      if (Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
    return [];
  },

  createRole: async (payload: Omit<StaffRole, 'id' | 'member_count'>): Promise<StaffRole> => {
    const res = await api.post('/auth/rbac/roles/', payload);
    return res.data;
  },

  updateRole: async (id: number, payload: Partial<StaffRole>): Promise<StaffRole> => {
    const res = await api.patch(`/auth/rbac/roles/${id}/`, payload);
    return res.data;
  },

  deleteRole: async (id: number): Promise<boolean> => {
    await api.delete(`/auth/rbac/roles/${id}/`);
    return true;
  },

  getStaffUsers: async (searchQuery?: string): Promise<StaffUser[]> => {
    try {
      const url = searchQuery ? `/auth/rbac/staff/?search=${encodeURIComponent(searchQuery)}` : '/auth/rbac/staff/';
      const res = await api.get(url);
      if (Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.error('Error fetching staff users:', err);
    }
    return [];
  },

  createStaffUser: async (payload: Partial<StaffUser>): Promise<StaffUser> => {
    const res = await api.post('/auth/rbac/staff/', payload);
    return res.data;
  },

  updateStaffUserRole: async (id: number, roleId: number): Promise<StaffUser> => {
    const res = await api.patch(`/auth/rbac/staff/${id}/`, { role_id: roleId });
    return res.data;
  },

  updateStaffStatus: async (id: number, status: 'ACTIVE' | 'SUSPENDED'): Promise<StaffUser> => {
    const res = await api.patch(`/auth/rbac/staff/${id}/`, { status });
    return res.data;
  },

  getAuditLogs: async (): Promise<SecurityAuditLog[]> => {
    try {
      const res = await api.get('/auth/rbac/audit-logs/');
      if (Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
    return [];
  },
};
