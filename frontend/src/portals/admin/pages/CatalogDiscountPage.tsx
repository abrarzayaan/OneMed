import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Sparkles,
  Percent,
  Flame,
  Star,
  RefreshCw,
  Edit3,
  CheckSquare,
  Square,
  Tag,
  PlusCircle,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import type { AdminVariantItem } from '../types/admin.types';
import { adminCatalogApi } from '../api/adminCatalog.api';
import { BulkDiscountModal } from '../components/BulkDiscountModal';
import { SingleVariantEditModal } from '../components/SingleVariantEditModal';

export const CatalogDiscountPage: React.FC = () => {
  const navigate = useNavigate();
  const [variants, setVariants] = useState<AdminVariantItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedVariantIds, setSelectedVariantIds] = useState<number[]>([]);

  // Modals state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [editingVariant, setEditingVariant] = useState<AdminVariantItem | null>(null);

  const loadVariants = async () => {
    setLoading(true);
    try {
      const data = await adminCatalogApi.getVariants(searchQuery, categoryFilter);
      setVariants(data);
    } catch {
      toast.error('Failed to load catalog variants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVariants();
  }, [searchQuery, categoryFilter]);

  const toggleSelectAll = () => {
    if (selectedVariantIds.length === variants.length) {
      setSelectedVariantIds([]);
    } else {
      setSelectedVariantIds(variants.map((v) => v.id));
    }
  };

  const toggleSelectVariant = (id: number) => {
    if (selectedVariantIds.includes(id)) {
      setSelectedVariantIds(selectedVariantIds.filter((item) => item !== id));
    } else {
      setSelectedVariantIds([...selectedVariantIds, id]);
    }
  };

  const handleBulkSuccess = (updatedList: AdminVariantItem[]) => {
    setVariants(updatedList);
    setSelectedVariantIds([]);
  };

  const handleSingleSuccess = (updatedItem: AdminVariantItem) => {
    setVariants((prev) => prev.map((v) => (v.id === updatedItem.id ? updatedItem : v)));
  };

  // Stat Counters
  const discountedCount = variants.filter((v) => v.sale_price !== null && v.sale_price < v.price).length;
  const hotDealsCount = variants.filter((v) => v.meta?.is_hot_deal).length;
  const featuredCount = variants.filter((v) => v.meta?.is_featured || v.meta?.is_quick_access).length;

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-primary-400">
            <Package className="w-4 h-4" />
            <span>SECTION 03 — DYNAMIC PRICING ENGINE & CATALOG HUB</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-head font-bold text-content-primary tracking-tight">
            Product Variant Discount & Price Manager
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary mt-1">
            Manage regular price, sale price (৳), discount rules, and promotional badges (Hot Deal, Featured, Flash Sale).
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            onClick={() => navigate('/admin/creation')}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create Item (Section 00)</span>
          </button>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Bulk Rule Builder ({selectedVariantIds.length})</span>
          </button>

          <button
            onClick={loadVariants}
            className="p-2 rounded-xl bg-bg-card hover:bg-bg-hover border border-bg-border text-content-primary text-xs font-semibold transition-colors"
            title="Refresh Catalog Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-bg-card border border-bg-border flex items-center justify-between shadow-card">
          <div>
            <div className="text-xs font-medium text-content-muted">Total Catalog Variants</div>
            <div className="text-2xl font-mono font-bold text-content-primary mt-1">{variants.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-bg-card border border-bg-border flex items-center justify-between shadow-card">
          <div>
            <div className="text-xs font-medium text-content-muted">Active Discounted Items</div>
            <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">{discountedCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-bg-card border border-bg-border flex items-center justify-between shadow-card">
          <div>
            <div className="text-xs font-medium text-content-muted">Hot Deals 🔥</div>
            <div className="text-2xl font-mono font-bold text-rose-400 mt-1">{hotDealsCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-bg-card border border-bg-border flex items-center justify-between shadow-card">
          <div>
            <div className="text-xs font-medium text-content-muted">Featured Items ⭐</div>
            <div className="text-2xl font-mono font-bold text-amber-400 mt-1">{featuredCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Star className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Data Table Card */}
      <div className="p-4 rounded-3xl bg-bg-card border border-bg-border shadow-card space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Product, SKU, or Variant..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-bg-surface border border-bg-border text-content-primary placeholder-content-muted text-xs outline-none focus:border-primary-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-primary-500"
            >
              <option value="ALL">All Categories</option>
              <option value="Prescription Medicines">Prescription Medicines</option>
              <option value="Gastric & Digestive Care">Gastric & Digestive Care</option>
              <option value="Cold & Allergy">Cold & Allergy</option>
            </select>
          </div>

          <div className="text-xs text-content-muted font-mono">
            Showing {variants.length} product variants
          </div>
        </div>

        {/* Variants Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-bg-border text-content-muted font-mono uppercase bg-bg-base/50">
              <tr>
                <th className="py-3.5 px-4 w-10">
                  <button onClick={toggleSelectAll} className="text-content-muted hover:text-content-primary">
                    {selectedVariantIds.length === variants.length && variants.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-primary-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Product Variant & SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Regular Price</th>
                <th className="py-3.5 px-4">Sale Price</th>
                <th className="py-3.5 px-4">Savings Badge</th>
                <th className="py-3.5 px-4">Promotional Flags</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border font-medium">
              {variants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-content-muted">
                    No product variants found. Click &quot;+ Create Item&quot; to add new variants.
                  </td>
                </tr>
              ) : (
                variants.map((v) => {
                  const isSelected = selectedVariantIds.includes(v.id);
                  const hasDiscount = v.sale_price !== null && v.sale_price < v.price;
                  const savings = hasDiscount ? v.price - v.sale_price! : 0;
                  const savingsPercent = hasDiscount ? Math.round((savings / v.price) * 100) : 0;

                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-bg-hover transition-colors ${
                        isSelected ? 'bg-primary-500/5' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectVariant(v.id)}
                          className="w-4 h-4 rounded text-primary-500"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-content-primary">{v.product_name}</div>
                        <div className="text-[11px] text-content-muted font-mono">
                          {v.variant_name} • <span className="text-primary-400">{v.sku}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-content-secondary">{v.category_name}</td>
                      <td className="py-4 px-4 font-mono font-bold text-content-primary">
                        <span className={hasDiscount ? 'line-through text-content-muted font-normal' : ''}>
                          ৳ {v.price}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold">
                        {hasDiscount ? (
                          <span className="text-emerald-400">৳ {v.sale_price}</span>
                        ) : (
                          <span className="text-content-muted font-normal">No Sale</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono">
                        {hasDiscount ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            {savingsPercent}% OFF (৳{savings})
                          </span>
                        ) : (
                          <span className="text-content-muted text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {v.meta?.is_hot_deal && (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono text-[10px] font-bold flex items-center gap-1">
                              <Flame className="w-3 h-3 text-rose-400" /> HOT
                            </span>
                          )}
                          {v.meta?.is_best_selling && (
                            <span className="px-2 py-0.5 rounded bg-primary-500/20 text-primary-400 font-mono text-[10px] font-bold flex items-center gap-1">
                              <Tag className="w-3 h-3 text-primary-400" /> BEST SELLING
                            </span>
                          )}
                          {(v.meta?.is_featured || v.meta?.is_quick_access) && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-400" /> FEATURED
                            </span>
                          )}
                          {v.meta?.is_flash_sale && (
                            <span className="px-2 py-0.5 rounded bg-accent-500/20 text-accent-400 font-mono text-[10px] font-bold flex items-center gap-1">
                              <Zap className="w-3 h-3 text-accent-400" /> FLASH SALE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setEditingVariant(v)}
                          className="px-3.5 py-1.5 rounded-xl bg-bg-surface hover:bg-bg-hover border border-bg-border text-content-primary font-semibold text-xs transition-all flex items-center space-x-1 ml-auto"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-primary-400" />
                          <span>Edit Pricing</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Discount Modal */}
      {isBulkModalOpen && (
        <BulkDiscountModal
          variants={variants}
          selectedVariantIds={selectedVariantIds}
          onClose={() => setIsBulkModalOpen(false)}
          onApplySuccess={handleBulkSuccess}
        />
      )}

      {/* Single Edit Pricing Modal */}
      {editingVariant && (
        <SingleVariantEditModal
          variant={editingVariant}
          onClose={() => setEditingVariant(null)}
          onUpdateSuccess={handleSingleSuccess}
        />
      )}
    </div>
  );
};
