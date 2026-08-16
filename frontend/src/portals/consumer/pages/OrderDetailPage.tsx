import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  ArrowLeft,
  Package,
  Clock,
  MapPin,
  FileText,
  Tag,
  AlertCircle,
  Crosshair,
  ShieldCheck,
  User,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '@/api/orders.api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import type { OrderStatus } from '@/types/order.types';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; colorClass: string }
> = {
  PLACED: { label: 'Order Placed', colorClass: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  CONFIRMED: { label: 'Confirmed', colorClass: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' },
  PROCESSING: { label: 'Processing', colorClass: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  PACKED: { label: 'Packed & Ready', colorClass: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', colorClass: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  DELIVERED: { label: 'Delivered', colorClass: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  CANCELLED: { label: 'Cancelled', colorClass: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Fetch single order details
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await ordersApi.getOrder(id);
      return res.data;
    },
    enabled: Boolean(id),
  });

  // Cancel order mutation
  const cancelMutation = useMutation({
    mutationFn: async (orderId: string | number) => {
      const res = await ordersApi.cancelOrder(orderId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      toast.success('Order cancelled successfully.');
      setIsCancelModalOpen(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to cancel order.';
      toast.error(msg);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-20 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="md:col-span-2 h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="font-head font-bold text-xl text-content-primary">Order Not Found</h2>
        <p className="text-xs text-content-secondary">
          We couldn't retrieve the details for this order.
        </p>
        <Button variant="primary" onClick={() => navigate('/account/orders')} className="rounded-full px-6 font-bold">
          Back to Orders
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[order.order_status] || {
    label: order.order_status,
    colorClass: 'text-content-secondary border-bg-border bg-bg-surface',
  };

  const isCancelable = order.order_status === 'PLACED';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ── BREADCRUMB / BACK BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-bg-border pb-6">
        <div>
          <button
            type="button"
            onClick={() => navigate('/account/orders')}
            className="inline-flex items-center gap-1.5 text-xs text-content-muted hover:text-primary-400 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Orders
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-head text-2xl sm:text-3xl font-extrabold text-content-primary font-mono">
              {order.order_number}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold border ${statusCfg.colorClass}`}
            >
              {statusCfg.label}
            </span>
          </div>
          <p className="text-xs text-content-secondary mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-content-muted" />
            <span>Placed on {new Date(order.placed_at || order.created_at).toLocaleString()}</span>
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-3 flex-wrap">
          {isCancelable && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCancelModalOpen(true)}
              className="rounded-full text-xs text-red-400 hover:bg-red-500/10 border-red-500/30"
            >
              Cancel Order
            </Button>
          )}

          <Link to={`/account/orders/${order.id}/tracking`}>
            <Button variant="primary" size="sm" className="rounded-full text-xs font-bold gap-1.5 shadow-glow">
              <Crosshair className="w-4 h-4" /> Live Tracking
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ── LEFT COLUMN: ITEMS & TIMELINE ── */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. ORDER ITEMS (Immutable Snapshot) */}
          <div className="bg-bg-card border border-bg-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-card">
            <h2 className="font-head font-bold text-base text-content-primary border-b border-bg-border pb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-400" /> Order Items ({order.items.length})
            </h2>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-bg-surface/50 border border-bg-border/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-bold text-content-primary text-sm">
                      {item.product_snapshot?.name || 'Medicine Item'}
                    </p>
                    {item.product_snapshot?.sku && (
                      <p className="text-[11px] font-mono text-content-muted">
                        SKU: {item.product_snapshot.sku}
                      </p>
                    )}
                    <p className="text-[11px] font-mono text-content-secondary">
                      ৳{item.unit_price} × {item.quantity} units
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[10px] text-content-muted block uppercase">Item Total</span>
                    <span className="font-mono font-extrabold text-base text-primary-400">
                      ৳{item.total_price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. SHIPPING ADDRESS SNAPSHOT */}
          {order.address_snapshot && (
            <div className="bg-bg-card border border-bg-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-card">
              <h2 className="font-head font-bold text-base text-content-primary border-b border-bg-border pb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-400" /> Shipping & Receiver Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {order.address_snapshot.receiver_name && (
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-content-muted block font-semibold">Receiver Name</span>
                    <p className="font-bold text-content-primary flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary-400" /> {order.address_snapshot.receiver_name}
                    </p>
                  </div>
                )}

                {order.address_snapshot.receiver_phone && (
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-content-muted block font-semibold">Contact Number</span>
                    <p className="font-mono text-content-primary flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-primary-400" /> {order.address_snapshot.receiver_phone}
                    </p>
                  </div>
                )}

                <div className="sm:col-span-2 space-y-0.5 pt-2 border-t border-bg-border/50">
                  <span className="text-[11px] text-content-muted block font-semibold">Full Address</span>
                  <p className="text-content-primary leading-relaxed font-medium">
                    {order.address_snapshot.full_address}
                    <br />
                    {order.address_snapshot.area}, {order.address_snapshot.city}{' '}
                    {order.address_snapshot.postal_code ? `- ${order.address_snapshot.postal_code}` : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. ORDER TIMELINE / STATUS HISTORY */}
          {order.status_history && order.status_history.length > 0 && (
            <div className="bg-bg-card border border-bg-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-card">
              <h2 className="font-head font-bold text-base text-content-primary border-b border-bg-border pb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-400" /> Status Update Activity Log
              </h2>

              <div className="relative pl-6 space-y-6 border-l-2 border-primary-500/30">
                {order.status_history.map((hist, idx) => (
                  <div key={idx} className="relative space-y-1">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-primary-600 border-2 border-bg-card" />
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                      <span className="font-bold text-content-primary capitalize">
                        {hist.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-content-muted font-mono">
                        {new Date(hist.created_at).toLocaleString()}
                      </span>
                    </div>
                    {hist.remarks && (
                      <p className="text-xs text-content-secondary leading-relaxed bg-bg-surface p-2.5 rounded-xl border border-bg-border/60">
                        {hist.remarks}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: PRICING & PAYMENT SUMMARY ── */}
        <div className="space-y-6 sticky top-24">
          <div className="bg-bg-card border border-bg-border rounded-3xl p-6 space-y-6 shadow-card">
            <h2 className="font-head font-bold text-base text-content-primary border-b border-bg-border pb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-400" /> Payment & Invoice Summary
            </h2>

            {/* Applied Coupon Info if any */}
            {order.coupon_snapshot && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center gap-2 text-xs text-emerald-400 font-bold">
                <Tag className="w-4 h-4" />
                <span>Coupon Applied: {order.coupon_snapshot.code}</span>
              </div>
            )}

            {/* Calculations */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-content-secondary">
                <span>Subtotal</span>
                <span className="font-mono font-medium text-content-primary">৳{order.subtotal}</span>
              </div>

              <div className="flex justify-between text-content-secondary">
                <span>Delivery Charge</span>
                <span className="font-mono font-medium text-emerald-400">
                  {parseFloat(order.delivery_charge) === 0 ? 'FREE' : `৳${order.delivery_charge}`}
                </span>
              </div>

              {parseFloat(order.discount) > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Discount</span>
                  <span className="font-mono">- ৳{order.discount}</span>
                </div>
              )}

              <div className="flex justify-between text-content-secondary">
                <span>Estimated Tax</span>
                <span className="font-mono text-content-muted">৳{order.tax}</span>
              </div>

              <div className="pt-3 border-t border-bg-border flex justify-between items-baseline text-content-primary">
                <span className="font-head font-extrabold text-base">Grand Total</span>
                <span className="font-mono font-extrabold text-2xl text-primary-400">
                  ৳{order.grand_total}
                </span>
              </div>
            </div>

            {/* Payment Status Card */}
            <div className="bg-bg-surface p-4 rounded-2xl border border-bg-border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-content-muted font-semibold">Payment Method</span>
                <Badge variant="info" className="font-mono">
                  {order.payment_method}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-content-muted font-semibold">Payment Status</span>
                <span
                  className={`font-bold ${
                    order.payment_status === 'PAID' ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {order.payment_status}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-content-muted text-center pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>OneMed Certified Official Receipt</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CANCEL MODAL ── */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCancelModalOpen(false)}
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
                  Are you sure you want to cancel order #{order.order_number}?
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="rounded-full px-5 text-xs font-semibold"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate(order.id)}
                  className="rounded-full px-6 text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-glow"
                >
                  Confirm Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
