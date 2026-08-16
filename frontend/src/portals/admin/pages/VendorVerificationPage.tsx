import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  FileText,
  Ban,
  PauseCircle,
  PlayCircle,
  UserCheck,
  Layers,
} from 'lucide-react';
import {
  adminVendorVerificationApi,
  type AdminVendorItem,
} from '../api/adminVendorVerification.api';
import toast from 'react-hot-toast';

export const VendorVerificationPage: React.FC = () => {
  const [vendors, setVendors] = useState<AdminVendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [verFilter, setVerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchVendors();
  }, [verFilter, statusFilter]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const params: { verification_status?: string; status?: string; search?: string } = {};
      if (verFilter !== 'all') params.verification_status = verFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const data = await adminVendorVerificationApi.getVendors(params);
      setVendors(data);
    } catch (err: any) {
      console.error('Failed to load vendors for verification:', err);
      toast.error('Failed to load vendor verification list.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVendors();
  };

  const handleUpdateStatus = async (
    id: number,
    payload: {
      verification_status?: 'pending' | 'verified' | 'rejected';
      status?: 'active' | 'inactive' | 'paused' | 'blocked';
    }
  ) => {
    try {
      setUpdatingId(id);
      const res = await adminVendorVerificationApi.updateVendorStatus(id, payload);
      toast.success(res.message || 'Vendor status updated successfully!');
      fetchVendors();
    } catch (err: any) {
      console.error('Failed to update vendor status:', err);
      toast.error(err.response?.data?.error || 'Failed to update vendor status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Stats calculation
  const totalVendors = vendors.length;
  const pendingCount = vendors.filter((v) => v.verification_status === 'pending').length;
  const verifiedCount = vendors.filter((v) => v.verification_status === 'verified').length;
  const blockedCount = vendors.filter((v) => v.status === 'blocked').length;

  const getVerBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 w-fit">
            <CheckCircle2 size={13} />
            <span>VERIFIED</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 w-fit">
            <XCircle size={13} />
            <span>REJECTED</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold flex items-center gap-1.5 w-fit animate-pulse">
            <Clock size={13} />
            <span>PENDING</span>
          </span>
        );
    }
  };

  const getAccStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold uppercase flex items-center gap-1 w-fit">
            <PlayCircle size={12} />
            <span>Active</span>
          </span>
        );
      case 'paused':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold uppercase flex items-center gap-1 w-fit">
            <PauseCircle size={12} />
            <span>Paused</span>
          </span>
        );
      case 'blocked':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold uppercase flex items-center gap-1 w-fit">
            <Ban size={12} />
            <span>Blocked</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20 text-xs font-semibold uppercase flex items-center gap-1 w-fit">
            <span>Inactive</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-content-primary tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="text-emerald-400" size={28} />
            <span>Vendor Partner Verification & Management</span>
          </h1>
          <p className="text-sm text-content-muted">
            Verify trade licenses, review store details, and manage active / blocked status of vendor partners.
          </p>
        </div>

        <button
          onClick={fetchVendors}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-surface hover:bg-bg-hover text-content-secondary hover:text-content-primary border border-bg-border text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-400' : ''} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-bg-surface p-5 rounded-2xl border border-bg-border shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-content-muted uppercase tracking-wider">
              Total Vendor Partners
            </span>
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20 flex items-center justify-center">
              <Building2 size={20} />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-content-primary">{totalVendors}</div>
        </div>

        <div className="bg-bg-surface p-5 rounded-2xl border border-bg-border shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-content-muted uppercase tracking-wider">
              Pending Verification
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-amber-400">{pendingCount}</div>
        </div>

        <div className="bg-bg-surface p-5 rounded-2xl border border-bg-border shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-content-muted uppercase tracking-wider">
              Verified & Active
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-400">{verifiedCount}</div>
        </div>

        <div className="bg-bg-surface p-5 rounded-2xl border border-bg-border shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-content-muted uppercase tracking-wider">
              Blocked / Suspended
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <Ban size={20} />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-rose-400">{blockedCount}</div>
        </div>
      </div>

      {/* Main Vendor Control Card */}
      <div className="bg-bg-surface rounded-2xl border border-bg-border p-6 shadow-xl space-y-5">
        {/* Filters & Search Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-bg-border">
          <div className="flex flex-wrap items-center gap-3">
            {/* Verification Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-content-muted uppercase mb-1">
                Verification Filter
              </label>
              <select
                value={verFilter}
                onChange={(e) => setVerFilter(e.target.value)}
                className="px-3 py-2 bg-bg-base border border-bg-border rounded-xl text-content-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="all">All Verification Statuses</option>
                <option value="pending">Pending Only</option>
                <option value="verified">Verified Only</option>
                <option value="rejected">Rejected Only</option>
              </select>
            </div>

            {/* Account Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-content-muted uppercase mb-1">
                Account Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-bg-base border border-bg-border rounded-xl text-content-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="all">All Account Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="paused">Paused Only</option>
                <option value="blocked">Blocked Only</option>
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-80">
            <Search size={16} className="absolute left-3 top-3 text-content-muted" />
            <input
              type="text"
              placeholder="Search by store name, phone, trade license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-bg-base border border-bg-border rounded-xl text-content-primary placeholder-content-muted text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </form>
        </div>

        {/* Vendors Verification Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-bg-border text-content-muted font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Pharmacy / Vendor Info</th>
                <th className="py-3.5 px-4">Contact Credentials</th>
                <th className="py-3.5 px-4">Trade License & Location</th>
                <th className="py-3.5 px-4">Verification Status</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Verification Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-content-muted">
                    <RefreshCw size={24} className="animate-spin text-emerald-400 mx-auto mb-2" />
                    <span>Loading vendor verification records...</span>
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-content-muted">
                    <Building2 size={36} className="text-content-muted mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-content-primary">No Vendor Registrations Found</p>
                    <p className="text-xs text-content-muted mt-1">
                      No vendor profiles matched the selected status filters.
                    </p>
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-bg-hover transition-colors">
                    {/* Store Info */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md flex-shrink-0">
                          <div className="w-full h-full bg-bg-surface rounded-[10px] flex items-center justify-center font-bold text-emerald-400 text-sm">
                            {vendor.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-content-primary text-sm flex items-center gap-2">
                            <span>{vendor.name}</span>
                            {vendor.is_profile_complete ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Complete
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Incomplete
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-content-muted flex items-center gap-1.5 mt-0.5">
                            <span className="capitalize">{vendor.type}</span>
                            <span>•</span>
                            <span className="font-mono">ID: #{vendor.id}</span>
                            <span>•</span>
                            <span className="font-mono">Owner: @{vendor.owner_username}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Credentials */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-content-primary font-mono">
                          <Phone size={13} className="text-content-muted" />
                          <span>{vendor.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-content-muted text-[11px]">
                          <Mail size={13} />
                          <span>{vendor.email || 'No Email'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Trade License & Location */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-content-primary font-mono">
                          <FileText size={13} className="text-emerald-400" />
                          <span>{vendor.trade_license_no || 'Not Submitted'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-content-muted text-[11px]">
                          <MapPin size={13} />
                          <span>
                            {vendor.address
                              ? `${vendor.address.area ? vendor.address.area + ', ' : ''}${vendor.address.city}`
                              : 'No Address'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Verification Status */}
                    <td className="py-4 px-4">
                      {getVerBadge(vendor.verification_status)}
                    </td>

                    {/* Account Status Switcher */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        {getAccStatusBadge(vendor.status)}

                        {/* Interactive Status Selector */}
                        <select
                          value={vendor.status}
                          disabled={updatingId === vendor.id}
                          onChange={(e) =>
                            handleUpdateStatus(vendor.id, {
                              status: e.target.value as any,
                            })
                          }
                          className="mt-1 px-2 py-1 bg-bg-base border border-bg-border rounded-lg text-content-secondary text-[11px] focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="active">Set Active</option>
                          <option value="inactive">Set Inactive</option>
                          <option value="paused">Set Paused</option>
                          <option value="blocked">Set Blocked</option>
                        </select>
                      </div>
                    </td>

                    {/* Verification Action Buttons */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {vendor.verification_status !== 'verified' && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(vendor.id, {
                                verification_status: 'verified',
                                status: 'active',
                              })
                            }
                            disabled={updatingId === vendor.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                            title="Approve registration & set store active"
                          >
                            <UserCheck size={14} />
                            <span>Accept / Approve</span>
                          </button>
                        )}

                        {vendor.verification_status !== 'rejected' && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(vendor.id, {
                                verification_status: 'rejected',
                                status: 'inactive',
                              })
                            }
                            disabled={updatingId === vendor.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-bg-base hover:bg-rose-500/10 border border-bg-border hover:border-rose-500/30 text-content-secondary hover:text-rose-400 text-xs font-semibold transition-all disabled:opacity-50"
                            title="Reject vendor application"
                          >
                            <XCircle size={14} />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
