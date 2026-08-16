import React, { useState, useEffect } from 'react';
import { Boxes, CheckCircle2, Loader2, ShieldCheck, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminCatalogApi } from '../../api/adminCatalog.api';
import type { AdminVariantItem } from '../../types/admin.types';

interface InventoryCreateFormProps {
  onSuccess?: () => void;
}

export const InventoryCreateForm: React.FC<InventoryCreateFormProps> = ({ onSuccess }) => {
  const [variants, setVariants] = useState<AdminVariantItem[]>([]);
  const [vendors, setVendors] = useState<{ id: number; name: string }[]>([]);

  const [selectedVendorId, setSelectedVendorId] = useState<number | ''>('');
  const [selectedVariantId, setSelectedVariantId] = useState<number | ''>('');
  const [stockQty, setStockQty] = useState<number>(100);
  const [reservedQty, setReservedQty] = useState<number>(0);
  const [damagedQty, setDamagedQty] = useState<number>(0);
  const [reorderLevel, setReorderLevel] = useState<number>(15);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    adminCatalogApi.getVariants().then((vars) => {
      setVariants(vars);
      if (vars.length > 0) setSelectedVariantId(vars[0].id);
    });

    adminCatalogApi.getVendors().then((vList) => {
      setVendors(vList);
      if (vList.length > 0) setSelectedVendorId(vList[0].id);
    });
  }, []);

  const availableStock = Math.max(0, stockQty - (reservedQty + damagedQty));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId) {
      toast.error('Please select a Variant');
      return;
    }
    if (stockQty < 0) {
      toast.error('Stock Quantity cannot be negative');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminCatalogApi.createInventory({
        variant: Number(selectedVariantId),
        vendor: selectedVendorId === '' ? null : Number(selectedVendorId),
        stock_qty: stockQty,
        reserved_qty: reservedQty,
        damaged_qty: damagedQty,
        reorder_level: reorderLevel,
      });

      toast.success('Initial stock inventory record created successfully in Database!');
      if (onSuccess) onSuccess();
    } catch {
      toast.error('Failed to create inventory record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-bg-card border border-bg-border shadow-card space-y-6">
      <div className="flex items-center space-x-3 border-b border-bg-border pb-4">
        <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <Boxes className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-head font-bold text-lg text-content-primary">Initial Stock & Inventory Setup</h2>
          <p className="text-xs text-content-muted">Assign physical stock batch, vendor location & low stock alert thresholds</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Select Vendor / Pharmacy Outlet */}
        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            Select Vendor / Pharmacy Outlet *
          </label>
          <select
            required
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-amber-500"
          >
            <option value="">Admin Warehouse (Self Stock)</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Select Variant */}
        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
            Select Product Variant *
          </label>
          <select
            required
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-amber-500"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.product_name} — {v.variant_name} ({v.sku}) — ৳{v.price}
              </option>
            ))}
          </select>
        </div>

        {/* Physical Stock Qty */}
        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
            Physical Stock Quantity *
          </label>
          <input
            type="number"
            required
            min="0"
            value={stockQty}
            onChange={(e) => setStockQty(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary font-mono font-bold text-sm outline-none focus:border-amber-500"
          />
        </div>

        {/* Reorder Level Alert */}
        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
            Low Stock Reorder Level
          </label>
          <input
            type="number"
            required
            min="1"
            value={reorderLevel}
            onChange={(e) => setReorderLevel(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-amber-400 font-mono font-bold text-sm outline-none focus:border-amber-500"
          />
        </div>

        {/* Reserved Stock */}
        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
            Reserved / Pending Orders Qty
          </label>
          <input
            type="number"
            min="0"
            value={reservedQty}
            onChange={(e) => setReservedQty(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-secondary font-mono text-sm outline-none"
          />
        </div>

        {/* Damaged Stock */}
        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
            Damaged / Expired Qty
          </label>
          <input
            type="number"
            min="0"
            value={damagedQty}
            onChange={(e) => setDamagedQty(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-rose-400 font-mono text-sm outline-none"
          />
        </div>
      </div>

      {/* Calculated Net Stock Summary Card */}
      <div className="p-4 rounded-2xl bg-bg-surface border border-bg-border flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-xs font-bold text-content-primary">Calculated Net Available Stock</div>
            <div className="text-[11px] text-content-muted">Formula: `stock_qty - (reserved_qty + damaged_qty)`</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-mono font-bold text-emerald-400">{availableStock} Units</div>
          <div className="text-[10px] font-mono text-content-muted">
            {availableStock <= reorderLevel ? '⚠️ LOW STOCK ALERT TRIGGER' : '✅ IN STOCK'}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>Save Inventory Record to Database</span>
        </button>
      </div>
    </form>
  );
};
