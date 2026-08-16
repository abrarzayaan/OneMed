import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Phone,
  User,
  Navigation,
  AlertCircle,
  RefreshCw,
  Box,
  CheckCheck,
} from 'lucide-react';
import { ordersApi } from '@/api/orders.api';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import type { OrderStatus } from '@/types/order.types';

const STEPS: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'PLACED', label: 'Order Placed', icon: <Clock className="w-4 h-4" /> },
  { status: 'CONFIRMED', label: 'Confirmed', icon: <CheckCircle2 className="w-4 h-4" /> },
  { status: 'PROCESSING', label: 'Preparing', icon: <Package className="w-4 h-4" /> },
  { status: 'PACKED', label: 'Packed', icon: <Box className="w-4 h-4" /> },
  { status: 'OUT_FOR_DELIVERY', label: 'On The Way', icon: <Truck className="w-4 h-4" /> },
  { status: 'DELIVERED', label: 'Delivered', icon: <CheckCheck className="w-4 h-4" /> },
];

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch tracking data with auto-refetch every 30 seconds
  const { data: tracking, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['order-tracking', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await ordersApi.trackOrder(id);
      return res.data;
    },
    enabled: Boolean(id),
    refetchInterval: 30000, // 30s polling
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-20 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="font-head font-bold text-xl text-content-primary">Tracking Unavailable</h2>
        <p className="text-xs text-content-secondary">
          We couldn't retrieve real-time tracking data for this order.
        </p>
        <Button variant="primary" onClick={() => navigate('/account/orders')} className="rounded-full px-6 font-bold">
          Back to My Orders
        </Button>
      </div>
    );
  }

  const isCancelled = tracking.current_status === 'CANCELLED';

  // Find step index in sequence
  const currentStepIndex = STEPS.findIndex((s) => s.status === tracking.current_status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ── HEADER BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-bg-border pb-6">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/account/orders/${id}`)}
            className="inline-flex items-center gap-1.5 text-xs text-content-muted hover:text-primary-400 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Order Details
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-head text-2xl sm:text-3xl font-extrabold text-content-primary flex items-center gap-2.5">
              <Navigation className="w-7 h-7 text-cyan-400" /> Live Order Tracking
            </h1>
            <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              #{tracking.order_number}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-content-secondary hover:text-primary-400 bg-bg-card border border-bg-border px-3.5 py-2 rounded-full self-start sm:self-auto transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-primary-400' : ''}`} />
          <span>{isRefetching ? 'Refreshing...' : 'Refresh Status'}</span>
        </button>
      </div>

      {/* ── CANCELLED ALERT BANNER ── */}
      {isCancelled ? (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="font-head font-extrabold text-lg text-rose-300">Order Has Been Cancelled</h3>
          <p className="text-xs text-content-secondary max-w-md mx-auto">
            This order was cancelled. Real-time delivery tracking is inactive.
          </p>
        </div>
      ) : (
        <>
          {/* ── VISUAL STEPPER TRACKER ── */}
          <div className="bg-bg-card border border-bg-border rounded-3xl p-6 sm:p-8 space-y-8 shadow-card">
            <div className="flex items-center justify-between border-b border-bg-border pb-4">
              <div>
                <h3 className="font-head font-bold text-base text-content-primary">Delivery Stepper</h3>
                <p className="text-xs text-content-secondary">
                  Current Status: <span className="font-bold text-cyan-400 capitalize">{tracking.current_status.replace(/_/g, ' ')}</span>
                </p>
              </div>
              <span className="text-[11px] text-content-muted font-mono bg-bg-surface px-3 py-1 rounded-full border border-bg-border">
                Auto-refreshes every 30s
              </span>
            </div>

            {/* Stepper Progress Bar */}
            <div className="relative py-4">
              {/* Desktop Stepper */}
              <div className="hidden md:grid grid-cols-6 gap-2 text-center relative z-10">
                {STEPS.map((step, idx) => {
                  const isCompleted = currentStepIndex >= 0 && idx <= currentStepIndex;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step.status} className="flex flex-col items-center space-y-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isCurrent
                            ? 'bg-cyan-500 text-white ring-4 ring-cyan-500/30 shadow-glow scale-110'
                            : isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-bg-surface text-content-muted border border-bg-border'
                        }`}
                      >
                        {step.icon}
                      </div>

                      <div className="space-y-0.5">
                        <p
                          className={`text-xs font-bold ${
                            isCurrent ? 'text-cyan-400' : isCompleted ? 'text-content-primary' : 'text-content-muted'
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Stepper Vertical List */}
              <div className="md:hidden space-y-4">
                {STEPS.map((step, idx) => {
                  const isCompleted = currentStepIndex >= 0 && idx <= currentStepIndex;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step.status} className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isCurrent
                            ? 'bg-cyan-500 text-white ring-4 ring-cyan-500/30'
                            : isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-bg-surface text-content-muted border border-bg-border'
                        }`}
                      >
                        {step.icon}
                      </div>
                      <span
                        className={`text-xs font-bold ${
                          isCurrent ? 'text-cyan-400' : isCompleted ? 'text-content-primary' : 'text-content-muted'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── RIDER DETAILS CARD (IF ASSIGNED) ── */}
          {tracking.rider ? (
            <div className="bg-bg-card border border-bg-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-card">
              <h3 className="font-head font-bold text-base text-content-primary border-b border-bg-border pb-3 flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-400" /> Express Delivery Rider Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-bg-surface/50 p-4 rounded-2xl border border-bg-border space-y-2">
                  <span className="text-[11px] text-content-muted block font-semibold">Assigned Delivery Agent</span>
                  <p className="font-extrabold text-content-primary text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" /> {tracking.rider.name}
                  </p>
                  {tracking.rider.phone && (
                    <a
                      href={`tel:${tracking.rider.phone}`}
                      className="inline-flex items-center gap-1.5 text-xs text-primary-400 font-mono hover:underline font-bold"
                    >
                      <Phone className="w-3.5 h-3.5" /> {tracking.rider.phone}
                    </a>
                  )}
                </div>

                <div className="bg-bg-surface/50 p-4 rounded-2xl border border-bg-border space-y-2">
                  <span className="text-[11px] text-content-muted block font-semibold">Delivery Vehicle Info</span>
                  <p className="font-bold text-content-primary capitalize">
                    {tracking.rider.vehicle_type || 'Express Bike'}
                  </p>
                  {tracking.rider.vehicle_number && (
                    <p className="font-mono text-content-secondary text-xs">
                      Reg #: {tracking.rider.vehicle_number}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-bg-card border border-bg-border rounded-3xl p-6 text-center space-y-2 shadow-card">
              <Truck className="w-8 h-8 text-content-muted mx-auto" />
              <h4 className="font-head font-bold text-sm text-content-primary">Rider Assignment Pending</h4>
              <p className="text-xs text-content-secondary max-w-sm mx-auto">
                A dedicated express pharmacy delivery rider will be assigned once your order is packed.
              </p>
            </div>
          )}

          {/* ── TIMELINE HISTORY LOGS ── */}
          {tracking.history && tracking.history.length > 0 && (
            <div className="bg-bg-card border border-bg-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-card">
              <h3 className="font-head font-bold text-base text-content-primary border-b border-bg-border pb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-400" /> Real-time Activity Timeline Log
              </h3>

              <div className="relative pl-6 space-y-6 border-l-2 border-cyan-500/30">
                {tracking.history.map((log, idx) => (
                  <div key={idx} className="relative space-y-1">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-cyan-500 border-2 border-bg-card shadow-glow" />
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                      <span className="font-bold text-content-primary capitalize">
                        {log.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-content-muted font-mono">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    {log.remarks && (
                      <p className="text-xs text-content-secondary leading-relaxed bg-bg-surface p-3 rounded-2xl border border-bg-border/60">
                        {log.remarks}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
