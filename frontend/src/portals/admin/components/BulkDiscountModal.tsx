import React, { useState } from 'react';
import {
  X,
  Percent,
  DollarSign,
  Flame,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { AdminVariantItem, BulkDiscountRulePayload } from '../types/admin.types';
import { adminCatalogApi } from '../api/adminCatalog.api';

interface BulkDiscountModalProps {
  variants: AdminVariantItem[];
  selectedVariantIds: number[];
  onClose: () => void;
  onApplySuccess: (updatedVariants: AdminVariantItem[]) => void;
}

export const BulkDiscountModal: React.FC<BulkDiscountModalProps> = ({
  variants,
  selectedVariantIds: initialSelectedIds,
  onClose,
  onApplySuccess,
}) => {
  const [selectedIds, setSelectedIds] = useState<number[]>(
    initialSelectedIds.length > 0 ? initialSelectedIds : variants.map((v) => v.id)
  );

  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [isHotDeal, setIsHotDeal] = useState<boolean>(true);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedVariants = variants.filter((v) => selectedIds.includes(v.id));

  const toggleSelectAll = () => {
    if (selectedIds.length === variants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(variants.map((v) => v.id));
    }
  };

  const toggleSelectVariant = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Preview Calculation Helper
  const calculateSalePrice = (price: number) => {
    if (discountType === 'flat') {
      return Math.max(0, price - discountValue);
    } else {
      const discountAmount = (price * discountValue) / 100;
      return Math.max(0, Math.round(price - discountAmount));
    }
  };

  const handleApplyDiscount = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one variant item!');
      return;
    }
    if (discountValue <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: BulkDiscountRulePayload = {
        variant_ids: selectedIds,
        discount_type: discountType,
        discount_value: discountValue,
        is_hot_deal: isHotDeal,
        is_featured: isFeatured,
      };

      const updated = await adminCatalogApi.applyBulkDiscountRule(payload);
      onApplySuccess(updated);
      toast.success(`Discount rule applied to ${selectedIds.length} variants!`);
      onClose();
    } catch {
      toast.error('Failed to apply bulk discount rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-bg-surface border border-bg-border rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-bg-base/60 border-b border-bg-border">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-accent-500/15 text-accent-400 border border-accent-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-head font-bold text-lg text-content-primary">
                Bulk Variant Discount & Pricing Builder
              </h2>
              <p className="text-xs text-content-muted">
                Apply flat (৳) or percentage (%) discounts to multiple variants simultaneously.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Rule Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-bg-card border border-bg-border">
            {/* Discount Type Selector */}
            <div>
              <label className="block text-xs font-mono font-bold text-content-muted mb-2">
                1. Discount Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                    discountType === 'percentage'
                      ? 'bg-primary-500/20 text-primary-400 border-primary-500/50 shadow-glow'
                      : 'bg-bg-surface text-content-muted border-bg-border hover:bg-bg-hover'
                  }`}
                >
                  <Percent className="w-4 h-4" />
                  <span>Percentage (%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('flat')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                    discountType === 'flat'
                      ? 'bg-accent-500/20 text-accent-400 border-accent-500/50 shadow-glow'
                      : 'bg-bg-surface text-content-muted border-bg-border hover:bg-bg-hover'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Flat Amount (৳)</span>
                </button>
              </div>
            </div>

            {/* Discount Value Input */}
            <div>
              <label className="block text-xs font-mono font-bold text-content-muted mb-2">
                2. Discount Value ({discountType === 'percentage' ? '%' : '৳'})
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  placeholder={discountType === 'percentage' ? 'e.g. 15' : 'e.g. 20'}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary font-mono font-bold text-sm outline-none focus:border-primary-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-content-muted">
                  {discountType === 'percentage' ? '% OFF' : '৳ OFF'}
                </span>
              </div>
            </div>

            {/* Promotional Flags Toggle */}
            <div className="sm:col-span-2 pt-2 border-t border-bg-border flex flex-wrap items-center gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHotDeal}
                  onChange={(e) => setIsHotDeal(e.target.checked)}
                  className="w-4 h-4 rounded border-bg-border text-rose-500 focus:ring-rose-500"
                />
                <div className="flex items-center space-x-1.5 text-xs font-bold text-content-primary">
                  <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
                  <span>Mark as Hot Deal 🔥</span>
                </div>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-bg-border text-amber-500 focus:ring-amber-500"
                />
                <div className="flex items-center space-x-1.5 text-xs font-bold text-content-primary">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>Mark as Featured Product ⭐</span>
                </div>
              </label>
            </div>
          </div>

          {/* Variants Selection & Dynamic Preview Table */}
          <div className="p-4 rounded-2xl bg-bg-card border border-bg-border space-y-3">
            <div className="flex items-center justify-between border-b border-bg-border pb-2">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-primary-400" />
                <span className="text-xs font-mono font-bold text-content-muted uppercase">
                  Selected Variants Preview ({selectedIds.length} items)
                </span>
              </div>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs text-primary-400 hover:underline font-semibold"
              >
                {selectedIds.length === variants.length ? 'Deselect All' : 'Select All Variants'}
              </button>
            </div>

            <div className="overflow-x-auto max-h-60">
              <table className="w-full text-left text-xs">
                <thead className="text-content-muted font-mono uppercase bg-bg-base/40 border-b border-bg-border">
                  <tr>
                    <th className="py-2 px-3 w-8">#</th>
                    <th className="py-2 px-3">Variant</th>
                    <th className="py-2 px-3 font-mono">Regular Price</th>
                    <th className="py-2 px-3 font-mono text-emerald-400">Preview Sale Price</th>
                    <th className="py-2 px-3 font-mono text-primary-400">Net Discount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bg-border">
                  {variants.map((v) => {
                    const isSelected = selectedIds.includes(v.id);
                    const newSalePrice = calculateSalePrice(v.price);
                    const savingsAmount = v.price - newSalePrice;
                    const savingsPercent = Math.round((savingsAmount / v.price) * 100);

                    return (
                      <tr
                        key={v.id}
                        onClick={() => toggleSelectVariant(v.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary-500/10' : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-primary-500"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-content-primary">{v.product_name}</div>
                          <div className="text-[11px] text-content-muted font-mono">{v.variant_name} ({v.sku})</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-content-muted">৳ {v.price}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">৳ {newSalePrice}</td>
                        <td className="py-2.5 px-3 font-mono text-primary-400 font-semibold">
                          ৳ {savingsAmount} ({savingsPercent}%)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="p-6 bg-bg-base/80 border-t border-bg-border flex items-center justify-between">
          <div className="text-xs text-content-muted font-mono">
            {selectedIds.length} variants ready for price update
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-bg-card hover:bg-bg-hover border border-bg-border text-xs font-semibold text-content-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyDiscount}
              disabled={isSubmitting || selectedIds.length === 0}
              className="px-6 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Apply Discount Rule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
