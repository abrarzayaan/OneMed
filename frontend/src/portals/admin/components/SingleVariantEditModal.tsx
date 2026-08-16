import React, { useState } from 'react';
import { X, CheckCircle2, Flame, Star, Tag, Loader2, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AdminVariantItem } from '../types/admin.types';
import { adminCatalogApi } from '../api/adminCatalog.api';

interface SingleVariantEditModalProps {
  variant: AdminVariantItem;
  onClose: () => void;
  onUpdateSuccess: (updated: AdminVariantItem) => void;
}

export const SingleVariantEditModal: React.FC<SingleVariantEditModalProps> = ({
  variant,
  onClose,
  onUpdateSuccess,
}) => {
  const [price, setPrice] = useState<number>(variant.price);
  const [salePrice, setSalePrice] = useState<number | ''>(variant.sale_price ?? '');
  const [isHotDeal, setIsHotDeal] = useState<boolean>(variant.meta?.is_hot_deal ?? false);
  const [isFeatured, setIsFeatured] = useState<boolean>(variant.meta?.is_featured ?? false);
  const [isBestSelling, setIsBestSelling] = useState<boolean>(variant.meta?.is_best_selling ?? false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Savings calculation preview
  const currentSalePriceNum = salePrice === '' ? null : Number(salePrice);
  const hasDiscount = currentSalePriceNum !== null && currentSalePriceNum < price;
  const savingsAmount = hasDiscount ? price - currentSalePriceNum! : 0;
  const savingsPercent = hasDiscount ? Math.round((savingsAmount / price) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (price <= 0) {
      toast.error('Regular price must be greater than 0');
      return;
    }
    if (currentSalePriceNum !== null && currentSalePriceNum >= price) {
      toast.error('Sale price must be lower than Regular price');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await adminCatalogApi.updateVariantPricing(
        variant.id,
        price,
        currentSalePriceNum,
        {
          is_hot_deal: isHotDeal,
          is_featured: isFeatured,
          is_best_selling: isBestSelling,
        }
      );
      onUpdateSuccess(updated);
      toast.success(`Pricing updated for ${variant.product_name}!`);
      onClose();
    } catch {
      toast.error('Failed to update variant pricing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-bg-surface border border-bg-border rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-bg-base/60 border-b border-bg-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-primary-500/15 text-primary-400 border border-primary-500/30">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-head font-bold text-base text-content-primary">
                Edit Variant Pricing & Meta
              </h2>
              <p className="text-xs text-content-muted font-mono">{variant.sku}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-3.5 rounded-2xl bg-bg-card border border-bg-border space-y-1">
            <div className="text-sm font-bold text-content-primary">{variant.product_name}</div>
            <div className="text-xs text-content-muted font-mono">
              {variant.variant_name} • {variant.category_name}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Regular Price */}
            <div>
              <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                Regular Price (৳)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary font-mono font-bold text-sm outline-none focus:border-primary-500"
              />
            </div>

            {/* Sale Price */}
            <div>
              <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                Sale Price (৳) <span className="text-[10px] text-content-muted font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Leave blank for no discount"
                className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-emerald-400 font-mono font-bold text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Discount Preview Badge */}
          {hasDiscount && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between text-xs font-mono font-bold">
              <span>Customer Savings Preview:</span>
              <span>৳ {savingsAmount} ({savingsPercent}% OFF)</span>
            </div>
          )}

          {/* Promotional Meta JSON Flags */}
          <div className="p-4 rounded-2xl bg-bg-card border border-bg-border space-y-3">
            <div className="text-xs font-mono font-bold text-content-muted uppercase">
              Promotional Flags (`meta` JSON)
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHotDeal}
                  onChange={(e) => setIsHotDeal(e.target.checked)}
                  className="w-4 h-4 rounded border-bg-border text-rose-500 focus:ring-rose-500"
                />
                <span className="text-xs text-content-primary font-semibold flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-500" /> Mark as Hot Deal 🔥
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-bg-border text-amber-500 focus:ring-amber-500"
                />
                <span className="text-xs text-content-primary font-semibold flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400" /> Mark as Featured Product ⭐
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBestSelling}
                  onChange={(e) => setIsBestSelling(e.target.checked)}
                  className="w-4 h-4 rounded border-bg-border text-primary-500 focus:ring-primary-500"
                />
                <span className="text-xs text-content-primary font-semibold flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-primary-400" /> Mark as Best Seller 🏆
                </span>
              </label>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-bg-card hover:bg-bg-hover border border-bg-border text-xs font-semibold text-content-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Save Variant Pricing</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
