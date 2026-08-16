import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  RefreshCw,
  Building2,
  Truck,
  CheckCircle2,
  Clock,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { AdminOrder, OrderStatusType } from '../types/admin.types';
import { adminOrderApi } from '../api/adminOrder.api';
import { OrderDetailModal } from '../components/OrderDetailModal';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All Orders', value: 'ALL' },
  { label: 'Placed (Review Required)', value: 'PLACED' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Packed', value: 'PACKED' },
  { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export const OrderFulfillmentPage: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  // Pagination state (20 per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const pageSize = 20;

  // Dynamic DB Stats
  const [stats, setStats] = useState({ total: 0, placed: 0, confirmed: 0, out_for_delivery: 0 });

  const loadOrders = async () => {
    setLoading(true);
    try {
      const [res, statsData] = await Promise.all([
        adminOrderApi.getOrders(activeTab, searchQuery, currentPage, pageSize, startDate, endDate),
        adminOrderApi.getOrderStats(),
      ]);
      setOrders(res.orders);
      setTotalPages(res.totalPages);
      setTotalCount(res.count);
      setStats(statsData);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, startDate, endDate]);

  useEffect(() => {
    loadOrders();
  }, [activeTab, searchQuery, currentPage, startDate, endDate]);

  const handleOrderUpdated = (updatedOrder: AdminOrder) => {
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    if (selectedOrder?.id === updatedOrder.id) {
      setSelectedOrder(updatedOrder);
    }
    adminOrderApi.getOrderStats().then(setStats);
  };

  const handleQuickConfirm = async (order: AdminOrder) => {
    try {
      const updated = await adminOrderApi.updateStatus(order.id, {
        status: 'CONFIRMED',
        remarks: 'Confirmed directly by Admin',
      });
      toast.success(`Order ${order.order_number} confirmed!`);
      handleOrderUpdated(updated);
    } catch {
      toast.error('Failed to confirm order');
    }
  };

  const handleQuickCancel = async (order: AdminOrder) => {
    try {
      const updated = await adminOrderApi.updateStatus(order.id, {
        status: 'CANCELLED',
        remarks: 'Cancelled directly by Admin',
      });
      toast.success(`Order ${order.order_number} cancelled.`);
      handleOrderUpdated(updated);
    } catch {
      toast.error('Failed to cancel order');
    }
  };

  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const getStatusStyle = (status: OrderStatusType) => {
    switch (status) {
      case 'PLACED':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'CONFIRMED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'PROCESSING':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      case 'PACKED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'OUT_FOR_DELIVERY':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'DELIVERED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'CANCELLED':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-primary-400">
            <ShoppingCart className="w-4 h-4" />
            <span>SECTION 02 — FULFILLMENT HUB</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-head font-bold text-content-primary tracking-tight">
            Order Fulfillment & Vendor Assignment
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary mt-1">
            Review customer orders ({stats.total} Total in DB), map item stock to local vendors, assign delivery riders, and confirm stock deduction.
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-bg-card hover:bg-bg-hover border border-bg-border text-content-primary text-xs font-semibold flex items-center space-x-2 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary-400' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-bg-card border border-bg-border flex items-center justify-between shadow-card">
          <div>
            <div className="text-xs font-medium text-content-muted">Pending Review (Placed)</div>
            <div className="text-2xl font-mono font-bold text-indigo-400 mt-1">{stats.placed} Orders</div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-bg-card border border-bg-border flex items-center justify-between shadow-card">
          <div>
            <div className="text-xs font-medium text-content-muted">Confirmed & Reserved Stock</div>
            <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">{stats.confirmed} Orders</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-bg-card border border-bg-border flex items-center justify-between shadow-card">
          <div>
            <div className="text-xs font-medium text-content-muted">Out for Delivery</div>
            <div className="text-2xl font-mono font-bold text-purple-400 mt-1">{stats.out_for_delivery} Orders</div>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs, Date Controls & Search Bar */}
      <div className="p-4 rounded-3xl bg-bg-card border border-bg-border shadow-card space-y-4">
        {/* Status Tabs Scroll Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-glow'
                    : 'bg-bg-surface text-content-muted hover:text-content-primary border border-bg-border'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Date Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t border-bg-border/50">
          {/* Date Filter Inputs */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center space-x-1.5 bg-bg-surface px-3 py-1.5 rounded-xl border border-bg-border text-content-secondary">
              <Calendar className="w-3.5 h-3.5 text-primary-400" />
              <span className="font-mono text-[11px] text-content-muted">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-content-primary outline-none text-xs font-mono"
              />
            </div>

            <div className="flex items-center space-x-1.5 bg-bg-surface px-3 py-1.5 rounded-xl border border-bg-border text-content-secondary">
              <Calendar className="w-3.5 h-3.5 text-primary-400" />
              <span className="font-mono text-[11px] text-content-muted">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-content-primary outline-none text-xs font-mono"
              />
            </div>

            {(startDate || endDate) && (
              <button
                onClick={clearDateFilters}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-[11px] font-semibold transition-all flex items-center space-x-1"
              >
                <X className="w-3 h-3" />
                <span>Reset Dates</span>
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order #, customer..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-bg-surface border border-bg-border text-content-primary placeholder-content-muted text-xs outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* Orders Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-bg-border text-content-muted font-mono uppercase bg-bg-base/50">
              <tr>
                <th className="py-3.5 px-4">Order # & Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Address</th>
                <th className="py-3.5 px-4">Total & Payment</th>
                <th className="py-3.5 px-4">Vendor & Rider Status</th>
                <th className="py-3.5 px-4">Order Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border font-medium">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-content-muted">
                    {loading ? 'Loading database orders...' : 'No orders matching the current filter.'}
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const allVendorsAssigned = o.items.length > 0 && o.items.every((i) => i.assigned_vendor_id);
                  const riderAssigned = Boolean(o.assigned_rider);
                  const orderDate = new Date(o.created_at);

                  return (
                    <tr key={o.id} className="hover:bg-bg-hover transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-mono font-bold text-primary-400">{o.order_number}</div>
                        <div className="text-[10px] text-content-muted font-mono mt-0.5">
                          {orderDate.toLocaleDateString()} — {orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-content-primary">{o.customer_name}</div>
                        <div className="text-[11px] text-content-muted font-mono">{o.customer_phone}</div>
                      </td>
                      <td className="py-4 px-4 max-w-[200px]">
                        <div className="text-content-secondary truncate">{o.shipping_address}</div>
                        <div className="text-[10px] text-content-muted font-mono">{o.city}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-mono font-bold text-content-primary">৳ {o.total_amount}</div>
                        <span className="text-[10px] font-mono text-emerald-400">{o.payment_status}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 text-[11px]">
                            <Building2 className="w-3.5 h-3.5 text-primary-400" />
                            <span className={allVendorsAssigned ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-mono'}>
                              {allVendorsAssigned ? 'Vendors Assigned' : 'Vendor Unassigned'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-[11px]">
                            <Truck className="w-3.5 h-3.5 text-accent-400" />
                            <span className={riderAssigned ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-mono'}>
                              {riderAssigned ? o.assigned_rider?.name : 'Rider Pending'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border ${getStatusStyle(o.order_status)}`}>
                          {o.order_status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {o.order_status === 'PLACED' ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleQuickConfirm(o)}
                              title="Confirm Order"
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-all flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm</span>
                            </button>
                            <button
                              onClick={() => handleQuickCancel(o)}
                              title="Cancel Order"
                              className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 font-bold text-xs transition-all flex items-center space-x-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                            <button
                              onClick={() => setSelectedOrder(o)}
                              title="Inspect Order Details"
                              className="p-1.5 rounded-xl bg-bg-surface hover:bg-bg-hover text-content-muted hover:text-content-primary border border-bg-border transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="px-3.5 py-1.5 rounded-xl bg-primary-500/15 hover:bg-primary-500/25 border border-primary-500/30 text-primary-300 font-bold text-xs transition-all flex items-center space-x-1 ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect & Fulfill</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-bg-border text-xs text-content-muted">
          <div>
            Showing <span className="font-bold text-content-primary">{orders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
            <span className="font-bold text-content-primary">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
            <span className="font-bold text-content-primary">{totalCount}</span> orders
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1.5 rounded-xl bg-bg-surface hover:bg-bg-hover border border-bg-border text-content-primary disabled:opacity-40 disabled:hover:bg-bg-surface font-semibold flex items-center space-x-1 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="font-mono text-content-primary px-2 font-bold">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="px-3 py-1.5 rounded-xl bg-bg-surface hover:bg-bg-hover border border-bg-border text-content-primary disabled:opacity-40 disabled:hover:bg-bg-surface font-semibold flex items-center space-x-1 transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Order Inspection Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={handleOrderUpdated}
        />
      )}
    </div>
  );
};
