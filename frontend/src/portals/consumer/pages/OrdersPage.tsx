import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Clock,
  MapPin,
  Eye,
  Crosshair,
  ShoppingBag,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '@/api/orders.api';
import AccountSidebar from '@/portals/consumer/components/account/AccountSidebar';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import type { Order, OrderStatus } from '@/types/order.types';

// Status badge colors & styling
const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; badgeVariant: 'info' | 'warning' | 'success' | 'danger' | 'default'; colorClass: string }
> = {
  PLACED: { label: 'Order Placed', badgeVariant: 'info', colorClass: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  CONFIRMED: { label: 'Confirmed', badgeVariant: 'info', colorClass: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' },
  PROCESSING: { label: 'Processing', badgeVariant: 'warning', colorClass: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  PACKED: { label: 'Packed & Ready', badgeVariant: 'warning', colorClass: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', badgeVariant: 'info', colorClass: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  DELIVERED: { label: 'Delivered', badgeVariant: 'success', colorClass: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  CANCELLED: { label: 'Cancelled', badgeVariant: 'danger', colorClass: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
};

type TabFilter = 'all' | 'active' | 'delivered' | 'cancelled';

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [cancelModalOrderId, setCancelModalOrderId] = useState<number | null>(null);

  // Fetch user orders list
  const { data, isLoading } = useQuery({
    queryKey: ['user-orders'],
    queryFn: async () => {
      const res = await ordersApi.getOrders();
      const raw = res.data;
      const list: Order[] = Array.isArray(raw) ? raw : raw.results || [];
      return list;
    },
  });

  const orders = data || [];

  // Cancel order mutation
  const cancelMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await ordersApi.cancelOrder(orderId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      toast.success('Order cancelled successfully.');
      setCancelModalOrderId(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to cancel order.';
      toast.error(msg);
    },
  });

  // Filter orders by tab
  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'active') {
      return ['PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY'].includes(
        order.order_status
      );
    }
    if (activeTab === 'delivered') {
      return order.order_status === 'DELIVERED';
    }
    if (activeTab === 'cancelled') {
      return order.order_status === 'CANCELLED';
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ── BREADCRUMB ── */}
      <div className="flex items-center gap-2 text-xs text-content-muted">
        <Link to="/" className="hover:text-content-primary">Home</Link>
        <span>/</span>
        <Link to="/account/profile" className="hover:text-content-primary">Account</Link>
        <span>/</span>
        <span className="text-content-primary font-bold">My Orders</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* ── ACCOUNT SIDEBAR ── */}
        <AccountSidebar />

        {/* ── MAIN CONTENT AREA ── */}
        <div className="flex-1 space-y-6 w-full">
          {/* Header Banner */}
          <div className="bg-bg-card border border-bg-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-bg-border pb-6">
              <div>
                <h1 className="font-head text-2xl sm:text-3xl font-extrabold text-content-primary flex items-center gap-2.5">
                  <Package className="w-7 h-7 text-primary-400" /> My Orders & History
                </h1>
                <p className="text-xs text-content-secondary mt-1">
                  Track your medicine deliveries, view invoice details, and review order status.
                </p>
              </div>

              <span className="px-3.5 py-1.5 rounded-full bg-primary-600/10 text-primary-400 border border-primary-500/20 text-xs font-extrabold self-start sm:self-auto">
                Total Orders: {orders.length}
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(
                [
                  { id: 'all', label: 'All Orders' },
                  { id: 'active', label: 'Active Orders' },
                  { id: 'delivered', label: 'Delivered' },
                  { id: 'cancelled', label: 'Cancelled' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white shadow-glow'
                      : 'bg-bg-surface text-content-secondary hover:text-content-primary border border-bg-border/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-44 rounded-3xl" />
              <Skeleton className="h-44 rounded-3xl" />
              <Skeleton className="h-44 rounded-3xl" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-bg-card border border-bg-border rounded-3xl p-12 text-center space-y-4 shadow-card">
              <div className="w-16 h-16 rounded-full bg-primary-600/10 text-primary-400 border border-primary-500/20 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-head font-extrabold text-lg text-content-primary">No Orders Found</h3>
                <p className="text-xs text-content-secondary max-w-sm mx-auto">
                  {activeTab === 'all'
                    ? "You haven't placed any medicine orders yet. Explore our genuine pharmacy items!"
                    : `No orders matching "${activeTab}" status.`}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => (window.location.href = '/products')}
                className="rounded-full px-6 font-bold shadow-glow"
              >
                Shop Medicines Now
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const statusCfg = STATUS_CONFIG[order.order_status] || {
                  label: order.order_status,
                  badgeVariant: 'default',
                  colorClass: 'text-content-secondary border-bg-border bg-bg-surface',
                };

                const isCancelable = order.order_status === 'PLACED';

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-bg-card border border-bg-border rounded-3xl p-6 space-y-5 shadow-card hover:border-primary-500/40 transition-all"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-bg-border pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-head font-extrabold text-sm text-content-primary font-mono">
                            {order.order_number}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${statusCfg.colorClass}`}
                          >
                            {statusCfg.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-content-muted flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Placed on: {new Date(order.placed_at || order.created_at).toLocaleString()}</span>
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-content-muted block">Grand Total</span>
                        <span className="font-mono font-extrabold text-lg text-primary-400">
                          ৳{order.grand_total}
                        </span>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold text-content-muted uppercase tracking-wider">
                        Order Items ({order.items.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="bg-bg-surface/50 border border-bg-border/60 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-content-primary truncate">
                                {item.product_snapshot?.name || 'Medicine Variant'}
                              </p>
                              <p className="text-[11px] font-mono text-content-muted">
                                ৳{item.unit_price} × {item.quantity}
                              </p>
                            </div>
                            <span className="font-mono font-bold text-content-primary shrink-0">
                              ৳{item.total_price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery & Payment Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-bg-border/60 text-xs">
                      <div className="flex items-center gap-2 text-content-secondary">
                        <MapPin className="w-4 h-4 text-primary-400 shrink-0" />
                        <span className="truncate max-w-xs">
                          {order.address_snapshot?.full_address || 'Shipping Address'}
                        </span>
                      </div>

                      {/* CTAs */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {isCancelable && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCancelModalOrderId(order.id)}
                            className="rounded-full text-xs text-red-400 hover:bg-red-500/10 border-red-500/30"
                          >
                            Cancel Order
                          </Button>
                        )}

                        <Link to={`/account/orders/${order.id}/tracking`}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs gap-1 font-semibold"
                          >
                            <Crosshair className="w-3.5 h-3.5 text-cyan-400" /> Live Tracking
                          </Button>
                        </Link>

                        <Link to={`/account/orders/${order.id}`}>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            className="rounded-full text-xs gap-1 font-bold shadow-glow"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── CANCEL CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {cancelModalOrderId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCancelModalOrderId(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-bg-card border border-bg-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-card z-10 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="font-head font-extrabold text-xl text-content-primary">Cancel Order?</h3>
                <p className="text-xs text-content-secondary leading-relaxed">
                  Are you sure you want to cancel this order? This action cannot be undone once confirmed.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCancelModalOrderId(null)}
                  className="rounded-full px-5 text-xs font-semibold"
                >
                  Keep Order
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={cancelMutation.isPending}
                  onClick={() => cancelModalOrderId && cancelMutation.mutate(cancelModalOrderId)}
                  className="rounded-full px-6 text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-glow"
                >
                  Yes, Cancel Order
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
