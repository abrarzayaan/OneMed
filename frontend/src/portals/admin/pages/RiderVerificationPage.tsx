import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Bike,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Phone,
  Mail,
  FileText,
  UserCheck,
  Zap,
} from 'lucide-react';
import {
  adminRiderVerificationApi,
  type AdminRiderItem,
} from '../api/adminRiderVerification.api';
import toast from 'react-hot-toast';

export const RiderVerificationPage: React.FC = () => {
  const [riders, setRiders] = useState<AdminRiderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [verFilter, setVerFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchRiders();
  }, [verFilter]);

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const params: { verification_status?: string; search?: string } = {};
      if (verFilter !== 'all') params.verification_status = verFilter;
      if (searchTerm) params.search = searchTerm;

      const data = await adminRiderVerificationApi.getRiders(params);
      setRiders(data);
    } catch (err) {
      console.error('Failed to load riders for verification:', err);
      toast.error('Failed to load rider verification list.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRiders();
  };

  const handleUpdateStatus = async (
    id: number,
    payload: {
      verification_status?: 'pending' | 'verified' | 'rejected';
      availability_status?: 'online' | 'offline' | 'busy';
    }
  ) => {
    try {
      setUpdatingId(id);
      const res = await adminRiderVerificationApi.updateRiderVerification(id, payload);
      toast.success(res.message || 'Rider status updated successfully!');
      fetchRiders();
    } catch (err: any) {
      console.error('Failed to update rider status:', err);
      toast.error(err.response?.data?.error || 'Failed to update rider status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Stats calculation
  const totalRiders = riders.length;
  const pendingCount = riders.filter((r) => r.verification_status === 'pending').length;
  const verifiedCount = riders.filter((r) => r.verification_status === 'verified').length;
  const onlineCount = riders.filter((r) => r.availability_status === 'online').length;

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

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-content-primary tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="text-cyan-400" size={28} />
            <span>Rider Partner Verification & Management</span>
          </h1>
          <p className="text-sm text-content-muted">
            Review NID documents, vehicle details, and approve new rider partner registrations.
          </p>
        </div>

        <button
          onClick={fetchRiders}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-surface hover:bg-bg-hover text-content-secondary hover:text-content-primary border border-bg-border text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-400' : ''} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-bg-surface p-5 rounded-2xl border border-bg-border shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-content-muted uppercase tracking-wider">
              Total Rider Applications
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <Bike size={20} />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-content-primary">{totalRiders}</div>
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
              Verified Partners
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
              Currently Online
            </span>
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20 flex items-center justify-center">
              <Zap size={20} />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-primary-400">{onlineCount}</div>
        </div>
      </div>

      {/* Main Control Card */}
      <div className="bg-bg-surface rounded-2xl border border-bg-border p-6 shadow-xl space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-bg-border">
          <div>
            <label className="block text-[10px] font-bold text-content-muted uppercase mb-1">
              Filter by Verification Status
            </label>
            <select
              value={verFilter}
              onChange={(e) => setVerFilter(e.target.value)}
              className="px-3 py-2 bg-bg-base border border-bg-border rounded-xl text-content-primary text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="all">All Rider Statuses</option>
              <option value="pending">Pending Only</option>
              <option value="verified">Verified Only</option>
              <option value="rejected">Rejected Only</option>
            </select>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-80">
            <Search size={16} className="absolute left-3 top-3 text-content-muted" />
            <input
              type="text"
              placeholder="Search by rider name, phone, NID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-bg-base border border-bg-border rounded-xl text-content-primary placeholder-content-muted text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </form>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-bg-border text-content-muted font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Rider Partner</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Vehicle & Documents</th>
                <th className="py-3.5 px-4">Verification Status</th>
                <th className="py-3.5 px-4">Availability</th>
                <th className="py-3.5 px-4 text-right">Verification Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-content-muted">
                    <RefreshCw size={24} className="animate-spin text-cyan-400 mx-auto mb-2" />
                    <span>Loading rider applications...</span>
                  </td>
                </tr>
              ) : riders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-content-muted">
                    <Bike size={36} className="text-content-muted mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-content-primary">No Rider Applications Found</p>
                  </td>
                </tr>
              ) : (
                riders.map((rider) => (
                  <tr key={rider.id} className="hover:bg-bg-hover transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 p-0.5 shadow-md flex-shrink-0">
                          <div className="w-full h-full bg-bg-surface rounded-[10px] flex items-center justify-center font-bold text-cyan-400 text-sm">
                            {rider.rider_name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-content-primary text-sm">
                            {rider.rider_name}
                          </div>
                          <div className="text-[11px] text-content-muted font-mono">
                            ID: #{rider.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono">
                      <div className="flex items-center gap-1.5 text-content-primary">
                        <Phone size={13} className="text-content-muted" />
                        <span>{rider.phone_number || 'N/A'}</span>
                      </div>
                      {rider.email && (
                        <div className="flex items-center gap-1.5 text-content-muted text-[11px]">
                          <Mail size={13} />
                          <span>{rider.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 font-mono space-y-0.5">
                      <div className="font-bold text-content-primary flex items-center gap-1.5">
                        <Bike size={14} className="text-cyan-400" />
                        <span>{rider.vehicle_type || 'BIKE'}</span>
                        {rider.vehicle_number && <span>({rider.vehicle_number})</span>}
                      </div>
                      {rider.nid_no && (
                        <div className="text-content-muted text-[11px]">🪪 NID: {rider.nid_no}</div>
                      )}
                      {rider.license_no && (
                        <div className="text-content-muted text-[11px]">📄 License: {rider.license_no}</div>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {getVerBadge(rider.verification_status)}
                    </td>

                    <td className="py-4 px-4 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          rider.availability_status === 'online'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                        }`}
                      >
                        {rider.availability_status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {rider.verification_status !== 'verified' && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(rider.id, {
                                verification_status: 'verified',
                                availability_status: 'online',
                              })
                            }
                            disabled={updatingId === rider.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                          >
                            <UserCheck size={14} />
                            <span>Approve & Verify</span>
                          </button>
                        )}

                        {rider.verification_status !== 'rejected' && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(rider.id, {
                                verification_status: 'rejected',
                                availability_status: 'offline',
                              })
                            }
                            disabled={updatingId === rider.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-bg-base hover:bg-rose-500/10 border border-bg-border hover:border-rose-500/30 text-content-secondary hover:text-rose-400 text-xs font-semibold transition-all disabled:opacity-50"
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
