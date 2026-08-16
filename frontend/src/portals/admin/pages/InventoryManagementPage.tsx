import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  SlidersHorizontal,
  PackageCheck,
  Building2,
  Calendar,
  DollarSign,
  TrendingDown,
  ShieldAlert,
  ArrowUpDown,
  Filter,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminInventoryApi } from '../api/adminInventory.api';
import type { StockBatch } from '../api/adminInventory.api';

export const InventoryManagementPage: React.FC = () => {
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW_STOCK' | 'EXPIRING_SOON' | 'EXPIRED'>('ALL');

  // Adjust Stock Modal State
  const [adjustBatch, setAdjustBatch] = useState<StockBatch | null>(null);
  const [adjStockQty, setAdjStockQty] = useState<number>(0);
  const [adjReservedQty, setAdjReservedQty] = useState<number>(0);
  const [adjDamagedQty, setAdjDamagedQty] = useState<number>(0);

  // Add/Edit Batch Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<number | null>(null);
  const [formVariantName, setFormVariantName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBrandName, setFormBrandName] = useState('');
  const [formVendorName, setFormVendorName] = useState('');
  const [formBatchNumber, setFormBatchNumber] = useState('');
  const [formStockQty, setFormStockQty] = useState<number>(100);
  const [formReorderLevel, setFormReorderLevel] = useState<number>(30);
  const [formMfgDate, setFormMfgDate] = useState('2025-01-01');
  const [formExpiryDate, setFormExpiryDate] = useState('2027-01-01');
  const [formUnitCost, setFormUnitCost] = useState<number>(20);

  const loadInventory = async () => {
    setLoading(true);
    const data = await adminInventoryApi.getInventoryBatches();
    setBatches(data);
    setLoading(false);
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // Filtered Batches
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchesSearch =
        b.variant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.batch_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.vendor_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' ? true : b.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [batches, searchQuery, statusFilter]);

  // Aggregate Metrics
  const lowStockCount = useMemo(() => batches.filter((b) => b.status === 'LOW_STOCK').length, [batches]);
  const expiringSoonCount = useMemo(() => batches.filter((b) => b.status === 'EXPIRING_SOON').length, [batches]);
  const expiredCount = useMemo(() => batches.filter((b) => b.status === 'EXPIRED').length, [batches]);

  // Handle Quick Adjust Save
  const handleSaveStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustBatch) return;

    await adminInventoryApi.updateBatch(adjustBatch.id, {
      stock_qty: adjStockQty,
      reserved_qty: adjReservedQty,
      damaged_qty: adjDamagedQty,
    });

    toast.success(`Inventory stock updated for Batch #${adjustBatch.batch_number}`);
    setAdjustBatch(null);
    loadInventory();
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingBatchId(null);
    setFormVariantName('');
    setFormSku('');
    setFormBrandName('Square Pharmaceuticals Ltd.');
    setFormVendorName('Lazz Pharma');
    setFormBatchNumber(`BATCH-SQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`);
    setFormStockQty(100);
    setFormReorderLevel(30);
    setFormMfgDate('2025-01-01');
    setFormExpiryDate('2027-06-30');
    setFormUnitCost(25);
    setIsBatchModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (batch: StockBatch) => {
    setEditingBatchId(batch.id);
    setFormVariantName(batch.variant_name);
    setFormSku(batch.sku);
    setFormBrandName(batch.brand_name);
    setFormVendorName(batch.vendor_name);
    setFormBatchNumber(batch.batch_number);
    setFormStockQty(batch.stock_qty);
    setFormReorderLevel(batch.reorder_level);
    setFormMfgDate(batch.mfg_date);
    setFormExpiryDate(batch.expiry_date);
    setFormUnitCost(batch.unit_cost_bdt);
    setIsBatchModalOpen(true);
  };

  // Save Batch Modal
  const handleSaveBatchForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVariantName.trim() || !formBatchNumber.trim()) {
      toast.error('Variant Name and Batch Number are required.');
      return;
    }

    const payload = {
      variant_id: 101,
      variant_name: formVariantName,
      sku: formSku || `SKU-${Math.floor(Math.random() * 9000 + 1000)}`,
      brand_name: formBrandName,
      vendor_name: formVendorName,
      batch_number: formBatchNumber,
      stock_qty: Number(formStockQty),
      reserved_qty: 0,
      damaged_qty: 0,
      reorder_level: Number(formReorderLevel),
      mfg_date: formMfgDate,
      expiry_date: formExpiryDate,
      unit_cost_bdt: Number(formUnitCost),
    };

    if (editingBatchId) {
      await adminInventoryApi.updateBatch(editingBatchId, payload);
      toast.success('Batch updated successfully');
    } else {
      await adminInventoryApi.createBatch(payload);
      toast.success('New inventory batch added');
    }

    setIsBatchModalOpen(false);
    loadInventory();
  };

  // Delete Batch
  const handleDeleteBatch = async (batch: StockBatch) => {
    if (confirm(`Are you sure you want to delete batch ${batch.batch_number}?`)) {
      await adminInventoryApi.deleteBatch(batch.id);
      toast.success('Batch deleted');
      loadInventory();
    }
  };

  // Days left calculator
  const getDaysToExpiry = (dateStr: string) => {
    const exp = new Date(dateStr).getTime();
    const now = new Date().getTime();
    return Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary-950 via-bg-card to-bg-card p-6 rounded-3xl border border-primary-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20 text-xs font-mono font-semibold">
            <Boxes className="w-3.5 h-3.5" />
            <span>Section 09 — Pharmacy Inventory, Expiry & Reorder Management</span>
          </div>
          <h1 className="text-2xl font-head font-bold text-content-primary">
            Medicine Stock Batches & Expiry Control
          </h1>
          <p className="text-xs text-content-muted">
            Track pharmacy batch numbers, monitor near-expiry medicines, and manage low-stock threshold alerts.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stock Batch</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-bg-card border border-bg-border shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-content-muted">Total Batches</span>
            <Boxes className="w-4 h-4 text-primary-400" />
          </div>
          <div className="text-2xl font-head font-extrabold text-content-primary">{batches.length}</div>
          <div className="text-[10px] text-content-muted font-mono">Monitored inventory units</div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-card border border-bg-border shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-content-muted">Low Stock Alerts</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-head font-extrabold text-amber-400">{lowStockCount}</div>
          <div className="text-[10px] text-amber-400 font-mono">Below reorder threshold</div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-card border border-bg-border shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-content-muted">Expiring Soon</span>
            <Clock className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-head font-extrabold text-orange-400">{expiringSoonCount}</div>
          <div className="text-[10px] text-orange-400 font-mono">Expires within 60 days</div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-card border border-bg-border shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-content-muted">Expired Batches</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-head font-extrabold text-rose-400">{expiredCount}</div>
          <div className="text-[10px] text-rose-400 font-mono">Requires disposal authorization</div>
        </div>
      </div>

      {/* Critical Alert Banners */}
      {(lowStockCount > 0 || expiredCount > 0 || expiringSoonCount > 0) && (
        <div className="space-y-3">
          {expiredCount > 0 && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-400">
              <div className="flex items-center space-x-3">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <div>
                  <strong className="font-bold">EXPIRED MEDICINE ALERT:</strong> {expiredCount} batch(es) have passed their expiry dates and must be quarantined from customer orders.
                </div>
              </div>
              <button
                onClick={() => setStatusFilter('EXPIRED')}
                className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-mono font-bold shrink-0"
              >
                View Expired Batches
              </button>
            </div>
          )}

          {lowStockCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-400">
              <div className="flex items-center space-x-3">
                <TrendingDown className="w-5 h-5 shrink-0" />
                <div>
                  <strong className="font-bold">LOW STOCK THRESHOLD ALERT:</strong> {lowStockCount} item(s) have dropped below their designated reorder stock level.
                </div>
              </div>
              <button
                onClick={() => setStatusFilter('LOW_STOCK')}
                className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-mono font-bold shrink-0"
              >
                View Low Stock
              </button>
            </div>
          )}
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-bg-card border border-bg-border">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-content-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by variant name, SKU, batch number, or brand..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold text-content-muted">Filter Status:</span>
          <div className="flex rounded-xl bg-bg-surface border border-bg-border p-1">
            {(
              [
                { key: 'ALL', label: 'All Batches' },
                { key: 'LOW_STOCK', label: '⚠️ Low Stock' },
                { key: 'EXPIRING_SOON', label: '⏳ Expiring Soon' },
                { key: 'EXPIRED', label: '🔴 Expired' },
              ] as const
            ).map((st) => (
              <button
                key={st.key}
                onClick={() => setStatusFilter(st.key)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                  statusFilter === st.key
                    ? 'bg-primary-500/20 text-primary-400 font-bold border border-primary-500/30'
                    : 'text-content-muted hover:text-content-primary'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadInventory}
            className="p-2 rounded-xl bg-bg-surface border border-bg-border hover:border-primary-500/40 text-content-muted hover:text-content-primary transition-all"
            title="Refresh Inventory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inventory Data Table */}
      <div className="rounded-3xl bg-bg-card border border-bg-border shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-content-muted space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary-400" />
            <div>Loading medicine inventory batches...</div>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-content-muted space-y-2">
            <Info className="w-6 h-6 mx-auto text-content-muted opacity-50" />
            <div>No inventory batches matching selected filter.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-bg-border bg-bg-surface text-[10px] font-mono uppercase text-content-muted">
                  <th className="p-4">Medicine Variant & SKU</th>
                  <th className="p-4">Batch Number & Vendor</th>
                  <th className="p-4">Available Stock</th>
                  <th className="p-4">Reorder Threshold</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4">Batch Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border text-xs">
                {filteredBatches.map((batch) => {
                  const netAvailable = batch.stock_qty - batch.reserved_qty - batch.damaged_qty;
                  const daysLeft = getDaysToExpiry(batch.expiry_date);

                  return (
                    <tr key={batch.id} className="hover:bg-bg-surface/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-content-primary">{batch.variant_name}</div>
                        <div className="text-[11px] font-mono text-content-muted flex items-center space-x-2">
                          <span>SKU: {batch.sku}</span>
                          <span>•</span>
                          <span className="text-primary-400">{batch.brand_name}</span>
                        </div>
                      </td>

                      <td className="p-4 space-y-0.5">
                        <div className="font-mono font-bold text-indigo-400">{batch.batch_number}</div>
                        <div className="text-[11px] text-content-muted truncate max-w-[160px]">{batch.vendor_name}</div>
                      </td>

                      <td className="p-4">
                        <div className="font-mono font-bold text-sm text-content-primary">
                          {netAvailable} <span className="text-[10px] font-normal text-content-muted">units</span>
                        </div>
                        <div className="text-[10px] font-mono text-content-muted space-x-2">
                          <span>Phy: {batch.stock_qty}</span>
                          <span>Res: {batch.reserved_qty}</span>
                          {batch.damaged_qty > 0 && <span className="text-rose-400">Dmg: {batch.damaged_qty}</span>}
                        </div>
                      </td>

                      <td className="p-4 font-mono">
                        <div className="text-content-primary font-bold">{batch.reorder_level} units</div>
                        {netAvailable <= batch.reorder_level ? (
                          <span className="text-[10px] text-amber-400 font-bold">⚠️ Reorder Triggered</span>
                        ) : (
                          <span className="text-[10px] text-emerald-400">Stock Safe</span>
                        )}
                      </td>

                      <td className="p-4 space-y-0.5">
                        <div className="font-mono text-content-primary">{batch.expiry_date}</div>
                        <div
                          className={`text-[10px] font-mono font-bold ${
                            daysLeft <= 0
                              ? 'text-rose-400'
                              : daysLeft <= 60
                              ? 'text-orange-400'
                              : 'text-content-muted'
                          }`}
                        >
                          {daysLeft <= 0 ? 'EXPIRED' : `${daysLeft} days remaining`}
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                            batch.status === 'HEALTHY'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : batch.status === 'LOW_STOCK'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : batch.status === 'EXPIRING_SOON'
                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {batch.status === 'HEALTHY'
                            ? '🟢 Healthy Stock'
                            : batch.status === 'LOW_STOCK'
                            ? '⚠️ Low Stock'
                            : batch.status === 'EXPIRING_SOON'
                            ? '⏳ Expiring Soon'
                            : '🔴 Expired'}
                        </span>
                      </td>

                      <td className="p-4 text-right space-x-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setAdjustBatch(batch);
                            setAdjStockQty(batch.stock_qty);
                            setAdjReservedQty(batch.reserved_qty);
                            setAdjDamagedQty(batch.damaged_qty);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-bg-surface border border-bg-border hover:border-primary-500/40 text-primary-400 font-mono text-[11px] font-bold"
                          title="Adjust Stock Qty"
                        >
                          Adjust Qty
                        </button>
                        <button
                          onClick={() => openEditModal(batch)}
                          className="p-1.5 rounded-xl bg-bg-surface border border-bg-border hover:border-primary-500/40 text-content-primary transition-colors"
                          title="Edit Batch Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBatch(batch)}
                          className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:border-rose-500 text-rose-400 transition-colors"
                          title="Delete Batch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL 1: QUICK STOCK ADJUSTMENT ── */}
      {adjustBatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-card border border-bg-border rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-bg-border pb-3">
              <div>
                <h3 className="text-sm font-head font-bold text-content-primary">Quick Stock Adjustment</h3>
                <div className="text-[10px] font-mono text-content-muted">Batch #{adjustBatch.batch_number}</div>
              </div>
              <button
                onClick={() => setAdjustBatch(null)}
                className="text-content-muted hover:text-content-primary text-xs font-mono font-bold"
              >
                ✕ ESC
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                  Physical Stock Quantity *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={adjStockQty}
                  onChange={(e) => setAdjStockQty(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary font-bold font-mono focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                  Reserved Stock Qty (Pending Orders)
                </label>
                <input
                  type="number"
                  min={0}
                  value={adjReservedQty}
                  onChange={(e) => setAdjReservedQty(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary font-mono focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                  Damaged / Quarantined Qty
                </label>
                <input
                  type="number"
                  min={0}
                  value={adjDamagedQty}
                  onChange={(e) => setAdjDamagedQty(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary font-mono focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-2xl bg-bg-surface border border-bg-border text-xs font-mono flex items-center justify-between">
                <span className="text-content-muted">Calculated Net Available:</span>
                <span className="font-bold text-emerald-400">
                  {adjStockQty - adjReservedQty - adjDamagedQty} units
                </span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-bg-border">
                <button
                  type="button"
                  onClick={() => setAdjustBatch(null)}
                  className="px-4 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs font-semibold text-content-muted hover:text-content-primary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-glow"
                >
                  Update Quantities
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ADD / EDIT INVENTORY BATCH ── */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-card border border-bg-border rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-bg-border pb-3">
              <h2 className="text-lg font-head font-bold text-content-primary">
                {editingBatchId ? 'Edit Stock Batch Details' : 'Add New Inventory Batch'}
              </h2>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-content-muted hover:text-content-primary text-xs font-mono font-bold"
              >
                ✕ ESC
              </button>
            </div>

            <form onSubmit={handleSaveBatchForm} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                  Medicine Variant Name *
                </label>
                <input
                  type="text"
                  required
                  value={formVariantName}
                  onChange={(e) => setFormVariantName(e.target.value)}
                  placeholder="e.g. Napa Extend 665mg"
                  className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. NAPA-665-10"
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formBatchNumber}
                    onChange={(e) => setFormBatchNumber(e.target.value)}
                    placeholder="e.g. BATCH-SQ-2026-A"
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Pharma Manufacturer Brand
                  </label>
                  <input
                    type="text"
                    value={formBrandName}
                    onChange={(e) => setFormBrandName(e.target.value)}
                    placeholder="e.g. Square Pharmaceuticals"
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Pharmacy Vendor / Hub
                  </label>
                  <input
                    type="text"
                    value={formVendorName}
                    onChange={(e) => setFormVendorName(e.target.value)}
                    placeholder="e.g. Lazz Pharma"
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Physical Stock Qty
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formStockQty}
                    onChange={(e) => setFormStockQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Reorder Threshold
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formReorderLevel}
                    onChange={(e) => setFormReorderLevel(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Unit Cost (BDT ৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formUnitCost}
                    onChange={(e) => setFormUnitCost(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Manufacturing Date (MFG)
                  </label>
                  <input
                    type="date"
                    value={formMfgDate}
                    onChange={(e) => setFormMfgDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Expiry Date (EXP) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs text-content-primary focus:border-primary-500 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-bg-border">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-bg-surface border border-bg-border text-xs font-semibold text-content-muted hover:text-content-primary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-glow"
                >
                  Save Batch Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
