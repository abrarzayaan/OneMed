import React, { useState, useEffect } from 'react';
import {
  TagPlus,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Loader2,
  Flame,
  Star,
  Tag,
  Sparkles,
  Zap,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminCatalogApi } from '../../api/adminCatalog.api';
import type { AdminVariantItem } from '../../types/admin.types';
import { DynamicMetaKeyValueBuilder, type KeyValuePair } from './DynamicMetaKeyValueBuilder';
import { AdminPagination } from '../AdminPagination';

export const VariantManager: React.FC = () => {
  const [variants, setVariants] = useState<AdminVariantItem[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVariant, setEditingVariant] = useState<AdminVariantItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form states
  const [productId, setProductId] = useState<number | ''>('');
  const [variantName, setVariantName] = useState<string>('');
  const [sku, setSku] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [price, setPrice] = useState<number>(50);
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [minOrderQty, setMinOrderQty] = useState<number>(1);
  const [maxOrderQty, setMaxOrderQty] = useState<number | ''>('');
  const [status, setStatus] = useState<'active' | 'hidden'>('active');

  // Overview & Description (long_description JSON)
  const [about, setAbout] = useState<string>('');
  const [highlights, setHighlights] = useState<string>('');
  const [indications, setIndications] = useState<string>('');

  // Usage, Dosage & Storage (short_description JSON)
  const [dosage, setDosage] = useState<string>('');
  const [storageAdvice, setStorageAdvice] = useState<string>('');
  const [warnings, setWarnings] = useState<string>('');
  const [sideEffects, setSideEffects] = useState<string>('');

  // Dimensions JSON { length, width, height, unit }
  const [dimLength, setDimLength] = useState<number | ''>(0);
  const [dimWidth, setDimWidth] = useState<number | ''>(0);
  const [dimHeight, setDimHeight] = useState<number | ''>(0);
  const [dimUnit, setDimUnit] = useState<string>('cm');

  // Meta boolean flags
  const [isHotDeal, setIsHotDeal] = useState<boolean>(false);
  const [isBestSelling, setIsBestSelling] = useState<boolean>(false);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [isFlashSale, setIsFlashSale] = useState<boolean>(false);
  const [isGenuine, setIsGenuine] = useState<boolean>(true);

  // Dynamic meta key-value pairs
  const [metaPairs, setMetaPairs] = useState<KeyValuePair[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [varData, prodsData] = await Promise.all([
        adminCatalogApi.getVariants(),
        adminCatalogApi.getProducts(),
      ]);
      setVariants(varData);
      setProducts(prodsData);
      if (prodsData.length > 0) setProductId(prodsData[0].id);
    } catch {
      toast.error('Failed to load variants from API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const openCreateModal = () => {
    setEditingVariant(null);
    if (products.length > 0) setProductId(products[0].id);
    setVariantName('');
    setSku('');
    setBarcode('');
    setPrice(50);
    setSalePrice('');
    setCostPrice('');
    setMinOrderQty(1);
    setMaxOrderQty('');
    setStatus('active');
    setAbout('Fast-acting formula for effective fever and pain relief.');
    setHighlights('Fast action formula\nGentle on stomach\nApproved by DGDA');
    setIndications('Relief from fever, headaches, toothaches, and body pain.');
    setDosage('1 tablet 2-3 times daily after meals');
    setStorageAdvice('Store below 30°C in a dry place away from direct light');
    setWarnings('Do not exceed recommended dose. Keep out of reach of children.');
    setSideEffects('Mild dizziness or stomach upset in rare cases');
    setDimLength(0);
    setDimWidth(0);
    setDimHeight(0);
    setDimUnit('cm');
    setIsHotDeal(false);
    setIsBestSelling(false);
    setIsFeatured(false);
    setIsFlashSale(false);
    setIsGenuine(true);
    setMetaPairs([
      { id: '1', key: 'pack_size', value: '10 Pcs Strip' },
      { id: '2', key: 'formulation', value: 'Tablet' },
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (item: AdminVariantItem) => {
    setEditingVariant(item);
    setProductId(item.product_id || (products.length > 0 ? products[0].id : ''));
    setVariantName(item.variant_name);
    setSku(item.sku);
    setBarcode(item.barcode || '');
    setPrice(item.price);
    setSalePrice(item.sale_price !== null ? item.sale_price : '');
    setCostPrice(item.cost_price !== undefined && item.cost_price !== null ? item.cost_price : '');
    setMinOrderQty(item.min_order_qty || 1);
    setMaxOrderQty(item.max_order_qty !== undefined && item.max_order_qty !== null ? item.max_order_qty : '');
    setStatus((item.status as 'active' | 'hidden') || 'active');

    // Parse long_description JSON
    const longDesc = typeof item.long_description === 'object' && item.long_description !== null
      ? (item.long_description as Record<string, any>)
      : {};
    setAbout(longDesc.about || '');
    setHighlights(
      Array.isArray(longDesc.highlights)
        ? longDesc.highlights.join('\n')
        : (longDesc.highlights || '')
    );
    setIndications(longDesc.indications || '');

    // Parse short_description JSON
    const shortDesc = typeof item.short_description === 'object' && item.short_description !== null
      ? (item.short_description as Record<string, any>)
      : {};
    setDosage(shortDesc.dosage || '');
    setStorageAdvice(shortDesc.storage || '');
    setWarnings(shortDesc.warnings || '');
    setSideEffects(shortDesc.side_effects || '');

    // Parse meta JSON
    const meta = item.meta || {};
    setIsHotDeal(!!meta.is_hot_deal);
    setIsBestSelling(!!meta.is_best_selling);
    setIsFeatured(!!meta.is_featured);
    setIsFlashSale(!!meta.is_flash_sale);
    setIsGenuine(meta.is_genuine !== undefined ? !!meta.is_genuine : true);

    // Dimensions (Top-level column in ProductVariant model)
    const dims = item.dimensions || item.meta?.dimensions;
    if (dims && typeof dims === 'object') {
      setDimLength(dims.length ?? 0);
      setDimWidth(dims.width ?? 0);
      setDimHeight(dims.height ?? 0);
      setDimUnit(dims.unit || 'cm');
    } else {
      setDimLength(0);
      setDimWidth(0);
      setDimHeight(0);
      setDimUnit('cm');
    }

    const knownMetaKeys = [
      'dimensions',
      'is_hot_deal',
      'is_best_selling',
      'is_top_rated',
      'is_featured',
      'is_flash_sale',
      'is_quick_access',
      'is_genuine',
    ];

    const pairs: KeyValuePair[] = [];
    Object.entries(meta).forEach(([k, v]) => {
      if (!knownMetaKeys.includes(k)) {
        pairs.push({
          id: Math.random().toString(36).substr(2, 9),
          key: k,
          value: typeof v === 'object' ? JSON.stringify(v) : String(v),
        });
      }
    });
    setMetaPairs(pairs);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      toast.error('Select a Product Master');
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

    setIsSubmitting(true);
    try {
      const longDescObj: Record<string, any> = {
        about,
        highlights: highlights.split('\n').map((s) => s.trim()).filter(Boolean),
        indications,
      };

      const shortDescObj: Record<string, any> = {
        dosage,
        storage: storageAdvice,
        warnings,
        side_effects: sideEffects,
      };

      const dimensionsObj = {
        length: Number(dimLength) || 0,
        width: Number(dimWidth) || 0,
        height: Number(dimHeight) || 0,
        unit: dimUnit || 'cm',
      };

      const metaObj: Record<string, any> = {
        is_hot_deal: isHotDeal,
        is_best_selling: isBestSelling,
        is_featured: isFeatured,
        is_flash_sale: isFlashSale,
        is_genuine: isGenuine,
      };

      metaPairs.forEach((p) => {
        if (p.key.trim()) {
          metaObj[p.key.trim()] = p.value.trim();
        }
      });

      const payload = {
        product: Number(productId),
        variant_name: variantName,
        sku,
        barcode: barcode.trim() || undefined,
        price,
        sale_price: salePrice === '' ? null : Number(salePrice),
        cost_price: costPrice === '' ? null : Number(costPrice),
        min_order_qty: Number(minOrderQty) || 1,
        max_order_qty: maxOrderQty === '' ? null : Number(maxOrderQty),
        status,
        dimensions: dimensionsObj,
        short_description: shortDescObj,
        long_description: longDescObj,
        meta: metaObj,
      };

      if (editingVariant) {
        await adminCatalogApi.updateVariantFull(editingVariant.id, payload);
        toast.success(`Variant "${variantName}" updated successfully!`);
      } else {
        await adminCatalogApi.createVariant(payload);
        toast.success(`Variant "${variantName}" created successfully!`);
      }

      setIsModalOpen(false);
      fetchInitialData();
    } catch {
      toast.error('Failed to save variant via API');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminCatalogApi.deleteVariant(id);
      toast.success('Variant deleted successfully!');
      setDeleteConfirmId(null);
      fetchInitialData();
    } catch {
      toast.error('Failed to delete variant');
    }
  };

  const filteredVariants = variants.filter((v) => {
    const matchesSearch =
      v.variant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredVariants.length / itemsPerPage);
  const paginatedVariants = filteredVariants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-bg-card border border-bg-border shadow-card">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <TagPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-head font-bold text-xl text-content-primary">
              Product Variant & Pricing Management
            </h2>
            <p className="text-xs text-content-muted">
              Configure pack sizes, pricing, SKU codes, promotional badges & dynamic meta specs
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchInitialData}
            className="p-2.5 rounded-xl bg-bg-surface hover:bg-bg-hover text-content-secondary border border-bg-border transition-colors"
            title="Refresh Variants"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Variant</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-content-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SKU, variant or product..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="text-xs font-mono text-content-muted">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs font-medium outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="active">Active Only</option>
            <option value="hidden">Hidden Only</option>
          </select>
        </div>
      </div>

      {/* Variant Table */}
      <div className="rounded-3xl bg-bg-card border border-bg-border overflow-hidden shadow-card">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
            <p className="text-xs text-content-muted">Loading variants from API...</p>
          </div>
        ) : filteredVariants.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <TagPlus className="w-10 h-10 text-content-muted mx-auto opacity-40" />
            <p className="text-sm font-bold text-content-secondary">No Variants Found</p>
            <p className="text-xs text-content-muted">Click &quot;Create New Variant&quot; to add one</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-content-secondary">
                <thead className="bg-bg-surface text-content-muted font-mono uppercase text-[10px] border-b border-bg-border">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">SKU & ID</th>
                    <th className="py-3.5 px-4 font-bold">Variant & Product</th>
                    <th className="py-3.5 px-4 font-bold">Pricing (৳)</th>
                    <th className="py-3.5 px-4 font-bold">Promo Badges</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bg-border">
                  {paginatedVariants.map((item) => {
                    const meta = item.meta || {};
                    return (
                      <tr key={item.id} className="hover:bg-bg-hover/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono">
                          <div className="font-bold text-primary-400">{item.sku}</div>
                          {item.barcode && (
                            <div className="text-[10px] text-indigo-300 font-semibold">
                              BC: {item.barcode}
                            </div>
                          )}
                          <div className="text-[10px] text-content-muted">#{item.id}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-head font-bold text-content-primary text-sm">
                            {item.variant_name}
                          </div>
                          <div className="text-[11px] text-content-muted">
                            {item.product_name || `Product #${item.product_id}`}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 space-y-0.5 font-mono">
                          <div className="font-bold text-content-primary">
                            ৳{item.price}
                          </div>
                          {item.sale_price !== null && (
                            <div className="text-emerald-400 font-bold text-[11px]">
                              Sale: ৳{item.sale_price}
                            </div>
                          )}
                          {item.cost_price !== null && item.cost_price !== undefined && (
                            <div className="text-amber-400 text-[10px]">
                              Cost: ৳{item.cost_price}
                            </div>
                          )}
                          {(item.min_order_qty > 1 || item.max_order_qty) && (
                            <div className="text-content-muted text-[10px]">
                              Qty: Min {item.min_order_qty} {item.max_order_qty ? `| Max ${item.max_order_qty}` : ''}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {meta.is_hot_deal && (
                              <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[9px] font-bold flex items-center gap-1">
                                <Flame className="w-2.5 h-2.5" /> Hot Deal
                              </span>
                            )}
                            {meta.is_best_selling && (
                              <span className="px-2 py-0.5 rounded bg-primary-500/15 text-primary-400 border border-primary-500/30 text-[9px] font-bold flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5" /> Top Seller
                              </span>
                            )}
                            {meta.is_featured && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-bold flex items-center gap-1">
                                <Star className="w-2.5 h-2.5" /> Featured
                              </span>
                            )}
                            {!meta.is_hot_deal && !meta.is_best_selling && !meta.is_featured && (
                              <span className="text-content-muted text-[10px] italic">Standard</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold inline-flex items-center space-x-1 ${
                              item.status === 'active'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-bg-surface text-content-muted border border-bg-border'
                            }`}
                          >
                            <span>{item.status.toUpperCase()}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg bg-bg-surface hover:bg-bg-hover text-content-secondary border border-bg-border transition-colors"
                              title="Edit Variant"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-1.5 rounded-lg bg-bg-surface hover:bg-rose-500/20 text-rose-400 border border-bg-border transition-colors"
                              title="Delete Variant"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredVariants.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-bg-card border border-bg-border rounded-3xl p-6 shadow-glow space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-bg-border pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <TagPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-head font-bold text-lg text-content-primary">
                    {editingVariant ? `Edit Variant: ${editingVariant.variant_name}` : 'Create Variant & Meta JSON'}
                  </h3>
                  <p className="text-xs text-content-muted">
                    Set SKU, Barcode, Pricing, Order Limits, badges & dynamic form specs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Product, Variant Name, SKU, Barcode */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
                    Product Master *
                  </label>
                  <select
                    required
                    value={productId}
                    onChange={(e) => setProductId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-emerald-500"
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
                    Variant Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={variantName}
                    onChange={(e) => setVariantName(e.target.value)}
                    placeholder="e.g. 10 Pcs Strip"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="e.g. NAPA-500-STRIP"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-primary-400 font-mono font-bold text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
                    Barcode (EAN/UPC)
                  </label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="e.g. 8901234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-indigo-300 font-mono font-bold text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Financial Pricing & Order Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-2xl bg-bg-surface border border-bg-border">
                <div>
                  <label className="block text-xs font-mono font-bold text-amber-400 mb-1">
                    Cost Price (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Vendor Cost"
                    className="w-full px-3 py-2 rounded-xl bg-bg-card border border-bg-border text-amber-400 font-mono font-bold text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Regular Price (৳) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary font-mono font-bold text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-emerald-400 mb-1">
                    Sale Price (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Offer Price"
                    className="w-full px-3 py-2 rounded-xl bg-bg-card border border-bg-border text-emerald-400 font-mono font-bold text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Min Order Qty *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minOrderQty}
                    onChange={(e) => setMinOrderQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary font-mono font-bold text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Max Order Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxOrderQty}
                    onChange={(e) => setMaxOrderQty(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Max Per Order"
                    className="w-full px-3 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary font-mono font-bold text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'hidden')}
                    className="w-full px-3 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs font-bold outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
              </div>

              {/* 1. OVERVIEW & DESCRIPTION (long_description JSON) */}
              <div className="p-4 rounded-2xl bg-bg-surface border border-bg-border space-y-3">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-emerald-400 uppercase">
                  <Tag className="w-4 h-4" />
                  <span>1. Overview & Description (`long_description` JSON)</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono text-content-muted mb-1">
                      About / Description (`about`)
                    </label>
                    <textarea
                      rows={2}
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      placeholder="e.g. Fast-acting pain reliever and fever reducer."
                      className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-content-muted mb-1">
                        Key Highlights (`highlights` - 1 per line)
                      </label>
                      <textarea
                        rows={3}
                        value={highlights}
                        onChange={(e) => setHighlights(e.target.value)}
                        placeholder="Fast action formula&#10;Gentle on stomach&#10;Approved by DGDA"
                        className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-emerald-500 font-mono resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-content-muted mb-1">
                        Indications / Quick Medical Note (`indications`)
                      </label>
                      <textarea
                        rows={3}
                        value={indications}
                        onChange={(e) => setIndications(e.target.value)}
                        placeholder="e.g. Relief from fever, headaches, toothaches..."
                        className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. USAGE & STORAGE ADVICE (short_description JSON) */}
              <div className="p-4 rounded-2xl bg-bg-surface border border-bg-border space-y-3">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-primary-400 uppercase">
                  <Sparkles className="w-4 h-4" />
                  <span>2. Usage & Storage Advice (`short_description` JSON)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-content-muted mb-1">
                      Dosage & Administration (`dosage`)
                    </label>
                    <input
                      type="text"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      placeholder="e.g. 1 tablet twice daily after meals"
                      className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-content-muted mb-1">
                      Storage Advice (`storage`)
                    </label>
                    <input
                      type="text"
                      value={storageAdvice}
                      onChange={(e) => setStorageAdvice(e.target.value)}
                      placeholder="e.g. Store below 30°C in a dry place"
                      className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-content-muted mb-1">
                      Warnings & Precautions (`warnings`)
                    </label>
                    <input
                      type="text"
                      value={warnings}
                      onChange={(e) => setWarnings(e.target.value)}
                      placeholder="e.g. Do not exceed recommended dose"
                      className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-content-muted mb-1">
                      Side Effects (`side_effects`)
                    </label>
                    <input
                      type="text"
                      value={sideEffects}
                      onChange={(e) => setSideEffects(e.target.value)}
                      placeholder="e.g. Mild dizziness in rare cases"
                      className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Badges Box */}
              <div className="p-4 rounded-2xl bg-bg-surface border border-bg-border space-y-3">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-content-muted uppercase">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Promotional Badges (`meta` JSON Booleans)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <label className="p-2.5 rounded-xl bg-bg-card border border-bg-border flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isHotDeal}
                      onChange={(e) => setIsHotDeal(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-500"
                    />
                    <span className="text-xs font-bold text-content-primary flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-rose-500" /> Hot Deal
                    </span>
                  </label>

                  <label className="p-2.5 rounded-xl bg-bg-card border border-bg-border flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBestSelling}
                      onChange={(e) => setIsBestSelling(e.target.checked)}
                      className="w-4 h-4 rounded text-primary-500"
                    />
                    <span className="text-xs font-bold text-content-primary flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-primary-400" /> Best Seller
                    </span>
                  </label>

                  <label className="p-2.5 rounded-xl bg-bg-card border border-bg-border flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span className="text-xs font-bold text-content-primary flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400" /> Featured
                    </span>
                  </label>

                  <label className="p-2.5 rounded-xl bg-bg-card border border-bg-border flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFlashSale}
                      onChange={(e) => setIsFlashSale(e.target.checked)}
                      className="w-4 h-4 rounded text-accent-500"
                    />
                    <span className="text-xs font-bold text-content-primary flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-accent-400" /> Flash Sale
                    </span>
                  </label>

                  <label className="p-2.5 rounded-xl bg-bg-card border border-bg-border flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGenuine}
                      onChange={(e) => setIsGenuine(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500"
                    />
                    <span className="text-xs font-bold text-content-primary flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Genuine
                    </span>
                  </label>
                </div>
              </div>

              {/* Dimensions Box */}
              <div className="p-4 rounded-2xl bg-bg-surface border border-bg-border space-y-3">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-indigo-400 uppercase">
                  <Tag className="w-4 h-4" />
                  <span>3. Product Dimensions (`dimensions` JSON)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-content-muted mb-1">
                      Length
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={dimLength}
                      onChange={(e) => setDimLength(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-content-muted mb-1">
                      Width
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={dimWidth}
                      onChange={(e) => setDimWidth(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-content-muted mb-1">
                      Height
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={dimHeight}
                      onChange={(e) => setDimHeight(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-content-muted mb-1">
                      Unit
                    </label>
                    <select
                      value={dimUnit}
                      onChange={(e) => setDimUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-emerald-500"
                    >
                      <option value="cm">cm</option>
                      <option value="mm">mm</option>
                      <option value="in">inch (in)</option>
                      <option value="m">meter (m)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* DYNAMIC META BUILDER */}
              <DynamicMetaKeyValueBuilder
                title="Dynamic Meta Form Builder"
                description="Flexible key-value storage for extra attributes (pack_size, formulation, flavor, etc.)"
                pairs={metaPairs}
                onChange={setMetaPairs}
                presetSuggestions={[
                  'pack_size',
                  'formulation',
                  'strength',
                  'flavor',
                  'origin_country',
                  'storage_temp',
                  'prescription_required',
                  'target_age',
                ]}
              />

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-bg-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-bg-surface hover:bg-bg-hover border border-bg-border text-content-secondary font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{editingVariant ? 'Save Changes' : 'Create Variant'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-bg-card border border-rose-500/40 rounded-3xl p-6 shadow-glow space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-head font-bold text-lg text-content-primary">Delete Variant</h3>
            <p className="text-xs text-content-muted">
              Are you sure you want to delete variant #{deleteConfirmId}? This communicates directly with DRF API.
            </p>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-5 py-2 rounded-xl bg-bg-surface hover:bg-bg-hover border border-bg-border text-content-secondary text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-glow transition-all"
              >
                Delete Variant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
