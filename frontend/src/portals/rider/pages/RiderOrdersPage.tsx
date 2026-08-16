import React, { useState, useEffect } from 'react';
import { 
  PackageCheck, 
  Search, 
  MapPin, 
  Phone, 
  Eye, 
  Filter, 
  RefreshCw, 
  Loader2, 
  Truck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { RiderHeader } from '../components/RiderHeader';
import { RiderProfileModal } from '../components/RiderProfileModal';
import { RiderOrderDetailModal } from '../components/RiderOrderDetailModal';
import { riderApi } from '@/api/rider.api';
import type { RiderProfile, RiderOrder } from '@/api/rider.api';
import toast from 'react-hot-toast';

export const RiderOrdersPage: React.FC = () => {
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RiderOrder | null>(null);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);

  const fetchOrdersData = async () => {
    setIsLoading(true);
    try {
      const [profData, assignedList] = await Promise.all([
        riderApi.getProfile(),
        riderApi.getAssignedOrders(),
      ]);

      setProfile(profData);
      setOrders(assignedList);
    } catch (err: any) {
      toast.error('Failed to load assigned deliveries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersData();
  }, []);

  const handleOpenOrderDetail = (order: RiderOrder) => {
    setSelectedOrder(order);
    setIsOrderDetailModalOpen(true);
  };

  // Find active order if any
  const activeOrder = orders.find(o => ['PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY'].includes(o.order_status));

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    const orderNo = order.order_number.toLowerCase();
    const custPhone = (order.address_snapshot?.receiver_phone || order.customer?.user?.phone_number || '').toLowerCase();
    const custName = (order.address_snapshot?.receiver_name || '').toLowerCase();
    const matchesSearch = orderNo.includes(q) || custPhone.includes(q) || custName.includes(q);

    if (statusFilter === 'active') {
      return matchesSearch && ['PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY'].includes(order.order_status);
    }
    if (statusFilter === 'completed') {
      return matchesSearch && order.order_status === 'DELIVERED';
    }
    return matchesSearch;
  });

  const isProfileComplete = profile?.is_profile_complete ?? false;

  return (
    <div className="min-h-screen bg-surface-base text-content-primary flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Header Bar */}
      <RiderHeader
        profile={profile}
        onRefreshProfile={fetchOrdersData}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-24 md:pb-8">
        
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-bold border border-cyan-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>DISPATCH WORKLOAD MANAGEMENT</span>
            </div>
            <h1 className="font-head font-black text-2xl sm:text-3xl text-content-primary flex items-center space-x-3">
              <span>Assigned Delivery Tasks</span>
            </h1>
            <p className="text-xs sm:text-sm text-content-muted mt-1">
              Manage medicine package pickups from vendors and customer destination fulfillments
            </p>
          </div>

          <button
            onClick={fetchOrdersData}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-surface-card border border-border-default/80 hover:bg-surface-subtle text-content-primary rounded-2xl text-xs font-bold shadow-md transition-all shrink-0 w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Tasks</span>
          </button>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="p-4 sm:p-5 bg-surface-card/90 border border-border-default/80 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Status Tabs with Horizontal Scroll for Mobile */}
          <div className="flex items-center space-x-2 p-1.5 bg-surface-base/80 border border-border-default/80 rounded-2xl text-xs font-bold overflow-x-auto no-scrollbar whitespace-nowrap max-w-full">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-emerald-500/30 text-cyan-300 shadow-md border border-cyan-500/40'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              All Tasks ({orders.length})
            </button>

            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
                statusFilter === 'active'
                  ? 'bg-amber-500/30 text-amber-300 shadow-md border border-amber-500/40'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              In Progress ({orders.filter(o => ['PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY'].includes(o.order_status)).length})
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
                statusFilter === 'completed'
                  ? 'bg-emerald-500/30 text-emerald-300 shadow-md border border-emerald-500/40'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Completed ({orders.filter(o => o.order_status === 'DELIVERED').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-content-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by order #, phone, receiver..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-base/80 border border-border-default rounded-2xl text-xs text-content-primary focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Orders Table & Cards View */}
        <div className="bg-surface-card/90 border border-border-default/80 rounded-3xl shadow-xl overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-content-muted space-y-3">
              <Loader2 className="w-9 h-9 animate-spin mx-auto text-cyan-400" />
              <p className="text-xs font-semibold">Fetching delivery workload from DRF server...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-content-muted space-y-3">
              <PackageCheck className="w-12 h-12 mx-auto text-content-muted opacity-30" />
              <p className="font-head font-bold text-base text-content-secondary">No Assigned Deliveries Match Filter</p>
              <p className="text-xs">Adjust your search parameters or status tabs above.</p>
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
                                Active Delivery
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
                              <span>View Pickup Locations</span>
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
                        <span>View Pickup Locations</span>
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
        onProfileUpdated={fetchOrdersData}
      />

      <RiderOrderDetailModal
        isOpen={isOrderDetailModalOpen}
        onClose={() => setIsOrderDetailModalOpen(false)}
        order={selectedOrder}
        isProfileComplete={isProfileComplete}
        activeOrderNumber={activeOrder?.order_number}
        onOrderUpdated={fetchOrdersData}
      />

    </div>
  );
};
