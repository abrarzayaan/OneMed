import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  MapPin,
  CreditCard,
  Building2,
  Truck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { AdminOrder, OrderStatusType, AdminVendor, AdminRider } from '../types/admin.types';
import { adminOrderApi } from '../api/adminOrder.api';

interface OrderDetailModalProps {
  order: AdminOrder;
  onClose: () => void;
  onOrderUpdated: (updated: AdminOrder) => void;
}

const ORDER_STEPS: OrderStatusType[] = [
  'PLACED',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order: initialOrder,
  onClose,
  onOrderUpdated,
}) => {
  const [order, setOrder] = useState<AdminOrder>(initialOrder);
  const [vendorList, setVendorList] = useState<AdminVendor[]>([]);
  const [riderList, setRiderList] = useState<AdminRider[]>([]);

  const [selectedVendors, setSelectedVendors] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    initialOrder.items.forEach((item) => {
      if (item.assigned_vendor_id) {
        map[item.id] = item.assigned_vendor_id;
      }
    });
    return map;
  });

  const [selectedRiderId, setSelectedRiderId] = useState<number>(
    initialOrder.assigned_rider?.id || 0
  );

  useEffect(() => {
    adminOrderApi.getVendors().then((data) => {
      if (data && data.length > 0) {
        setVendorList(data);
        setSelectedVendors((prev) => {
          const map = { ...prev };
          initialOrder.items.forEach((item) => {
            if (!map[item.id] && !item.assigned_vendor_id) {
              map[item.id] = data[0].id;
            }
          });
          return map;
        });
      }
    });

    adminOrderApi.getRiders().then((data) => {
      if (data && data.length > 0) {
        setRiderList(data);
        if (!initialOrder.assigned_rider?.id) {
          setSelectedRiderId(data[0].id);
        }
      }
    });
  }, []);

  const [isAssigningVendor, setIsAssigningVendor] = useState(false);
  const [isAssigningRider, setIsAssigningRider] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatusType>(initialOrder.order_status);

  // Vendor Assignment Lock Status
  const allItemsSavedVendor =
    order.items.length > 0 && order.items.every((item) => Boolean(item.assigned_vendor_id));
  const allItemsAssignedVendor =
    order.items.length > 0 &&
    order.items.every((item) => item.assigned_vendor_id || selectedVendors[item.id]);

  // Rider Lock Status
  const isRiderFixed = Boolean(order.assigned_rider?.id);
  const riderIsSelected = Boolean(order.assigned_rider?.id || selectedRiderId);

  const canConfirmOrder = allItemsAssignedVendor && riderIsSelected && order.order_status === 'PLACED';

  // STEP 2: Save Vendor Assignment
  const handleSaveVendors = async () => {
    if (Object.keys(selectedVendors).length === 0) {
      toast.error('Please select a vendor for the order items');
      return;
    }
    setIsAssigningVendor(true);
    try {
      const itemsPayload = Object.entries(selectedVendors).map(([order_item_id, vendor_id]) => ({
        order_item_id: Number(order_item_id),
        vendor_id: Number(vendor_id),
      }));

      const updated = await adminOrderApi.assignVendors(order.id, { items: itemsPayload });
      setOrder(updated);
      onOrderUpdated(updated);
      toast.success('Vendors assigned & updated successfully!');
    } catch {
      toast.error('Failed to assign vendors');
    } finally {
      setIsAssigningVendor(false);
    }
  };

  // STEP 3: Assign Rider
  const handleSaveRider = async () => {
    if (!allItemsAssignedVendor) {
      toast.error('Must select vendor before assigning rider!');
      return;
    }

    setIsAssigningRider(true);
    try {
      const updated = await adminOrderApi.assignRider(order.id, { rider_id: selectedRiderId });
      setOrder(updated);
      onOrderUpdated(updated);
      toast.success('Rider assigned & updated! Rider portal updated.');
    } catch {
      toast.error('Failed to assign rider');
    } finally {
      setIsAssigningRider(false);
    }
  };

  // STEP 4: Confirm Order
  const handleConfirmOrder = async () => {
    setIsConfirming(true);
    try {
      if (Object.keys(selectedVendors).length > 0) {
        await adminOrderApi.assignVendors(order.id, {
          items: Object.entries(selectedVendors).map(([order_item_id, vendor_id]) => ({
            order_item_id: Number(order_item_id),
            vendor_id: Number(vendor_id),
          })),
        });
      }
      if (selectedRiderId) {
        await adminOrderApi.assignRider(order.id, { rider_id: selectedRiderId });
      }

      const updated = await adminOrderApi.confirmOrder(order.id);
      setOrder(updated);
      onOrderUpdated(updated);
      toast.success('Order CONFIRMED! Vendor stock reserved.');
    } catch {
      toast.error('Failed to confirm order');
    } finally {
      setIsConfirming(false);
    }
  };

  // General Status Update
  const handleStatusChange = async (targetStatus: OrderStatusType) => {
    setIsUpdatingStatus(true);
    try {
      const updated = await adminOrderApi.updateStatus(order.id, {
        status: targetStatus,
        remarks: `Updated by Super Admin to ${targetStatus}`,
      });
      setOrder(updated);
      setNewStatus(targetStatus);
      onOrderUpdated(updated);
      toast.success(`Order status updated to ${targetStatus}`);
    } catch {
      toast.error('Failed to update order status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: OrderStatusType) => {
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-bg-surface border border-bg-border rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-bg-base/60 border-b border-bg-border">
          <div className="flex items-center space-x-3">
            <span className="font-head font-bold text-xl text-content-primary">
              Order {order.order_number}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${getStatusBadge(order.order_status)}`}>
              {order.order_status}
            </span>
            {order.requires_prescription && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[11px] font-mono font-semibold border border-rose-500/30">
                Rx Required
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Order Lifecycle Progress Bar */}
          <div className="p-4 rounded-2xl bg-bg-card border border-bg-border space-y-3">
            <div className="text-xs font-mono font-bold text-content-muted uppercase tracking-wider">
              Order Lifecycle Timeline
            </div>
            <div className="flex items-center justify-between relative">
              {ORDER_STEPS.map((step, idx) => {
                const currentIdx = ORDER_STEPS.indexOf(order.order_status);
                const isPassed = idx <= currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div key={step} className="flex-1 flex flex-col items-center relative z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                        isPassed
                          ? 'bg-primary-500 text-white shadow-glow'
                          : 'bg-bg-surface text-content-muted border border-bg-border'
                      } ${isCurrent ? 'ring-4 ring-primary-500/30 scale-110' : ''}`}
                    >
                      {isPassed ? <Check className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] font-mono mt-2 text-center truncate max-w-[80px] ${
                        isPassed ? 'text-content-primary font-bold' : 'text-content-muted'
                      }`}
                    >
                      {step.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer & Shipping Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Info */}
            <div className="p-4 rounded-2xl bg-bg-card border border-bg-border space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-content-muted uppercase font-mono">
                <User className="w-4 h-4 text-primary-400" />
                <span>Customer Info</span>
              </div>
              <div className="text-sm font-bold text-content-primary">{order.customer_name}</div>
              <div className="text-xs font-mono text-content-secondary">{order.customer_phone}</div>
            </div>

            {/* Delivery Address */}
            <div className="p-4 rounded-2xl bg-bg-card border border-bg-border space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-content-muted uppercase font-mono">
                <MapPin className="w-4 h-4 text-accent-400" />
                <span>Shipping Address</span>
              </div>
              <div className="text-xs text-content-primary leading-relaxed">{order.shipping_address}</div>
              <div className="text-xs font-mono text-content-muted">{order.city}</div>
            </div>

            {/* Payment Summary */}
            <div className="p-4 rounded-2xl bg-bg-card border border-bg-border space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-content-muted uppercase font-mono">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Payment Snapshot</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-content-muted">{order.payment_method}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px]">
                  {order.payment_status}
                </span>
              </div>
              <div className="text-lg font-mono font-bold text-content-primary pt-1">
                ৳ {order.total_amount}
              </div>
            </div>
          </div>

          {/* STEP 2: Multi-Vendor Item Assignment Table */}
          <div className="p-5 rounded-2xl bg-bg-card border border-bg-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-bg-border pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-primary-400" />
                <div>
                  <h3 className="text-sm font-head font-bold text-content-primary">
                    STEP 2: Select Vendor for Order Items
                  </h3>
                  <p className="text-xs text-content-muted">Assign a local pharmacy hub holding stock for each variant</p>
                </div>
              </div>

              {allItemsSavedVendor ? (
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Vendors Fixed & Locked</span>
                </span>
              ) : (
                <button
                  onClick={handleSaveVendors}
                  disabled={isAssigningVendor}
                  className="px-3.5 py-1.5 rounded-xl bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 border border-primary-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  {isAssigningVendor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save Vendor Assignments</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-content-muted font-mono uppercase bg-bg-base/40 border-b border-bg-border">
                  <tr>
                    <th className="py-2.5 px-3">Product Variant</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3">Unit Price</th>
                    <th className="py-2.5 px-3">Total</th>
                    <th className="py-2.5 px-3">Assigned Vendor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bg-border">
                  {order.items.map((item) => {
                    const currentVendorId = selectedVendors[item.id] || item.assigned_vendor_id || '';
                    return (
                      <tr key={item.id} className="hover:bg-bg-hover transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-content-primary">{item.product_name}</div>
                          <div className="text-[11px] text-content-muted font-mono">{item.variant_name}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold">{item.quantity}</td>
                        <td className="py-3 px-3 font-mono text-content-muted">৳ {item.unit_price}</td>
                        <td className="py-3 px-3 font-mono font-bold text-content-primary">৳ {item.total_price}</td>
                        <td className="py-3 px-3">
                          <select
                            value={currentVendorId}
                            onChange={(e) =>
                              setSelectedVendors({
                                ...selectedVendors,
                                [item.id]: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-1.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-primary-500"
                          >
                            <option value="" disabled>-- Select Vendor Pharmacy --</option>
                            {vendorList.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name} ({v.available_stock || 50} in stock)
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* STEP 3: Rider Assignment Selector */}
          <div className="p-5 rounded-2xl bg-bg-card border border-bg-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-bg-border pb-3">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-accent-400" />
                <div>
                  <h3 className="text-sm font-head font-bold text-content-primary">
                    STEP 3: Dispatch & Assign Delivery Rider
                  </h3>
                  <p className="text-xs text-content-muted">
                    {!allItemsAssignedVendor
                      ? '⚠️ Vendor selection required before assigning rider'
                      : 'Choose an online rider based on workload and vehicle'}
                  </p>
                </div>
              </div>

              {isRiderFixed ? (
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Rider Fixed & Locked</span>
                </span>
              ) : (
                <button
                  onClick={handleSaveRider}
                  disabled={isAssigningRider || !allItemsAssignedVendor}
                  className="px-3.5 py-1.5 rounded-xl bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 border border-accent-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-all disabled:opacity-40 disabled:hover:bg-accent-500/20"
                >
                  {isAssigningRider ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Assign Rider</span>
                </button>
              )}
            </div>

            {!allItemsAssignedVendor ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Rider assignment is locked. Please select and save vendors for all order items first.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
                    Select Delivery Fleet Rider:
                  </label>
                  {isRiderFixed ? (
                    <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center justify-between">
                      <span>{order.assigned_rider?.name}</span>
                      <Lock className="w-4 h-4" />
                    </div>
                  ) : (
                    <select
                      value={selectedRiderId}
                      onChange={(e) => setSelectedRiderId(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-accent-500"
                    >
                      {riderList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} — {r.vehicle_type} ({r.active_workload || 0} active orders)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Rider Status Snapshot */}
                {(() => {
                  const currentRider = isRiderFixed
                    ? order.assigned_rider
                    : riderList.find((r) => r.id === selectedRiderId);
                  if (!currentRider) return null;
                  return (
                    <div className="p-3 rounded-xl bg-bg-surface border border-bg-border flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-content-primary">{currentRider.name}</div>
                        <div className="text-[11px] text-content-muted font-mono">{currentRider.phone}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-semibold text-[10px]">
                          ★ {currentRider.rating || 4.8}
                        </span>
                        <div className="text-[10px] text-content-muted mt-1">{currentRider.vehicle_type}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Bar (STEP 4: Confirm Order or Status Override) */}
        <div className="p-6 bg-bg-base/80 border-t border-bg-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            {!allItemsAssignedVendor || !riderIsSelected ? (
              <div className="flex items-center space-x-2 text-xs text-amber-400 font-mono">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Assign vendors to all items & select a rider to enable confirmation.</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-xs text-emerald-400 font-mono">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Ready for order confirmation & stock deduction.</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {/* Status transition selector */}
            {order.order_status !== 'PLACED' && (
              <div className="flex items-center space-x-2">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatusType)}
                  className="px-3 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs font-mono text-content-primary outline-none"
                >
                  {ORDER_STEPS.map((s) => (
                    <option key={s} value={s}>
                      Set {s}
                    </option>
                  ))}
                  <option value="CANCELLED">CANCELLED</option>
                </select>
                <button
                  onClick={() => handleStatusChange(newStatus)}
                  disabled={isUpdatingStatus}
                  className="px-3 py-2 rounded-xl bg-bg-card hover:bg-bg-hover border border-bg-border text-xs font-semibold text-content-primary transition-all"
                >
                  Update Status
                </button>
              </div>
            )}

            {/* STEP 4: Confirm Order Action Button */}
            {order.order_status === 'PLACED' && (
              <button
                onClick={handleConfirmOrder}
                disabled={!canConfirmOrder || isConfirming}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 text-white font-bold text-xs shadow-glow transition-all flex items-center justify-center space-x-2"
              >
                {isConfirming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>STEP 4: Confirm Order & Reserve Stock</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
