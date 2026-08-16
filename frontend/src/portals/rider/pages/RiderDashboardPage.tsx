import React, { useState, useEffect } from 'react';
import { 
  PackageCheck, 
  Banknote, 
  Award, 
  Bike, 
  ShieldAlert, 
  MapPin, 
  Phone, 
  Truck, 
  Clock, 
  Search, 
  Eye, 
  RefreshCw,
  Loader2,
  CheckCircle2,
  Sparkles,
  Zap,
  Navigation,
  ArrowRight,
  TrendingUp,
  Power
} from 'lucide-react';
import { RiderHeader } from '../components/RiderHeader';
import { RiderProfileModal } from '../components/RiderProfileModal';
import { RiderOrderDetailModal } from '../components/RiderOrderDetailModal';
import { riderApi } from '@/api/rider.api';
import type { RiderProfile, RiderDashboardSummary, RiderOrder, AvailabilityStatus } from '@/api/rider.api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export const RiderDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [summary, setSummary] = useState<RiderDashboardSummary | null>(null);
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingDuty, setUpdatingDuty] = useState(false);

  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RiderOrder | null>(null);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [profData, dashData, assignedList] = await Promise.all([
        riderApi.getProfile(),
        riderApi.getDashboard(),
        riderApi.getAssignedOrders(),
      ]);

      setProfile(profData);
      setSummary(dashData);
      setOrders(assignedList);
    } catch (err: any) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDutyChange = async (nextStatus: AvailabilityStatus) => {
    setUpdatingDuty(true);
    try {
      await riderApi.updateAvailability(nextStatus);
      toast.success(`Duty status updated to ${nextStatus.toUpperCase()}`);
      fetchDashboardData();
    } catch (err: any) {
      toast.error('Failed to update duty status');
    } finally {
      setUpdatingDuty(false);
    }
  };

  const handleOpenOrderDetail = (order: RiderOrder) => {
    setSelectedOrder(order);
    setIsOrderDetailModalOpen(true);
  };

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    const orderNo = order.order_number.toLowerCase();
    const custPhone = (order.address_snapshot?.receiver_phone || order.customer?.user?.phone_number || '').toLowerCase();
    const custName = (order.address_snapshot?.receiver_name || '').toLowerCase();
    return orderNo.includes(q) || custPhone.includes(q) || custName.includes(q);
  });

  const isProfileComplete = summary?.is_profile_complete ?? profile?.is_profile_complete ?? false;
  const activeOrder = summary?.active_order;
  const riderName = profile?.first_name || user?.first_name || 'Express Rider';

  return (
    <div className="min-h-screen bg-surface-base text-content-primary flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Header Bar */}
      <RiderHeader
        profile={profile}
        onRefreshProfile={fetchDashboardData}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-24 md:pb-8">
        
        {/* HERO GREETING & DUTY BAR */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-950/80 via-surface-card to-emerald-950/70 border border-cyan-500/30 p-4 sm:p-8 shadow-2xl shadow-cyan-950/30">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
            
            {/* Greeting */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-bold border border-cyan-500/30">
                <Zap className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                <span>ONEMED FLEET NETWORK</span>
              </div>
              <h1 className="font-head font-black text-xl sm:text-3xl text-content-primary tracking-tight">
                Welcome back, <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">{riderName}</span> 👋
              </h1>
              <p className="text-xs sm:text-sm text-content-muted max-w-xl">
                Real-time express dispatch console. Keep your profile complete and manage active deliveries seamlessly.
              </p>
            </div>

            {/* Quick Duty Toggle Bar */}
            <div className="p-3 bg-surface-base/80 backdrop-blur-xl border border-border-default/80 rounded-2xl shadow-lg shrink-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-content-secondary">
                  Set Duty Mode:
                </span>
                <button
                  onClick={fetchDashboardData}
                  disabled={isLoading}
                  className="p-1.5 text-content-secondary hover:text-cyan-400 hover:bg-cyan-500/15 rounded-xl transition-colors border border-border-default/60"
                  title="Refresh Metrics"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => handleDutyChange('online')}
                  disabled={updatingDuty}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    profile?.availability_status === 'online'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 font-black'
                      : 'bg-surface-subtle/60 text-content-secondary border-border-default/60 hover:bg-emerald-500/15 hover:text-emerald-400'
                  }`}
                >
                  🟢 Online
                </button>

                <button
                  onClick={() => handleDutyChange('busy')}
                  disabled={updatingDuty}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    profile?.availability_status === 'busy'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 font-black'
                      : 'bg-surface-subtle/60 text-content-secondary border-border-default/60 hover:bg-amber-500/15 hover:text-amber-300'
                  }`}
                >
                  🟠 Busy
                </button>

                <button
                  onClick={() => handleDutyChange('offline')}
                  disabled={updatingDuty}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    profile?.availability_status === 'offline'
                      ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20 font-black'
                      : 'bg-surface-subtle/60 text-content-secondary border-border-default/60 hover:bg-rose-500/15 hover:text-rose-400'
                  }`}
                >
                  🔴 Offline
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* 🚨 MANDATORY PROFILE COMPLETENESS ENFORCEMENT BANNER */}
        {!isProfileComplete && (
          <div className="relative overflow-hidden p-5 bg-gradient-to-r from-amber-500/20 via-surface-card to-orange-500/15 border-2 border-amber-500/40 rounded-3xl shadow-xl shadow-amber-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-head font-black text-base text-amber-300 uppercase tracking-wide">
                  Welcome to OneMed Rider Logistics Fleet
                </h3>
                <p className="text-xs text-amber-200/90 leading-relaxed max-w-2xl">
                  You are restricted from picking up medicine stock or updating delivery statuses until your NID Number, Driving License, Vehicle Details, and Contact Phone are saved in your profile.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/25 transition-transform hover:scale-105 shrink-0 text-center"
            >
              Complete Profile Credentials Now
            </button>
          </div>
        )}

        {/* GLOWING STAT CARDS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          
          {/* Card 1: Today's Deliveries */}
          <div className="relative overflow-hidden p-4 sm:p-6 bg-surface-card/90 border border-border-default/80 rounded-3xl shadow-lg hover:shadow-cyan-500/10 hover:border-cyan-500/40 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-content-muted">Today's Completed</span>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <PackageCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <h3 className="font-head font-black text-2xl sm:text-3xl text-cyan-300">
                {summary?.today_completed_deliveries ?? 0}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-content-muted mt-1 flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">Verified deliveries</span>
              </p>
            </div>
          </div>

          {/* Card 2: Today's Earnings (COD Cash) */}
          <div className="relative overflow-hidden p-4 sm:p-6 bg-surface-card/90 border border-border-default/80 rounded-3xl shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500/40 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-content-muted">Today's COD</span>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Banknote className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <h3 className="font-head font-black text-2xl sm:text-3xl text-emerald-400">
                ৳{summary?.today_earnings_bdt ? summary.today_earnings_bdt.toLocaleString() : '0'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-content-muted mt-1 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">Cash revenue</span>
              </p>
            </div>
          </div>

          {/* Card 3: Lifetime Deliveries */}
          <div className="relative overflow-hidden p-4 sm:p-6 bg-surface-card/90 border border-border-default/80 rounded-3xl shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/40 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-content-muted">Lifetime Tasks</span>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <h3 className="font-head font-black text-2xl sm:text-3xl text-purple-300">
                {summary?.total_completed_deliveries ?? 0}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-content-muted mt-1 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                <span className="truncate">Total fulfilled</span>
              </p>
            </div>
          </div>

          {/* Card 4: Assigned Workload Pool */}
          <div className="relative overflow-hidden p-4 sm:p-6 bg-surface-card/90 border border-border-default/80 rounded-3xl shadow-lg hover:shadow-amber-500/10 hover:border-amber-500/40 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-content-muted">Assigned Pool</span>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bike className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <h3 className="font-head font-black text-2xl sm:text-3xl text-amber-300">
                {summary?.assigned_orders_count ?? orders.length}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-content-muted mt-1 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">Pending tasks</span>
              </p>
            </div>
          </div>

        </div>

        {/* 📌 SINGLE ACTIVE ORDER CONSOLE (PINNED ACTIVE DELIVERY) */}
        {activeOrder && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-950/60 via-surface-card to-emerald-950/50 border-2 border-cyan-500/40 p-5 sm:p-8 shadow-2xl shadow-cyan-950/40 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default/70">
              <div className="flex items-center space-x-3">
                <div className="relative flex h-4 w-4 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-head font-black text-lg sm:text-xl text-cyan-300">
                      Active Delivery: #{activeOrder.order_number}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase border border-cyan-500/40">
                      Active Task Locked
                    </span>
                  </div>
                  <p className="text-xs text-content-muted mt-0.5">
                    Finish this delivery before starting another package pickup.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleOpenOrderDetail(activeOrder)}
                className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 shrink-0 transition-transform hover:scale-105"
              >
                <Truck className="w-4 h-4" />
                <span>Open Active Delivery Controls</span>
              </button>
            </div>

            {/* Quick Details & Progress Step */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 text-xs">
              <div className="p-3.5 sm:p-4 bg-surface-base/60 border border-border-default/60 rounded-2xl space-y-1">
                <span className="text-content-muted font-semibold">Current Progress Status:</span>
                <p className="font-head font-black text-sm text-cyan-400 uppercase">
                  {activeOrder.order_status.replace(/_/g, ' ')}
                </p>
              </div>

              <div className="p-3.5 sm:p-4 bg-surface-base/60 border border-border-default/60 rounded-2xl space-y-1">
                <span className="text-content-muted font-semibold">Customer Receiver Phone:</span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="font-mono font-bold text-content-primary">
                    {activeOrder.address_snapshot?.receiver_phone || activeOrder.customer?.user?.phone_number || 'N/A'}
                  </span>
                  {(activeOrder.address_snapshot?.receiver_phone || activeOrder.customer?.user?.phone_number) && (
                    <a
                      href={`tel:${activeOrder.address_snapshot?.receiver_phone || activeOrder.customer?.user?.phone_number}`}
                      className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold border border-emerald-500/40 hover:bg-emerald-500/30"
                    >
                      Call
                    </a>
                  )}
                </div>
              </div>

              <div className="p-3.5 sm:p-4 bg-surface-base/60 border border-border-default/60 rounded-2xl space-y-1">
                <span className="text-content-muted font-semibold">Grand Total & Payment Mode:</span>
                <p className="font-head font-black text-sm text-emerald-400">
                  ৳{activeOrder.grand_total} <span className="text-xs font-semibold text-content-secondary">({activeOrder.payment_method})</span>
                </p>
              </div>
            </div>

          </div>
        )}

        {/* ASSIGNED ORDERS SECTION */}
        <div className="bg-surface-card/90 border border-border-default/80 rounded-3xl shadow-xl overflow-hidden space-y-4">
          
          <div className="p-5 sm:p-6 border-b border-border-default/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-head font-black text-xl text-content-primary flex items-center space-x-2">
                <PackageCheck className="w-5 h-5 text-cyan-400" />
                <span>Assigned Deliveries Pool</span>
              </h2>
              <p className="text-xs text-content-muted mt-0.5">
                Orders assigned by admin for vendor pickup collection and express delivery
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-content-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order #, phone, zone..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface-base/80 border border-border-default rounded-2xl text-xs text-content-primary focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Table / Cards List */}
          {isLoading ? (
            <div className="p-12 text-center text-content-muted space-y-3">
              <Loader2 className="w-9 h-9 animate-spin mx-auto text-cyan-400" />
              <p className="text-xs font-semibold">Fetching assigned tasks from logistics engine...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-content-muted space-y-3">
              <PackageCheck className="w-12 h-12 mx-auto text-content-muted opacity-30" />
              <p className="font-head font-bold text-base text-content-secondary">No Assigned Orders Available</p>
              <p className="text-xs max-w-sm mx-auto">When orders are assigned to your rider profile by dispatch admin, they will appear here live.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs text-content-primary">
                  <thead className="bg-surface-subtle/80 text-content-muted uppercase tracking-wider font-bold border-b border-border-default/80">
                    <tr>
                      <th className="px-6 py-4">Order Number</th>
                      <th className="px-6 py-4">Customer & Phone</th>
                      <th className="px-6 py-4">Delivery Destination</th>
                      <th className="px-6 py-4">Amount & Payment</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default/50">
                    {filteredOrders.map((order) => {
                      const isCurrentActive = activeOrder?.id === order.id;
                      const custName = order.address_snapshot?.receiver_name || 
                                       `${order.customer?.user?.first_name || ''} ${order.customer?.user?.last_name || ''}`.trim() || 
                                       'Customer';
                      const custPhone = order.address_snapshot?.receiver_phone || order.customer?.user?.phone_number || '';
                      const area = order.address_snapshot?.area || order.address_snapshot?.city || 'Dhaka';

                      return (
                        <tr
                          key={order.id}
                          className={`hover:bg-surface-subtle/40 transition-colors ${
                            isCurrentActive ? 'bg-cyan-500/10' : ''
                          }`}
                        >
                          <td className="px-6 py-4 font-mono font-bold text-cyan-400">
                            #{order.order_number}
                            {isCurrentActive && (
                              <span className="ml-2 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] uppercase font-sans font-black">
                                Active
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <p className="font-bold text-content-primary">{custName}</p>
                            <p className="text-content-muted font-mono text-[11px] mt-0.5">{custPhone}</p>
                          </td>

                          <td className="px-6 py-4 text-content-secondary">
                            <span className="flex items-center space-x-1.5 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span>{area}</span>
                            </span>
                          </td>

                          <td className="px-6 py-4 font-bold text-emerald-400">
                            ৳{order.grand_total}
                            <span className="block text-[10px] text-content-muted font-normal">
                              {order.payment_method} ({order.payment_status})
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              order.order_status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              order.order_status === 'OUT_FOR_DELIVERY' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                              order.order_status === 'PACKED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                              'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {order.order_status.replace(/_/g, ' ')}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleOpenOrderDetail(order)}
                              className="px-4 py-2 bg-gradient-to-r from-cyan-500/15 to-emerald-500/15 hover:from-cyan-500/30 hover:to-emerald-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold flex items-center space-x-1.5 ml-auto transition-all shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden p-4 space-y-3">
                {filteredOrders.map((order) => {
                  const isCurrentActive = activeOrder?.id === order.id;
                  const custName = order.address_snapshot?.receiver_name || 
                                   `${order.customer?.user?.first_name || ''} ${order.customer?.user?.last_name || ''}`.trim() || 
                                   'Customer';
                  const custPhone = order.address_snapshot?.receiver_phone || order.customer?.user?.phone_number || '';
                  const area = order.address_snapshot?.area || order.address_snapshot?.city || 'Dhaka';

                  return (
                    <div
                      key={order.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isCurrentActive 
                          ? 'bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/10' 
                          : 'bg-surface-base/80 border-border-default/80 hover:border-cyan-500/30'
                      }`}
                    >
                      {/* Top Row: Order # & Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-sm text-cyan-400">
                            #{order.order_number}
                          </span>
                          {isCurrentActive && (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase">
                              Active
                            </span>
                          )}
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.order_status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          order.order_status === 'OUT_FOR_DELIVERY' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                          order.order_status === 'PACKED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {order.order_status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border-default/60">
                        <div>
                          <span className="text-[10px] text-content-muted font-medium block">Customer</span>
                          <span className="font-bold text-content-primary truncate block">{custName}</span>
                          <span className="font-mono text-[11px] text-content-muted block">{custPhone}</span>
                        </div>

                        <div>
                          <span className="text-[10px] text-content-muted font-medium block">Destination</span>
                          <span className="flex items-center space-x-1 font-semibold text-content-secondary mt-0.5">
                            <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="truncate">{area}</span>
                          </span>
                        </div>
                      </div>

                      {/* Amount & Call */}
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-border-default/60">
                        <div>
                          <span className="text-[10px] text-content-muted block">Grand Total</span>
                          <span className="font-bold text-emerald-400">৳{order.grand_total} <span className="text-[10px] font-normal text-content-muted">({order.payment_method})</span></span>
                        </div>

                        {custPhone && (
                          <a
                            href={`tel:${custPhone}`}
                            className="px-2.5 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center space-x-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </a>
                        )}
                      </div>

                      {/* Details Button */}
                      <button
                        onClick={() => handleOpenOrderDetail(order)}
                        className="w-full py-2.5 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 hover:from-cyan-500/30 hover:to-emerald-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-sm"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Order & Pickup Locations</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>

      </main>

      {/* Modals */}
      <RiderProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onProfileUpdated={fetchDashboardData}
      />

      <RiderOrderDetailModal
        isOpen={isOrderDetailModalOpen}
        onClose={() => setIsOrderDetailModalOpen(false)}
        order={selectedOrder}
        isProfileComplete={isProfileComplete}
        activeOrderNumber={activeOrder?.order_number}
        onOrderUpdated={fetchDashboardData}
      />

    </div>
  );
};
