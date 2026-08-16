import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Package,
  MapPin,
  Clock,
  ShoppingBag,
  Banknote,
} from 'lucide-react';
import { ordersApi } from '@/api/orders.api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';

export default function OrderSuccessPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const id = orderId ? parseInt(orderId, 10) : null;

  // Fetch placed order details
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await ordersApi.getOrder(id);
      return res.data;
    },
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="font-head font-extrabold text-2xl text-content-primary">Order Not Found</h2>
        <p className="text-xs text-content-secondary">
          We could not locate the details for this order.
        </p>
        <Button variant="primary" onClick={() => navigate('/account/orders')} className="rounded-full px-6">
          View All My Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* ── CELEBRATION HERO BANNER ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-bg-card border border-primary-500/30 rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-glow-lg relative overflow-hidden"
      >
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg animate-pulse">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <Badge variant="success" className="px-3 py-1 text-xs font-bold uppercase tracking-wider mx-auto">
            Order Confirmed & Placed
          </Badge>
          <h1 className="font-head font-extrabold text-2xl sm:text-4xl text-content-primary tracking-tight">
            Thank You for Your Order! 🎉
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary max-w-md mx-auto">
            Your medicine order <span className="font-mono font-bold text-primary-400">#{order.order_number}</span> has been dispatched to our partner pharmacy.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-bg-surface/80 px-4 py-2 rounded-2xl border border-bg-border text-xs text-content-secondary font-medium">
          <Clock className="w-4 h-4 text-accent-400" />
          <span>Estimated Express Delivery: <strong className="text-content-primary">Within 24 Hours</strong></span>
        </div>
      </motion.div>

      {/* ── ORDER SUMMARY CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-bg-card border border-bg-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-card"
      >
        <div className="flex items-center justify-between border-b border-bg-border pb-4">
          <div>
            <h2 className="font-head font-bold text-base text-content-primary">Order Summary</h2>
            <p className="text-xs text-content-muted">Placed on {new Date(order.placed_at || order.created_at).toLocaleString()}</p>
          </div>

          <span className="px-3 py-1 rounded-full bg-primary-600/20 text-primary-400 border border-primary-500/30 text-xs font-bold font-mono">
            {order.order_number}
          </span>
        </div>

        {/* Delivery & Payment Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-bg-surface/60 p-4 rounded-2xl border border-bg-border/60 space-y-2">
            <h3 className="font-head font-bold text-content-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary-400" /> Shipping Address
            </h3>
            {order.address_snapshot ? (
              <div className="space-y-0.5 text-content-secondary">
                <p className="font-semibold text-content-primary">{order.address_snapshot.receiver_name || 'Valued Customer'}</p>
                <p className="font-mono text-[11px]">{order.address_snapshot.receiver_phone}</p>
                <p>{order.address_snapshot.full_address}</p>
                <p>{order.address_snapshot.area}, {order.address_snapshot.city}</p>
              </div>
            ) : (
              <p className="text-content-muted">Address details saved</p>
            )}
          </div>

          <div className="bg-bg-surface/60 p-4 rounded-2xl border border-bg-border/60 space-y-2">
            <h3 className="font-head font-bold text-content-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-primary-400" /> Payment Details
            </h3>
            <div className="space-y-1 text-content-secondary">
              <div className="flex items-center gap-2">
                <span className="font-bold text-content-primary">Payment Method:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[11px]">
                  Cash on Delivery (COD)
                </span>
              </div>
              <p className="text-[11px] text-content-muted">
                Pay <strong>৳{order.grand_total}</strong> directly to the delivery rider.
              </p>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3 pt-2">
          <h3 className="font-head font-bold text-xs text-content-primary uppercase tracking-wider">
            Ordered Items ({order.items?.length || 0})
          </h3>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {order.items?.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 text-xs bg-bg-surface/40 p-3 rounded-2xl border border-bg-border/50"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold text-content-primary">
                    {item.product_snapshot?.name || 'Medicine Product'}
                  </p>
                  <p className="text-[11px] text-content-muted">
                    Qty: {item.quantity} × ৳{item.unit_price}
                  </p>
                </div>

                <span className="font-mono font-bold text-primary-400">
                  ৳{item.total_price}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="pt-4 border-t border-bg-border space-y-2 text-xs">
          <div className="flex justify-between text-content-secondary">
            <span>Subtotal</span>
            <span className="font-mono font-medium text-content-primary">৳{order.subtotal}</span>
          </div>

          <div className="flex justify-between text-content-secondary">
            <span>Delivery Fee</span>
            <span className="font-mono font-medium text-emerald-400">
              {parseFloat(order.delivery_charge || '0') === 0 ? 'FREE' : `৳${order.delivery_charge}`}
            </span>
          </div>

          {parseFloat(order.discount || '0') > 0 && (
            <div className="flex justify-between text-emerald-400 font-semibold">
              <span>Coupon Discount</span>
              <span className="font-mono">- ৳{order.discount}</span>
            </div>
          )}

          <div className="pt-3 border-t border-bg-border flex justify-between items-baseline text-content-primary">
            <span className="font-head font-extrabold text-base">Grand Total (COD)</span>
            <span className="font-mono font-extrabold text-2xl text-primary-400">
              ৳{order.grand_total}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── ACTION BUTTONS ── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <Link to={`/account/orders/${order.id}/tracking`} className="w-full sm:w-auto">
          <Button variant="primary" size="lg" className="w-full rounded-full font-bold shadow-glow gap-2 text-xs">
            <Clock className="w-4 h-4" /> Track Order Status
          </Button>
        </Link>

        <Link to="/account/orders" className="w-full sm:w-auto">
          <Button variant="outline" size="lg" className="w-full rounded-full font-bold gap-2 text-xs">
            <Package className="w-4 h-4" /> View All Orders
          </Button>
        </Link>

        <Link to="/products" className="w-full sm:w-auto">
          <Button variant="ghost" size="lg" className="w-full rounded-full font-bold gap-2 text-xs">
            <ShoppingBag className="w-4 h-4" /> Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
