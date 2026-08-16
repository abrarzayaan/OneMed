import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  DollarSign,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Send,
  CreditCard,
  Building,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  FileText,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminVendorSettlementApi } from '../api/adminVendorSettlement.api';
import type { VendorSettlementSummary, PayoutRequest } from '../api/adminVendorSettlement.api';

export const VendorSettlementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'payouts'>('ledger');

  const [vendors, setVendors] = useState<VendorSettlementSummary[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Approve Payout Modal
  const [approvingPayout, setApprovingPayout] = useState<PayoutRequest | null>(null);
  const [trxIdInput, setTrxIdInput] = useState('');

  // Reject Payout Modal
  const [rejectingPayout, setRejectingPayout] = useState<PayoutRequest | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [vData, pData] = await Promise.all([
      adminVendorSettlementApi.getVendorSummaries(),
      adminVendorSettlementApi.getPayoutRequests(),
    ]);
    setVendors(vData);
    setPayouts(pData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter(
      (v) =>
        v.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.phone.includes(searchQuery)
    );
  }, [vendors, searchQuery]);

  // Filtered Payouts
  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      const matchesSearch =
        p.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.transaction_trx_id && p.transaction_trx_id.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = payoutStatusFilter === 'ALL' ? true : p.status === payoutStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payouts, searchQuery, payoutStatusFilter]);

  // Financial Aggregates
  const totalGrossSales = useMemo(() => vendors.reduce((acc, v) => acc + v.gross_sales_bdt, 0), [vendors]);
  const totalCommission = useMemo(() => vendors.reduce((acc, v) => acc + v.platform_commission_bdt, 0), [vendors]);
  const totalDisbursed = useMemo(() => vendors.reduce((acc, v) => acc + v.total_disbursed_bdt, 0), [vendors]);
  const pendingPayoutCount = useMemo(() => payouts.filter((p) => p.status === 'PENDING').length, [payouts]);

  // Handle Approve
  const handleConfirmApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingPayout) return;
    if (!trxIdInput.trim()) {
      toast.error('Transaction TRX Reference ID is required');
      return;
    }

    await adminVendorSettlementApi.approvePayout(approvingPayout.id, trxIdInput);
    toast.success(`Payout of ৳${approvingPayout.requested_amount_bdt.toLocaleString()} approved for ${approvingPayout.vendor_name}`);
    setApprovingPayout(null);
    setTrxIdInput('');
    loadData();
  };

  // Handle Reject
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPayout) return;
    if (!rejectReasonInput.trim()) {
      toast.error('Please specify a rejection reason');
      return;
    }

    await adminVendorSettlementApi.rejectPayout(rejectingPayout.id, rejectReasonInput);
    toast.error(`Payout request rejected`);
    setRejectingPayout(null);
    setRejectReasonInput('');
    loadData();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary-950 via-bg-card to-bg-card p-6 rounded-3xl border border-primary-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20 text-xs font-mono font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Section 10 — Vendor Settlement, Payouts & Commission Ledger</span>
          </div>
          <h1 className="text-2xl font-head font-bold text-content-primary">
            Partner Pharmacy Settlements & Payouts
          </h1>
          <p className="text-xs text-content-muted">
            Manage vendor gross sales split, platform commission fees, and process vendor balance payout requests.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-bg-card border border-bg-border shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-content-muted">Gross Vendor Sales</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-head font-extrabold text-content-primary">
            ৳{totalGrossSales.toLocaleString()}
          </div>
          <div className="text-[10px] text-content-muted font-mono">Total partner sales volume</div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-card border border-bg-border shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-content-muted">Platform Commission</span>
            <Percent className="w-4 h-4 text-primary-400" />
          </div>
          <div className="text-2xl font-head font-extrabold text-primary-400">
            ৳{totalCommission.toLocaleString()}
          </div>
          <div className="text-[10px] text-primary-400 font-mono">Net revenue earned</div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-card border border-bg-border shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-content-muted">Disbursed Payouts</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-head font-extrabold text-indigo-400">
            ৳{totalDisbursed.toLocaleString()}
          </div>
          <div className="text-[10px] text-content-muted font-mono">Paid to partner pharmacies</div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-card border border-bg-border shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-content-muted">Pending Payouts</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-head font-extrabold text-amber-400">{pendingPayoutCount}</div>
          <div className="text-[10px] text-amber-400 font-mono">Awaiting admin approval</div>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="flex items-center border-b border-bg-border space-x-2">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-5 py-3 text-xs font-mono font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'ledger'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-content-muted hover:text-content-primary'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Vendor Financial Ledger ({vendors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-5 py-3 text-xs font-mono font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'payouts'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-content-muted hover:text-content-primary'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Payout Authorization Queue ({payouts.length})</span>
        </button>
      </div>

      {/* ── TAB 1: VENDOR FINANCIAL LEDGER ── */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-bg-card border border-bg-border">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-content-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor by pharmacy name, owner, or phone..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none"
              />
            </div>
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-bg-surface border border-bg-border text-content-muted hover:text-content-primary transition-all self-end sm:self-auto"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="rounded-3xl bg-bg-card border border-bg-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-bg-border bg-bg-surface text-[10px] font-mono uppercase text-content-muted">
                    <th className="p-4">Pharmacy Vendor</th>
                    <th className="p-4">Fulfilled Orders</th>
                    <th className="p-4">Gross Sales</th>
                    <th className="p-4">Platform Fee</th>
                    <th className="p-4">Disbursed Payouts</th>
                    <th className="p-4">Net Balance Payable</th>
                    <th className="p-4 text-right">Bank / Payment Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bg-border text-xs">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.vendor_id} className="hover:bg-bg-surface/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-content-primary flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-primary-400 shrink-0" />
                          <span>{vendor.vendor_name}</span>
                        </div>
                        <div className="text-[11px] text-content-muted font-mono space-x-2">
                          <span>Type: {vendor.type}</span>
                          <span>•</span>
                          <span>{vendor.phone}</span>
                        </div>
                      </td>

                      <td className="p-4 font-mono font-bold text-content-primary">
                        {vendor.fulfilled_order_count} <span className="text-[10px] font-normal text-content-muted">orders</span>
                      </td>

                      <td className="p-4 font-mono font-bold text-emerald-400">
                        ৳{vendor.gross_sales_bdt.toLocaleString()}
                      </td>

                      <td className="p-4 font-mono">
                        <div className="text-primary-400 font-bold">
                          ৳{vendor.platform_commission_bdt.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-content-muted">({vendor.commission_rate_pct}% Rate)</div>
                      </td>

                      <td className="p-4 font-mono font-bold text-indigo-400">
                        ৳{vendor.total_disbursed_bdt.toLocaleString()}
                      </td>

                      <td className="p-4 font-mono">
                        <div className="text-base font-bold text-amber-400">
                          ৳{vendor.net_balance_payable_bdt.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-content-muted">Available to withdraw</span>
                      </td>

                      <td className="p-4 text-right space-y-0.5 font-mono text-[11px]">
                        <div className="text-content-primary font-bold">{vendor.bank_name}</div>
                        <div className="text-content-muted">A/C: {vendor.bank_account_no}</div>
                        <div className="text-primary-400">bKash: {vendor.bkash_merchant}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: PAYOUT AUTHORIZATION QUEUE ── */}
      {activeTab === 'payouts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-bg-card border border-bg-border">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-content-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search payout requests by vendor or TRX ID..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-content-muted">Status:</span>
              <div className="flex rounded-xl bg-bg-surface border border-bg-border p-1">
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setPayoutStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono capitalize transition-all ${
                      payoutStatusFilter === st
                        ? 'bg-primary-500/20 text-primary-400 font-bold border border-primary-500/30'
                        : 'text-content-muted hover:text-content-primary'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPayouts.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-3xl bg-bg-card border border-bg-border hover:border-primary-500/30 transition-all shadow-card space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-bg-border pb-3">
                    <div>
                      <h3 className="font-head font-bold text-sm text-content-primary">{req.vendor_name}</h3>
                      <div className="text-[10px] font-mono text-content-muted">Request ID: #{req.id}</div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        req.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : req.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-content-muted font-mono">Requested Payout Amount:</div>
                    <div className="text-xl font-head font-extrabold text-emerald-400">
                      ৳{req.requested_amount_bdt.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-bg-surface border border-bg-border space-y-1 text-xs">
                    <div className="flex items-center justify-between text-content-secondary">
                      <span className="font-mono text-[11px] text-content-muted">Payment Method:</span>
                      <span className="font-bold text-primary-400">{req.payment_method}</span>
                    </div>
                    <div className="text-[11px] font-mono text-content-primary">{req.account_details}</div>
                    {req.transaction_trx_id && (
                      <div className="text-[11px] font-mono text-emerald-400 pt-1 border-t border-bg-border/60">
                        TRX Ref ID: <strong>{req.transaction_trx_id}</strong>
                      </div>
                    )}
                    {req.rejection_reason && (
                      <div className="text-[11px] font-mono text-rose-400 pt-1 border-t border-bg-border/60">
                        Reason: {req.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-bg-border">
                  <div className="text-[10px] font-mono text-content-muted">
                    {new Date(req.requested_at).toLocaleString()}
                  </div>

                  {req.status === 'PENDING' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setRejectingPayout(req);
                          setRejectReasonInput('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:border-rose-500 text-rose-400 text-xs font-semibold"
                      >
                        Reject
                      </button>

                      <button
                        onClick={() => {
                          setApprovingPayout(req);
                          setTrxIdInput('');
                        }}
                        className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-glow"
                      >
                        Approve Payout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL 1: APPROVE PAYOUT ── */}
      {approvingPayout && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-card border border-bg-border rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-bg-border pb-3">
              <h3 className="text-sm font-head font-bold text-content-primary">Authorize Vendor Payout</h3>
              <button
                onClick={() => setApprovingPayout(null)}
                className="text-content-muted hover:text-content-primary text-xs font-mono font-bold"
              >
                ✕ ESC
              </button>
            </div>

            <form onSubmit={handleConfirmApprove} className="space-y-4">
              <div className="p-3 rounded-2xl bg-bg-surface border border-bg-border space-y-1 text-xs">
                <div className="text-content-muted">Vendor: <strong className="text-content-primary">{approvingPayout.vendor_name}</strong></div>
                <div className="text-content-muted">Amount: <strong className="text-emerald-400">৳{approvingPayout.requested_amount_bdt.toLocaleString()}</strong></div>
                <div className="text-content-muted">Account: <strong className="text-content-primary">{approvingPayout.account_details}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                  Bank / MFS Transaction TRX Reference ID *
                </label>
                <input
                  type="text"
                  required
                  value={trxIdInput}
                  onChange={(e) => setTrxIdInput(e.target.value)}
                  placeholder="e.g. TRX-CITY-99882201"
                  className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary font-mono font-bold focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-bg-border">
                <button
                  type="button"
                  onClick={() => setApprovingPayout(null)}
                  className="px-4 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs font-semibold text-content-muted hover:text-content-primary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-glow"
                >
                  Confirm Payout Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: REJECT PAYOUT ── */}
      {rejectingPayout && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-card border border-bg-border rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-bg-border pb-3">
              <h3 className="text-sm font-head font-bold text-content-primary">Reject Payout Request</h3>
              <button
                onClick={() => setRejectingPayout(null)}
                className="text-content-muted hover:text-content-primary text-xs font-mono font-bold"
              >
                ✕ ESC
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  placeholder="Specify why this payout request is being rejected..."
                  className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-bg-border">
                <button
                  type="button"
                  onClick={() => setRejectingPayout(null)}
                  className="px-4 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs font-semibold text-content-muted hover:text-content-primary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-glow"
                >
                  Reject Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
