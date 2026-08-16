import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  TrendingUp,
  Boxes,
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  Truck,
  ArrowUpRight,
  Filter,
  Layers,
} from 'lucide-react';
import { vendorApi, type VendorDashboardSummary, type VendorDispatchedItem } from '@/api/vendor.api';
import toast from 'react-hot-toast';

export const VendorDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<VendorDashboardSummary | null>(null);
  const [dispatches, setDispatches] = useState<VendorDispatchedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'today' | 'all'>('today');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [activeFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sumData, dispData] = await Promise.all([
        vendorApi.getAnalyticsSummary(),
        vendorApi.getDispatches(activeFilter === 'today' ? 'today' : undefined),
      ]);
      setSummary(sumData);
      setDispatches(dispData);
    } catch (err: any) {
      console.error('Failed to load vendor dashboard:', err);
      toast.error('Failed to load vendor dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const filteredDispatches = dispatches.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.order_number.toLowerCase().includes(term) ||
      item.product_name.toLowerCase().includes(term) ||
      item.variant_sku.toLowerCase().includes(term) ||
      item.customer_area.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>Confirmed</span>
          </span>
        );
      case 'PROCESSING':
      case 'PACKED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium flex items-center gap-1">
            <Clock size={12} />
            <span>Processing</span>
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-medium flex items-center gap-1">
            <Truck size={12} />
            <span>Out for Delivery</span>
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>Delivered</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20 text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Vendor Dispatch Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Real-time track of medicines & products allocated from your pharmacy stock today.
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#171a26] hover:bg-[#202436] text-gray-300 hover:text-white border border-[#262b3d] text-xs font-semibold transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stat Cards Grid - 2 cols on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Today's Dispatched Items */}
        <div className="bg-[#12141c]/90 backdrop-blur-xl p-3.5 sm:p-5 rounded-2xl border border-[#1e2230] shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Dispatched Today
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <PackageCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {summary ? summary.items_dispatched_today : 0}
            </span>
            <span className="text-[10px] sm:text-xs text-emerald-400 font-medium">units</span>
          </div>
          <p className="mt-1 sm:mt-2 text-[10px] sm:text-[11px] text-gray-400 truncate">
            Items allocated today
          </p>
        </div>

        {/* Card 2: Today's Sales Value */}
        <div className="bg-[#12141c]/90 backdrop-blur-xl p-3.5 sm:p-5 rounded-2xl border border-[#1e2230] shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Today's Sales
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1">
            <span className="text-[10px] sm:text-xs text-gray-400">৳</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {summary ? summary.todays_sales_bdt.toLocaleString() : '0'}
            </span>
          </div>
          <p className="mt-1 sm:mt-2 text-[10px] sm:text-[11px] text-gray-400 truncate">
            Gross BDT today
          </p>
        </div>

        {/* Card 3: Total Lifetime Dispatches */}
        <div className="bg-[#12141c]/90 backdrop-blur-xl p-3.5 sm:p-5 rounded-2xl border border-[#1e2230] shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Lifetime Total
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Boxes className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {summary ? summary.total_items_dispatched : 0}
            </span>
            <span className="text-[10px] sm:text-xs text-indigo-400 font-medium">units</span>
          </div>
          <p className="mt-1 sm:mt-2 text-[10px] sm:text-[11px] text-gray-400 truncate">
            Total lifetime fulfilled
          </p>
        </div>

        {/* Card 4: Low Stock Alerts */}
        <div className="bg-[#12141c]/90 backdrop-blur-xl p-3.5 sm:p-5 rounded-2xl border border-[#1e2230] shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Stock Reorder
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {summary ? summary.low_stock_alerts_count : 0}
            </span>
            <span className="text-[10px] sm:text-xs text-amber-400 font-medium">items</span>
          </div>
          <p className="mt-1 sm:mt-2 text-[10px] sm:text-[11px] text-gray-400 truncate">
            Approaching low stock
          </p>
        </div>
      </div>

      {/* Today's Dispatched List Section */}
      <div className="bg-[#12141c]/90 backdrop-blur-xl rounded-2xl border border-[#1e2230] p-4 sm:p-5 shadow-xl space-y-4">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Layers className="text-emerald-400" size={18} />
              <span>Dispatched Items</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#1a1d2b] border border-[#2a2e42] text-[11px] text-gray-300 font-mono">
              {filteredDispatches.length} Record{filteredDispatches.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Filter Toggle */}
            <div className="flex items-center bg-[#171a26] p-1 rounded-xl border border-[#24283b] justify-between sm:justify-start">
              <button
                onClick={() => setActiveFilter('today')}
                className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeFilter === 'today'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Today Only
              </button>
              <button
                onClick={() => setActiveFilter('all')}
                className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All History
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search Order #, SKU, Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#1a1d2b] border border-[#2a2e42] rounded-xl text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-full"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#1e2230] text-gray-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Medicine / Variant Item</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4 text-center">Dispatched Qty</th>
                <th className="py-3 px-4 text-right">Unit Price (৳)</th>
                <th className="py-3 px-4 text-right">Total Value (৳)</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4">Delivery Zone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2230]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <RefreshCw size={24} className="animate-spin text-emerald-500 mx-auto mb-2" />
                    <span>Loading dispatch inventory out-list...</span>
                  </td>
                </tr>
              ) : filteredDispatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <PackageCheck size={36} className="text-gray-600 mx-auto mb-2" />
                    <p className="font-semibold text-gray-300">No Dispatched Items Recorded Yet</p>
                    <p className="text-xs text-gray-500 mt-1">
                      When Super Admin selects your pharmacy for an order variant and confirms it, items will appear here automatically.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDispatches.map((item) => (
                  <tr key={item.order_item_id} className="hover:bg-[#161924] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                      {item.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{item.product_name}</div>
                      <div className="text-[11px] text-gray-400">{item.variant_name}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-400">{item.variant_sku}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                        {item.quantity} pcs
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-gray-300">
                      ৳{item.unit_price.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      ৳{item.total_price.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(item.order_status)}</td>
                    <td className="py-3.5 px-4 text-gray-300">{item.customer_area}</td>
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
