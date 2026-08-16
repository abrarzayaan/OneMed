import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Loader2,
  Store,
  RefreshCw,
  AlertTriangle,
  Zap,
  CheckSquare,
  Square,
  Check,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminCatalogApi, type InventoryItem } from '../../api/adminCatalog.api';
import type { AdminVariantItem } from '../../types/admin.types';

export const InventoryManager: React.FC = () => {
  const [inventories, setInventories] = useState<InventoryItem[]>([]);
  const [variants, setVariants] = useState<AdminVariantItem[]>([]);
  const [vendors, setVendors] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [vendorFilter, setVendorFilter] = useState<string>('ALL');

  // Single Item Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Bulk Modal states
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [bulkVendorId, setBulkVendorId] = useState<number | ''>('');
  const [bulkSearchQuery, setBulkSearchQuery] = useState<string>('');
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<number>>(new Set());
  const [bulkDefaultStock, setBulkDefaultStock] = useState<number>(100);
  const [bulkDefaultReorder, setBulkDefaultReorder] = useState<number>(10);
  const [bulkItemCustoms, setBulkItemCustoms] = useState<Record<number, { stock: number; reorder: number }>>({});

  // Form states
  const [variantId, setVariantId] = useState<number | ''>('');
  const [vendorId, setVendorId] = useState<number | ''>('');
  const [stockQty, setStockQty] = useState<number>(100);
  const [reservedQty, setReservedQty] = useState<number>(0);
  const [damagedQty, setDamagedQty] = useState<number>(0);
  const [reorderLevel, setReorderLevel] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [invData, varData, venData] = await Promise.all([
        adminCatalogApi.getInventories(),
        adminCatalogApi.getVariants(),
        adminCatalogApi.getVendors(),
      ]);
      setInventories(invData);
      setVariants(varData);
      setVendors(venData);
      if (varData.length > 0) setVariantId(varData[0].id);
      if (venData.length > 0) setVendorId(venData[0].id);
      if (venData.length > 0 && !bulkVendorId) setBulkVendorId(venData[0].id);
    } catch {
      toast.error('Failed to load inventory from API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const openCreateModal = () => {
    setEditingInventory(null);
    if (variants.length > 0) setVariantId(variants[0].id);
    if (vendors.length > 0) setVendorId(vendors[0].id);
    setStockQty(100);
    setReservedQty(0);
    setDamagedQty(0);
    setReorderLevel(10);
    setIsModalOpen(true);
  };

  const openEditModal = (inv: InventoryItem) => {
    setEditingInventory(inv);
    setVariantId(inv.variant || (variants.length > 0 ? variants[0].id : ''));
    setVendorId(inv.vendor || (vendors.length > 0 ? vendors[0].id : ''));
    setStockQty(inv.stock_qty || 0);
    setReservedQty(inv.reserved_qty || 0);
    setDamagedQty(inv.damaged_qty || 0);
    setReorderLevel(inv.reorder_level || 10);
    setIsModalOpen(true);
  };

  const openBulkModal = () => {
    if (vendors.length > 0) setBulkVendorId(vendors[0].id);
    setBulkSearchQuery('');
    // By default select all active variants
    setSelectedVariantIds(new Set(variants.map((v) => v.id)));
    
    const initialCustoms: Record<number, { stock: number; reorder: number }> = {};
    variants.forEach((v) => {
      initialCustoms[v.id] = { stock: bulkDefaultStock, reorder: bulkDefaultReorder };
    });
    setBulkItemCustoms(initialCustoms);
    setIsBulkModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantId) {
      toast.error('Select a Product Variant');
      return;
    }
    if (stockQty < 0) {
      toast.error('Stock Quantity cannot be negative');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        variant: Number(variantId),
        vendor: vendorId ? Number(vendorId) : null,
        stock_qty: stockQty,
        reserved_qty: reservedQty,
        damaged_qty: damagedQty,
        reorder_level: reorderLevel,
      };

      if (editingInventory) {
        await adminCatalogApi.updateInventory(editingInventory.id, payload);
        toast.success('Inventory stock updated successfully!');
      } else {
        await adminCatalogApi.createInventory(payload);
        toast.success('New inventory batch added successfully!');
      }

      setIsModalOpen(false);
      fetchInitialData();
    } catch {
      toast.error('Failed to save inventory via API');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVariantIds.size === 0) {
      toast.error('Please select at least one variant for bulk update');
      return;
    }

    const targetVendor = bulkVendorId ? Number(bulkVendorId) : null;
    setIsSubmitting(true);
    try {
      let updatedCount = 0;
      let createdCount = 0;

      // Map existing inventory records by variant ID for target vendor
      const vendorInvMap = new Map<number, InventoryItem>();
      inventories.forEach((inv) => {
        if (!targetVendor || inv.vendor === targetVendor) {
          vendorInvMap.set(inv.variant, inv);
        }
      });

      const selectedIdsArray = Array.from(selectedVariantIds);
      const promises = selectedIdsArray.map(async (varId) => {
        const custom = bulkItemCustoms[varId] || { stock: bulkDefaultStock, reorder: bulkDefaultReorder };
        const existingInv = vendorInvMap.get(varId);

        if (existingInv) {
          await adminCatalogApi.updateInventory(existingInv.id, {
            stock_qty: custom.stock,
            reorder_level: custom.reorder,
          });
          updatedCount++;
        } else {
          await adminCatalogApi.createInventory({
            variant: varId,
            vendor: targetVendor,
            stock_qty: custom.stock,
            reorder_level: custom.reorder,
          });
          createdCount++;
        }
      });

      await Promise.all(promises);
      toast.success(`Bulk Inventory Sync Complete! (${updatedCount} updated, ${createdCount} created)`);
      setIsBulkModalOpen(false);
      fetchInitialData();
    } catch {
      toast.error('Failed to execute bulk inventory update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminCatalogApi.deleteInventory(id);
      toast.success('Inventory record deleted successfully!');
      setDeleteConfirmId(null);
      fetchInitialData();
    } catch {
      toast.error('Failed to delete inventory');
    }
  };

  const applyDefaultStockToAllSelected = () => {
    const nextCustoms = { ...bulkItemCustoms };
    selectedVariantIds.forEach((varId) => {
      nextCustoms[varId] = {
        stock: bulkDefaultStock,
        reorder: bulkDefaultReorder,
      };
    });
    setBulkItemCustoms(nextCustoms);
    toast.success(`Applied ${bulkDefaultStock} Qty to all ${selectedVariantIds.size} selected variants!`);
  };

  const filteredInventories = useMemo(() => {
    return inventories.filter((inv) => {
      const vName = inv.variant_name || '';
      const pName = inv.product_name || '';
      const venName = inv.vendor_name || '';
      const q = searchQuery.toLowerCase();

      const matchesSearch =
        vName.toLowerCase().includes(q) ||
        pName.toLowerCase().includes(q) ||
        venName.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;

      const matchesVendor =
        vendorFilter === 'ALL' ||
        inv.vendor === Number(vendorFilter) ||
        String(inv.vendor) === vendorFilter;

      return matchesSearch && matchesStatus && matchesVendor;
    });
  }, [inventories, searchQuery, statusFilter, vendorFilter]);

  const bulkFilteredVariants = useMemo(() => {
    if (!bulkSearchQuery.trim()) return variants;
    const q = bulkSearchQuery.toLowerCase();
    return variants.filter(
      (v) =>
        v.product_name.toLowerCase().includes(q) ||
        v.variant_name.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q)
    );
  }, [variants, bulkSearchQuery]);

  const toggleSelectAllBulk = () => {
    if (selectedVariantIds.size === bulkFilteredVariants.length) {
      setSelectedVariantIds(new Set());
    } else {
      const newSet = new Set(selectedVariantIds);
      bulkFilteredVariants.forEach((v) => newSet.add(v.id));
      setSelectedVariantIds(newSet);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-bg-card border border-bg-border shadow-card">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-head font-bold text-xl text-content-primary">
              Inventory & Vendor Stock Control
            </h2>
            <p className="text-xs text-content-muted">
              Manage stock levels, vendor store allocations & bulk multi-variant inventory updates
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchInitialData}
            className="p-2.5 rounded-xl bg-bg-surface hover:bg-bg-hover text-content-secondary border border-bg-border transition-colors"
            title="Refresh Inventory Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={openBulkModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Bulk Add / Update Stock</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Single Stock Batch</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-bg-card/50 p-4 rounded-2xl border border-bg-border">
        {/* Search Query */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-content-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by variant, product or vendor..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
          {/* Vendor Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-semibold text-content-muted">Vendor Hub:</span>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs font-bold outline-none focus:border-amber-500 max-w-[200px] truncate"
            >
              <option value="ALL">All Vendor Hubs ({vendors.length})</option>
              {vendors.map((ven) => (
                <option key={ven.id} value={ven.id.toString()}>
                  {ven.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-semibold text-content-muted">Stock Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs font-bold outline-none focus:border-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="in_stock">In Stock Only</option>
              <option value="low_stock">Low Stock Only</option>
              <option value="out_of_stock">Out of Stock Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-3xl bg-bg-card border border-bg-border overflow-hidden shadow-card">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
            <p className="text-xs text-content-muted">Loading inventory records from API...</p>
          </div>
        ) : filteredInventories.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Boxes className="w-10 h-10 text-content-muted mx-auto opacity-40" />
            <p className="text-sm font-bold text-content-secondary">No Inventory Records Match Filters</p>
            <p className="text-xs text-content-muted">Try selecting a different vendor or status filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-content-secondary">
              <thead className="bg-bg-surface text-content-muted font-mono uppercase text-[10px] border-b border-bg-border">
                <tr>
                  <th className="py-3.5 px-4 font-bold">ID</th>
                  <th className="py-3.5 px-4 font-bold">Product Variant</th>
                  <th className="py-3.5 px-4 font-bold">Vendor Store Hub</th>
                  <th className="py-3.5 px-4 font-bold">Physical Stock</th>
                  <th className="py-3.5 px-4 font-bold">Available Stock</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border">
                {filteredInventories.map((inv) => {
                  const available = inv.available_stock !== undefined
                    ? inv.available_stock
                    : Math.max(0, inv.stock_qty - inv.reserved_qty - inv.damaged_qty);

                  return (
                    <tr key={inv.id} className="hover:bg-bg-hover/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-content-muted">
                        #{inv.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-head font-bold text-content-primary text-sm">
                          {inv.variant_name || `Variant #${inv.variant}`}
                        </div>
                        {inv.product_name && (
                          <div className="text-[11px] text-content-muted">{inv.product_name}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5 text-content-primary font-bold">
                          <Store className="w-3.5 h-3.5 text-amber-400" />
                          <span>{inv.vendor_name || 'Central Pharmacy Hub'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5 font-mono">
                        <div className="font-bold text-content-primary text-sm">
                          {inv.stock_qty} Pcs
                        </div>
                        <div className="text-[10px] text-content-muted">
                          Reserved: {inv.reserved_qty} | Damaged: {inv.damaged_qty}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                        {available} Pcs
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold inline-flex items-center space-x-1 ${
                            inv.status === 'in_stock'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : inv.status === 'low_stock'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              inv.status === 'in_stock'
                                ? 'bg-emerald-400'
                                : inv.status === 'low_stock'
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                            }`}
                          />
                          <span className="capitalize">{inv.status.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(inv)}
                            className="p-1.5 rounded-lg bg-bg-surface hover:bg-amber-500/20 text-amber-400 border border-bg-border transition-colors"
                            title="Edit Stock"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(inv.id)}
                            className="p-1.5 rounded-lg bg-bg-surface hover:bg-rose-500/20 text-rose-400 border border-bg-border transition-colors"
                            title="Delete Inventory Record"
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
        )}
      </div>

      {/* ⚡ BULK INVENTORY ENTRY & UPDATE MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-bg-card border border-indigo-500/40 rounded-3xl p-6 shadow-glow space-y-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-bg-border pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  <Zap className="w-6 h-6 text-amber-300 fill-amber-300" />
                </div>
                <div>
                  <h3 className="font-head font-bold text-xl text-content-primary">
                    Bulk Multi-Variant Inventory Stock Entry
                  </h3>
                  <p className="text-xs text-content-muted">
                    Select target Vendor and update inventory stock levels across multiple product variants at once
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="flex-1 flex flex-col space-y-5 overflow-hidden">
              {/* Step 1: Select Vendor & Quick Default Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-bg-surface border border-bg-border">
                {/* Vendor Selector */}
                <div>
                  <label className="block text-xs font-mono font-bold text-indigo-400 mb-1">
                    1. Target Vendor Store Hub *
                  </label>
                  <select
                    required
                    value={bulkVendorId}
                    onChange={(e) => setBulkVendorId(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary font-bold text-xs outline-none focus:border-indigo-500"
                  >
                    {vendors.map((ven) => (
                      <option key={ven.id} value={ven.id}>
                        {ven.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Default Stock Quantity */}
                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    2. Default Stock Qty (Batch)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={bulkDefaultStock}
                    onChange={(e) => setBulkDefaultStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-emerald-400 font-mono font-bold text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Apply Default Stock Button */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={applyDefaultStockToAllSelected}
                    className="w-full px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold text-xs border border-indigo-500/40 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Qty ({bulkDefaultStock}) to Selected</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Variant Selection Toolbar & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-content-muted" />
                  <input
                    type="text"
                    value={bulkSearchQuery}
                    onChange={(e) => setBulkSearchQuery(e.target.value)}
                    placeholder="Search product variants to include..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center space-x-3 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={toggleSelectAllBulk}
                    className="text-xs font-mono font-bold text-indigo-400 hover:underline flex items-center space-x-1"
                  >
                    {selectedVariantIds.size === bulkFilteredVariants.length ? (
                      <>
                        <CheckSquare className="w-4 h-4" />
                        <span>Deselect All</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4" />
                        <span>Select All ({bulkFilteredVariants.length})</span>
                      </>
                    )}
                  </button>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    {selectedVariantIds.size} Selected
                  </span>
                </div>
              </div>

              {/* Step 3: Scrollable Variant Selection List with Individual Inputs */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar min-h-[220px] max-h-[360px]">
                {bulkFilteredVariants.length === 0 ? (
                  <div className="p-8 text-center text-xs text-content-muted">
                    No product variants match your query &quot;{bulkSearchQuery}&quot;
                  </div>
                ) : (
                  bulkFilteredVariants.map((v) => {
                    const isSelected = selectedVariantIds.has(v.id);
                    const custom = bulkItemCustoms[v.id] || { stock: bulkDefaultStock, reorder: bulkDefaultReorder };

                    return (
                      <div
                        key={v.id}
                        className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-indigo-950/20 border-indigo-500/50 text-content-primary'
                            : 'bg-bg-surface/50 border-bg-border/60 text-content-muted opacity-70 hover:opacity-100'
                        }`}
                      >
                        {/* Left: Checkbox + Variant Info */}
                        <div
                          onClick={() => {
                            const next = new Set(selectedVariantIds);
                            if (isSelected) next.delete(v.id);
                            else next.add(v.id);
                            setSelectedVariantIds(next);
                          }}
                          className="flex items-start space-x-3 cursor-pointer flex-1"
                        >
                          <div className="mt-0.5">
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-indigo-400" />
                            ) : (
                              <Square className="w-5 h-5 text-content-muted" />
                            )}
                          </div>
                          <div>
                            <div className="font-head font-bold text-sm text-content-primary flex items-center space-x-2">
                              <span>{v.product_name} - {v.variant_name}</span>
                              <span className="text-[10px] font-mono font-normal text-content-muted bg-bg-card px-2 py-0.5 rounded border border-bg-border">
                                {v.sku}
                              </span>
                            </div>
                            <div className="text-[11px] text-content-muted">
                              Category: {v.category_name} | Price: ৳{v.price}
                            </div>
                          </div>
                        </div>

                        {/* Right: Quantity Inputs if Selected */}
                        {isSelected && (
                          <div className="flex items-center space-x-3 shrink-0 self-end sm:self-auto">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[10px] font-mono text-content-muted">Stock Qty:</span>
                              <input
                                type="number"
                                min="0"
                                value={custom.stock}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setBulkItemCustoms((prev) => ({
                                    ...prev,
                                    [v.id]: { ...custom, stock: val },
                                  }));
                                }}
                                className="w-20 px-2.5 py-1 rounded-lg bg-bg-card border border-indigo-500/50 text-emerald-400 font-mono font-bold text-xs outline-none text-center"
                              />
                            </div>

                            <div className="flex items-center space-x-1.5">
                              <span className="text-[10px] font-mono text-content-muted">Reorder:</span>
                              <input
                                type="number"
                                min="0"
                                value={custom.reorder}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setBulkItemCustoms((prev) => ({
                                    ...prev,
                                    [v.id]: { ...custom, reorder: val },
                                  }));
                                }}
                                className="w-16 px-2.5 py-1 rounded-lg bg-bg-card border border-bg-border text-amber-400 font-mono text-xs outline-none text-center"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Submit Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-bg-border">
                <span className="text-xs font-mono text-content-muted">
                  Ready to update stock for <strong className="text-indigo-400">{selectedVariantIds.size}</strong> variants
                </span>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-bg-surface hover:bg-bg-hover border border-bg-border text-content-secondary font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || selectedVariantIds.size === 0}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    )}
                    <span>Save Bulk Inventory ({selectedVariantIds.size} Items)</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT SINGLE ITEM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-bg-card border border-bg-border rounded-3xl p-6 shadow-glow space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-bg-border pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-head font-bold text-lg text-content-primary">
                    {editingInventory ? `Edit Stock Record #${editingInventory.id}` : 'Add Inventory Stock Batch'}
                  </h3>
                  <p className="text-xs text-content-muted">
                    Allocate stock levels to vendor hubs & set safety thresholds
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
                    Product Variant *
                  </label>
                  <select
                    required
                    value={variantId}
                    onChange={(e) => setVariantId(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-amber-500"
                  >
                    {variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.product_name} - {v.variant_name} ({v.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
                    Vendor Store / Hub (Optional)
                  </label>
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-amber-500"
                  >
                    <option value="">Central Depot / Auto Vendor</option>
                    {vendors.map((ven) => (
                      <option key={ven.id} value={ven.id}>
                        {ven.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stock Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-bg-surface border border-bg-border">
                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Physical Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockQty}
                    onChange={(e) => setStockQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary font-mono font-bold text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-amber-400 font-mono font-bold text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Reserved Stock (In Orders)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reservedQty}
                    onChange={(e) => setReservedQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary font-mono text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Damaged / Expired Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={damagedQty}
                    onChange={(e) => setDamagedQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-rose-400 font-mono text-sm outline-none focus:border-rose-500"
                  />
                </div>
              </div>

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
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{editingInventory ? 'Save Changes' : 'Add Stock Batch'}</span>
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
            <h3 className="font-head font-bold text-lg text-content-primary">Delete Inventory Record</h3>
            <p className="text-xs text-content-muted">
              Are you sure you want to delete inventory record #{deleteConfirmId}?
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
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
