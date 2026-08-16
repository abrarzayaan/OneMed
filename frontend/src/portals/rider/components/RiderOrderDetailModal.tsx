import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Store, 
  PackageCheck, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  User, 
  Loader2,
  DollarSign,
  Navigation,
  Sparkles
} from 'lucide-react';
import { riderApi } from '@/api/rider.api';
import type { RiderOrder, RiderOrderItem } from '@/api/rider.api';
import toast from 'react-hot-toast';

interface RiderOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: RiderOrder | null;
  isProfileComplete: boolean;
  activeOrderNumber?: string | null;
  onOrderUpdated: () => void;
}

export const RiderOrderDetailModal: React.FC<RiderOrderDetailModalProps> = ({
  isOpen,
  onClose,
  order,
  isProfileComplete,
  activeOrderNumber,
  onOrderUpdated,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remarks, setRemarks] = useState('');

  if (!isOpen || !order) return null;

  // Group items by Vendor
  const vendorGroups: Record<number, {
    vendor_name: string;
    vendor_type: string;
    vendor_phone: string;
    vendor_address?: any;
    items: RiderOrderItem[];
  }> = {};

  if (order.items && order.items.length > 0) {
    order.items.forEach((item) => {
      const vId = item.vendor?.id || 0;
      const vName = item.vendor?.name || 'Central Pharma Warehouse';
      const vType = item.vendor?.type || 'Pharmacy';
      const vPhone = item.vendor?.phone || 'Central Hotline';
      const vAddr = item.vendor?.address;

      if (!vendorGroups[vId]) {
        vendorGroups[vId] = {
          vendor_name: vName,
          vendor_type: vType,
          vendor_phone: vPhone,
          vendor_address: vAddr,
          items: []
        };
      }
      vendorGroups[vId].items.push(item);
    });
  }

  // Check if another order is currently active
  const isAnotherOrderActive = activeOrderNumber && activeOrderNumber !== order.order_number;

  const handleStatusUpdate = async (nextStatus: string) => {
    // 1. Mandatory Profile Check Guard
    if (!isProfileComplete) {
      toast.error('Profile Incomplete! You must complete your NID, License, and Vehicle info before taking order actions.');
      return;
    }

    // 2. Single Active Order Guard
    const activeStatuses = ['PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY'];
    if (activeStatuses.includes(nextStatus) && isAnotherOrderActive) {
      toast.error(`You already have an active order (#${activeOrderNumber}) in progress. Complete it first!`);
      return;
    }

    setIsSubmitting(true);
    try {
      await riderApi.updateOrderStatus(order.id, nextStatus, remarks);
      toast.success(`Order #${order.order_number} status updated to ${nextStatus.replace('_', ' ')}!`);
      onOrderUpdated();
      onClose();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to update order status';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const customerName = order.address_snapshot?.receiver_name || 
                       `${order.customer?.user?.first_name || ''} ${order.customer?.user?.last_name || ''}`.trim() || 
                       'Customer';
  const customerPhone = order.address_snapshot?.receiver_phone || order.customer?.user?.phone_number || '';
  const fullAddress = order.address_snapshot?.full_address || `${order.address_snapshot?.area || ''}, ${order.address_snapshot?.city || 'Dhaka'}`;

  // Progress Steps calculation
  const steps = ['PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentStepIndex = steps.indexOf(order.order_status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">      {/* Modal Box */}
      <div className="relative w-full max-w-3xl bg-surface-card border border-border-default/90 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col my-auto">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-border-default/80 bg-surface-subtle/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-head font-black text-base sm:text-lg text-content-primary">
                  Delivery Order #{order.order_number}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  order.order_status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  order.order_status === 'OUT_FOR_DELIVERY' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                  order.order_status === 'PACKED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {order.order_status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-content-muted mt-0.5">
                Placed: {new Date(order.placed_at).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-content-muted hover:text-content-primary hover:bg-surface-subtle rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banners for Profile completeness / Active Order lock */}
        {!isProfileComplete && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 sm:p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-2xl flex items-center space-x-3 text-amber-300 text-xs shadow-md">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>Action Blocked:</strong> Rider Profile Incomplete! Complete your NID & Vehicle info in your profile to enable status updates.
            </span>
          </div>
        )}

        {isAnotherOrderActive && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 sm:p-4 bg-gradient-to-r from-rose-500/20 to-amber-500/20 border border-rose-500/40 rounded-2xl flex items-center space-x-3 text-rose-300 text-xs shadow-md">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>
              <strong>Single Active Order Restriction:</strong> You are currently delivering Order #{activeOrderNumber}. Complete it before updating this order.
            </span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          
          {/* STEP PROGRESS TIMELINE BAR */}
          <div className="p-4 sm:p-5 bg-surface-base/80 border border-border-default/80 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-content-secondary uppercase tracking-wider flex items-center justify-between">
              <span>Delivery Pipeline Progress</span>
              <span className="text-cyan-400 font-mono">Step {Math.max(1, currentStepIndex + 1)} of 4</span>
            </h4>

            <div className="grid grid-cols-4 gap-2 pt-2">
              {['Collecting', 'Packed', 'En Route', 'Delivered'].map((stepLabel, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={stepLabel} className="space-y-1.5 text-center">
                    <div className={`h-2 rounded-full transition-all ${
                      isCurrent ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-md shadow-cyan-500/30' :
                      isPassed ? 'bg-emerald-500' : 'bg-surface-subtle border border-border-default'
                    }`} />
                    <span className={`text-[10px] sm:text-[11px] font-bold block truncate ${
                      isCurrent ? 'text-cyan-300' : isPassed ? 'text-emerald-400' : 'text-content-muted'
                    }`}>
                      {stepLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer & Address Card */}
          <div className="p-4 sm:p-5 bg-surface-subtle/50 border border-border-default/80 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="font-head font-bold text-sm text-cyan-300 flex items-center space-x-2">
                <User className="w-4 h-4 text-cyan-400" />
                <span>Customer & Destination Address</span>
              </h4>
              <span className={`self-start sm:self-auto px-3 py-1 rounded-xl text-xs font-black ${
                order.payment_method === 'COD' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {order.payment_method === 'COD' ? `Collect Cash: ৳${order.grand_total}` : `PREPAID: ৳${order.grand_total}`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
              <div>
                <span className="text-content-muted font-medium">Receiver Name:</span>
                <p className="font-bold text-content-primary text-sm mt-0.5">{customerName}</p>
              </div>

              <div>
                <span className="text-content-muted font-medium">Receiver Phone:</span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="font-mono font-bold text-content-primary text-sm">{customerPhone}</span>
                  {customerPhone && (
                    <a
                      href={`tel:${customerPhone}`}
                      className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold flex items-center space-x-1 hover:bg-emerald-500/30 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Customer</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border-default/60">
              <span className="text-content-muted text-xs font-medium flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Delivery Address:</span>
              </span>
              <p className="mt-1 text-xs text-content-primary font-semibold leading-relaxed">{fullAddress}</p>
              {order.address_snapshot?.landmark && (
                <p className="mt-1 text-[11px] text-amber-300 font-medium">
                  Landmark: {order.address_snapshot.landmark}
                </p>
              )}
            </div>
          </div>

          {/* Vendor Pickup Locations Breakdown */}
          <div className="space-y-3">
            <h4 className="font-head font-bold text-sm text-content-primary flex items-center space-x-2">
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Vendor Product Collection Breakdown ({Object.keys(vendorGroups).length} Stores)</span>
            </h4>

            {Object.entries(vendorGroups).map(([vId, group]) => (
              <div key={vId} className="p-4 sm:p-5 bg-surface-subtle/30 border border-border-default/80 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-default/60">
                  <div>
                    <h5 className="font-bold text-sm text-emerald-400 flex items-center space-x-2 flex-wrap gap-1">
                      <span>{group.vendor_name}</span>
                      <span className="text-[10px] px-2.5 py-0.5 bg-emerald-500/15 text-emerald-300 rounded-full font-mono uppercase border border-emerald-500/30">
                        {group.vendor_type}
                      </span>
                    </h5>
                    {group.vendor_address && (
                      <p className="text-xs text-content-muted mt-1 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-content-muted shrink-0" />
                        <span>
                          {group.vendor_address.full_address || `${group.vendor_address.area}, ${group.vendor_address.city}`}
                        </span>
                      </p>
                    )}
                  </div>

                  {group.vendor_phone && (
                    <a
                      href={`tel:${group.vendor_phone}`}
                      className="self-start sm:self-auto px-3 py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold flex items-center space-x-1.5 hover:bg-cyan-500/30 transition-all shrink-0"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Store</span>
                    </a>
                  )}
                </div>

                {/* Items list */}
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-xl bg-surface-base/60">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="font-bold text-content-primary">
                          {item.product_snapshot?.name || 'Medicine Product'}
                        </span>
                        <span className="text-content-muted font-mono text-[11px]">
                          ({item.product_snapshot?.sku || 'SKU'})
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-black text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/30">
                          Qty: {item.quantity}
                        </span>
                        <span className="font-bold text-content-primary">৳{item.total_price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Status Controls */}
          <div className="p-5 bg-surface-subtle/60 border border-border-default/80 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-head font-bold text-sm text-content-primary flex items-center space-x-2">
                <PackageCheck className="w-4 h-4 text-purple-400" />
                <span>Update Delivery Progress Status</span>
              </h4>
              {order.payment_method === 'COD' && order.order_status !== 'DELIVERED' && (
                <span className="text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  <span>Collect ৳{order.grand_total} Cash at Delivery</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => handleStatusUpdate('PROCESSING')}
                disabled={isSubmitting || !isProfileComplete || Boolean(isAnotherOrderActive) || !['PLACED', 'CONFIRMED'].includes(order.order_status)}
                className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all ${
                  order.order_status === 'PROCESSING'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-lg shadow-amber-500/20'
                    : ['PLACED', 'CONFIRMED'].includes(order.order_status)
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 font-bold'
                    : 'bg-surface-base text-content-muted border-border-default'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                1. Collecting
              </button>

              <button
                onClick={() => handleStatusUpdate('PACKED')}
                disabled={isSubmitting || !isProfileComplete || Boolean(isAnotherOrderActive) || order.order_status !== 'PROCESSING'}
                className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all ${
                  order.order_status === 'PACKED'
                    ? 'bg-purple-500 text-white border-purple-400 font-black shadow-lg shadow-purple-500/20'
                    : order.order_status === 'PROCESSING'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30 font-bold'
                    : 'bg-surface-base text-content-muted border-border-default'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                2. Picked & Packed
              </button>

              <button
                onClick={() => handleStatusUpdate('OUT_FOR_DELIVERY')}
                disabled={isSubmitting || !isProfileComplete || Boolean(isAnotherOrderActive) || order.order_status !== 'PACKED'}
                className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all ${
                  order.order_status === 'OUT_FOR_DELIVERY'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-lg shadow-cyan-500/20'
                    : order.order_status === 'PACKED'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30 font-bold'
                    : 'bg-surface-base text-content-muted border-border-default'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                3. Out for Delivery
              </button>

              <button
                onClick={() => handleStatusUpdate('DELIVERED')}
                disabled={isSubmitting || !isProfileComplete || Boolean(isAnotherOrderActive) || order.order_status !== 'OUT_FOR_DELIVERY'}
                className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all ${
                  order.order_status === 'DELIVERED'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-lg shadow-emerald-500/20'
                    : order.order_status === 'OUT_FOR_DELIVERY'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 font-bold animate-pulse'
                    : 'bg-surface-base text-content-muted border-border-default'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                4. {order.payment_method === 'COD' ? 'Delivered & Collect Cash' : 'Mark Delivered'}
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-border-default/80 bg-surface-subtle/80 flex items-center justify-between">
          <span className="text-xs text-content-muted flex items-center space-x-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Grand Total: <strong className="text-content-primary text-sm font-bold">৳{order.grand_total}</strong></span>
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-surface-base border border-border-default hover:bg-surface-subtle text-content-primary font-bold text-xs rounded-xl transition-colors"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
