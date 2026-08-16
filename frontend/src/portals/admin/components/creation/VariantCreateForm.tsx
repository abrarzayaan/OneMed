import React, { useState, useEffect } from 'react';
import { TagPlus, CheckCircle2, Loader2, Flame, Star, Tag, Sparkles, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminCatalogApi } from '../../api/adminCatalog.api';
import type { AdminVariantItem } from '../../types/admin.types';
import {
  DynamicMetaKeyValueBuilder,
  type KeyValuePair,
} from './DynamicMetaKeyValueBuilder';

interface VariantCreateFormProps {
  onSuccess?: (newVariant: AdminVariantItem) => void;
}

export const VariantCreateForm: React.FC<VariantCreateFormProps> = ({ onSuccess }) => {
  const [productId, setProductId] = useState<number | ''>('');
  const [variantName, setVariantName] = useState<string>('');
  const [sku, setSku] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');

  // Financials & Status
  const [price, setPrice] = useState<number>(50);
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [minOrderQty, setMinOrderQty] = useState<number>(1);
  const [maxOrderQty, setMaxOrderQty] = useState<number | ''>(10);
  const [status, setStatus] = useState<'active' | 'hidden'>('active');

  // Exact Meta JSON Flags Specified by User
  const [packSize, setPackSize] = useState<string>('10 Pcs Blister Pack');
  const [isHotDeal, setIsHotDeal] = useState<boolean>(true);
  const [isBestSelling, setIsBestSelling] = useState<boolean>(true); // Top Deal
  const [isQuickAccess, setIsQuickAccess] = useState<boolean>(true); // Featured Product
  const [isFlashSale, setIsFlashSale] = useState<boolean>(false); // Flash Sale / Top Rated

  // Dynamic Key-Value Pair Specification Builder
  const [shortDescPairs, setShortDescPairs] = useState<KeyValuePair[]>([
    { id: '1', key: 'Key Highlights & Features', value: 'DGDA Approved, 100% Authentic, Fast Pain Relief' },
    { id: '2', key: 'Dosage & Administration', value: '1 tablet twice daily after meals' },
    { id: '3', key: 'Storage & Safety Advice', value: 'Store below 30°C in a cool dry place' },
  ]);

  const [longDescPairs, setLongDescPairs] = useState<KeyValuePair[]>([
    { id: 'a1', key: 'Medical Indications', value: 'Indicated for fever, headache, body ache and flu symptoms' },
    { id: 'a2', key: 'Precautions & Warnings', value: 'Consult doctor if liver condition exists' },
  ]);

  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    adminCatalogApi.getProducts().then((prods) => {
      setProducts(prods);
      if (prods.length > 0) setProductId(prods[0].id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      toast.error('Please select a Product Master');
      return;
    }
    if (!variantName.trim()) {
      toast.error('Variant Name is required');
      return;
    }
    if (!sku.trim()) {
      toast.error('SKU Code is required');
      return;
    }
    if (price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      // Serialize dynamic key-value pairs into JSON objects
      const shortDescJson: Record<string, string> = {};
      shortDescPairs.forEach((p) => {
        if (p.key.trim()) shortDescJson[p.key.trim()] = p.value.trim();
      });

      const longDescJson: Record<string, string> = {};
      longDescPairs.forEach((p) => {
        if (p.key.trim()) longDescJson[p.key.trim()] = p.value.trim();
      });

      const created = await adminCatalogApi.createVariant({
        product: Number(productId),
        variant_name: variantName,
        sku,
        barcode: barcode || undefined,
        price,
        sale_price: salePrice === '' ? null : Number(salePrice),
        cost_price: costPrice === '' ? null : Number(costPrice),
        min_order_qty: minOrderQty,
        max_order_qty: maxOrderQty === '' ? null : Number(maxOrderQty),
        status,
        meta: {
          pack_size: packSize,
          is_hot_deal: isHotDeal,
          is_best_selling: isBestSelling,
          is_featured: isQuickAccess,
          is_quick_access: isQuickAccess,
          is_flash_sale: isFlashSale,
        },
        short_description: shortDescJson,
        long_description: longDescJson,
      });

      toast.success(`Variant "${variantName}" saved directly to Database!`);
      setVariantName('');
      setSku('');
      if (onSuccess) onSuccess(created);
    } catch {
      toast.error('Failed to create product variant');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-bg-card border border-bg-border shadow-card space-y-6">
      <div className="flex items-center space-x-3 border-b border-bg-border pb-4">
        <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <TagPlus className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-head font-bold text-lg text-content-primary">Create Product Variant & Meta JSON</h2>
          <p className="text-xs text-content-muted">Configure pack size, pricing, dynamic specs, and promotional badges</p>
        </div>
      </div>

      {/* Basic Variant Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
            Select Product Master *
          </label>
          <select
            required
            value={productId}
            onChange={(e) => setProductId(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-primary-500"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
            Variant Name * (e.g. 10 Tablets Strip)
          </label>
          <input
            type="text"
            required
            value={variantName}
            onChange={(e) => setVariantName(e.target.value)}
            placeholder="e.g. 10 Pcs Strip"
            className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
            SKU Code * (Unique Identifier)
          </label>
          <input
            type="text"
            required
            value={sku}
            onChange={(e) => setSku(e.target.value.toUpperCase())}
            placeholder="e.g. NAPA-500-10STRIP"
            className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-primary-400 font-mono font-bold text-xs outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Financials & Limits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-bg-surface border border-bg-border">
        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1">
            Regular Price (৳) *
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

        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1">
            Sale / Discount Price (৳)
          </label>
          <input
            type="number"
            step="0.01"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Optional sale price"
            className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-emerald-400 font-mono font-bold text-sm outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1">
            Cost Price (৳) <span className="text-[10px] text-content-muted font-normal">(Vendor Buy)</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Buy cost"
            className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-muted font-mono text-sm outline-none focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'hidden')}
            className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs font-medium outline-none"
          >
            <option value="active">Active (Visible)</option>
            <option value="hidden">Hidden (Draft)</option>
          </select>
        </div>
      </div>

      {/* PROMOTIONAL META JSON FLAGS (EXACT USER MAPPING) */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-bg-border space-y-4">
        <div className="flex items-center justify-between border-b border-bg-border pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-accent-400" />
            <div>
              <h3 className="text-sm font-head font-bold text-content-primary">
                1. Promotional Flags & Badges (`meta` JSON)
              </h3>
              <p className="text-xs text-content-muted">Admin checks toggles to set JSON booleans for consumer frontend badges</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-content-muted mb-1">
              Pack Size Description (`pack_size`)
            </label>
            <input
              type="text"
              value={packSize}
              onChange={(e) => setPackSize(e.target.value)}
              placeholder="e.g. 10 Pcs Blister Pack"
              className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-accent-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* Hot Deal */}
            <label className="p-3 rounded-xl bg-bg-card border border-bg-border hover:border-rose-500/40 flex items-center space-x-3 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={isHotDeal}
                onChange={(e) => setIsHotDeal(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500"
              />
              <div className="flex items-center space-x-1.5 text-xs font-bold text-content-primary">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>Hot Deal 🔥</span>
              </div>
            </label>

            {/* Best Selling Product (Top Deal) */}
            <label className="p-3 rounded-xl bg-bg-card border border-bg-border hover:border-primary-500/40 flex items-center space-x-3 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={isBestSelling}
                onChange={(e) => setIsBestSelling(e.target.checked)}
                className="w-4 h-4 rounded text-primary-500"
              />
              <div className="flex items-center space-x-1.5 text-xs font-bold text-content-primary">
                <Tag className="w-4 h-4 text-primary-400" />
                <span>Best Selling Product 🏆</span>
              </div>
            </label>

            {/* Featured Product (Quick Access) */}
            <label className="p-3 rounded-xl bg-bg-card border border-bg-border hover:border-amber-500/40 flex items-center space-x-3 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={isQuickAccess}
                onChange={(e) => setIsQuickAccess(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500"
              />
              <div className="flex items-center space-x-1.5 text-xs font-bold text-content-primary">
                <Star className="w-4 h-4 text-amber-400" />
                <span>Featured Product ⭐</span>
              </div>
            </label>

            {/* Flash Sale (Top Rated) */}
            <label className="p-3 rounded-xl bg-bg-card border border-bg-border hover:border-accent-500/40 flex items-center space-x-3 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={isFlashSale}
                onChange={(e) => setIsFlashSale(e.target.checked)}
                className="w-4 h-4 rounded text-accent-500"
              />
              <div className="flex items-center space-x-1.5 text-xs font-bold text-content-primary">
                <Zap className="w-4 h-4 text-accent-400" />
                <span>Flash Sale ⚡</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* DYNAMIC SHORT DESCRIPTION KEY-VALUE BUILDER */}
      <DynamicMetaKeyValueBuilder
        title="2. Key Highlights & Specs (`short_description` JSON)"
        description="Add dynamic key-value points (e.g. Key Highlights, Dosage, Storage advice) stored directly as JSON in database"
        pairs={shortDescPairs}
        onChange={setShortDescPairs}
        presetSuggestions={[
          'Key Highlights & Features',
          'Dosage & Administration',
          'Storage & Safety Advice',
          'Warnings & Precautions',
          'Side Effects',
        ]}
      />

      {/* DYNAMIC LONG DESCRIPTION KEY-VALUE BUILDER */}
      <DynamicMetaKeyValueBuilder
        title="3. Medical Indications & Details (`long_description` JSON)"
        description="Add secondary medical details and precautions"
        pairs={longDescPairs}
        onChange={setLongDescPairs}
        presetSuggestions={[
          'Medical Indications',
          'Precautions & Contraindications',
          'Pharmacological Mode of Action',
        ]}
      />

      <div className="flex items-center justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>Save Variant & Meta JSON to Database</span>
        </button>
      </div>
    </form>
  );
};
