import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  Search,
  RefreshCw,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Save,
  X,
  Package,
  Store,
  PlusCircle,
  Pill,
} from 'lucide-react';
import {
  vendorApi,
  type VendorInventoryItem,
  type VendorProfile,
  type ProductVariantOption,
} from '@/api/vendor.api';
import toast from 'react-hot-toast';

export const VendorInventoryPage: React.FC = () => {
  const [inventories, setInventories] = useState<VendorInventoryItem[]>([]);
  const [variants, setVariants] = useState<ProductVariantOption[]>([]);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Edit Existing Modal State
  const [editingItem, setEditingItem] = useState<VendorInventoryItem | null>(null);
  const [stockInput, setStockInput] = useState<number>(0);
  const [reorderInput, setReorderInput] = useState<number>(5);
  const [saving, setSaving] = useState(false);

  // Add New Stock Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [addStockQty, setAddStockQty] = useState<number>(100);
  const [addReorderLevel, setAddReorderLevel] = useState<number>(10);
  const [addingStock, setAddingStock] = useState(false);

  useEffect(() => {
    fetchInventoryAndProfile();
  }, []);

  const fetchInventoryAndProfile = async () => {
    try {
      setLoading(true);
      const [invData, profData, varData] = await Promise.all([
        vendorApi.getInventory(),
        vendorApi.getProfile(),
        vendorApi.getVariants(),
      ]);
      setInventories(invData);
      setProfile(profData);
      setVariants(varData);
      if (varData.length > 0) {
        setSelectedVariantId(varData[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch inventory & profile:', err);
      toast.error('Failed to load pharmacy stock inventory.');
    } finally {
      setLoading(false);
    }
  };

  const isProfileComplete = Boolean(
    profile && profile.name && profile.phone && profile.trade_license_no && profile.address
  );

  const handleOpenEditModal = (item: VendorInventoryItem) => {
    if (!isProfileComplete) {
      toast.error('Please complete your Store Profile (Trade License, Contact, Address) before updating stock!');
      return;
    }
    setEditingItem(item);
    setStockInput(item.stock_qty);
    setReorderInput(item.reorder_level);
  };

  const handleSaveStock = async () => {
    if (!editingItem) return;

    if (!isProfileComplete) {
      toast.error('Store Profile incomplete! Complete your profile in Store Settings first.');
      return;
    }

    try {
      setSaving(true);
      const updated = await vendorApi.updateStock(editingItem.id, {
        stock_qty: stockInput,
        reorder_level: reorderInput,
      });

      toast.success(updated.message || 'Stock level updated successfully!');

      setInventories((prev) =>
        prev.map((inv) => (inv.id === editingItem.id ? updated.inventory : inv))
      );
      setEditingItem(null);
    } catch (err: any) {
      console.error('Failed to update stock:', err);
      const errMsg = err.response?.data?.error || 'Failed to update stock quantity.';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNewStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId) {
      toast.error('Please select a product variant!');
      return;
    }

    if (!isProfileComplete) {
      toast.error('Store Profile incomplete! Complete your profile in Store Settings first.');
      return;
    }

    try {
      setAddingStock(true);
      const res = await vendorApi.addStock({
        variant_id: selectedVariantId,
        stock_qty: addStockQty,
        reorder_level: addReorderLevel,
      });

      toast.success(res.message || 'Product stock inventory updated!');
      setIsAddModalOpen(false);
      fetchInventoryAndProfile();
    } catch (err: any) {
      console.error('Failed to add product stock:', err);
      toast.error(err.response?.data?.error || 'Failed to add product stock inventory.');
    } finally {
      setAddingStock(false);
    }
  };

  const filteredInventories = inventories.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.product_name.toLowerCase().includes(term) ||
      item.variant_sku.toLowerCase().includes(term) ||
      item.variant_name.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'IN_STOCK' && item.status === 'IN_STOCK') ||
      (statusFilter === 'LOW_STOCK' && item.status === 'LOW_STOCK') ||
      (statusFilter === 'OUT_OF_STOCK' && item.status === 'OUT_OF_STOCK');

    return matchesSearch && matchesStatus;
  });

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
      case 'in_stock':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold uppercase flex items-center gap-1.5 w-fit">
            <CheckCircle2 size={13} />
            <span>IN STOCK</span>
          </span>
        );
      case 'LOW_STOCK':
      case 'low_stock':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold uppercase flex items-center gap-1.5 w-fit animate-pulse">
            <AlertTriangle size={13} />
            <span>LOW STOCK</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold uppercase flex items-center gap-1.5 w-fit">
            <XCircle size={13} />
            <span>OUT OF STOCK</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Boxes className="text-emerald-400 shrink-0" size={24} />
            <span>Pharmacy Stock & Inventory Control</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Logged-in Store:{' '}
            <strong className="text-emerald-400 font-semibold">{profile?.name || 'Your Store'}</strong>.
            Update live physical quantities for customer orders.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all"
          >
            <PlusCircle size={15} />
            <span>+ Add Stock</span>
          </button>

          <button
            onClick={fetchInventoryAndProfile}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#12141c] hover:bg-[#1a1d2b] text-gray-300 hover:text-white border border-[#1e2230] text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-400' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Profile Incomplete Lock Warning */}
      {!isProfileComplete && !loading && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-sm font-bold text-amber-300">Inventory Stock Updates Locked!</h4>
              <p className="text-xs text-amber-400/80 mt-0.5">
                You must complete your Store Profile (Trade License, Contact info, and Physical Address) before modifying stock.
              </p>
            </div>
          </div>
          <Link
            to="/vendor/profile"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold whitespace-nowrap shadow-md transition-all self-start sm:self-center"
          >
            Complete Store Profile Now →
          </Link>
        </div>
      )}

      {/* Inventory Table Container */}
      <div className="bg-[#12141c]/90 backdrop-blur-xl rounded-2xl border border-[#1e2230] p-4 sm:p-6 shadow-2xl space-y-5">
        {/* Filters & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1e2230]">
          <div className="flex flex-col xs:flex-row xs:items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status:</span>
            <div className="flex flex-wrap items-center gap-1 bg-[#171a26] p-1 rounded-xl border border-[#24283b]">
              {['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                    statusFilter === st
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-[#202538]'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search product name, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#171a26] border border-[#24283b] rounded-xl text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Stock Inventory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-[#1e2230] text-gray-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Medicine / Variant Info</th>
                <th className="py-3.5 px-4">SKU / Code</th>
                <th className="py-3.5 px-4 text-center">Physical Stock</th>
                <th className="py-3.5 px-4 text-center">Available Stock</th>
                <th className="py-3.5 px-4 text-center">Reorder Threshold</th>
                <th className="py-3.5 px-4">Stock Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2230]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <RefreshCw size={24} className="animate-spin text-emerald-400 mx-auto mb-2" />
                    <span>Loading pharmacy inventory records...</span>
                  </td>
                </tr>
              ) : filteredInventories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Package size={36} className="text-gray-600 mx-auto mb-2" />
                    <p className="font-semibold text-white">No Inventory Items Found</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Click <strong className="text-emerald-400">+ Add Product Stock</strong> above to assign stock to medicines.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInventories.map((item) => (
                  <tr key={item.id} className="hover:bg-[#171a26]/50 transition-colors">
                    {/* Medicine / Product Variant */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">
                          <Pill size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{item.product_name}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                            <span>{item.variant_name}</span>
                            <span>•</span>
                            <span className="font-mono text-emerald-400 font-semibold">
                              ৳{item.unit_price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-4 px-4 font-mono text-gray-300">{item.variant_sku}</td>

                    {/* Physical Stock */}
                    <td className="py-4 px-4 text-center font-bold text-white text-sm">
                      {item.stock_qty} pcs
                    </td>

                    {/* Available Stock */}
                    <td className="py-4 px-4 text-center">
                      <span className="font-extrabold text-emerald-400 text-sm">
                        {item.available_stock} pcs
                      </span>
                    </td>

                    {/* Reorder Level */}
                    <td className="py-4 px-4 text-center font-mono text-gray-400">
                      {item.reorder_level} pcs
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">{getStatusTag(item.status)}</td>

                    {/* Action */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171a26] hover:bg-emerald-600/20 border border-[#24283b] hover:border-emerald-500/40 text-gray-300 hover:text-emerald-400 text-xs font-semibold transition-all"
                        title="Update physical stock quantity"
                      >
                        <Edit2 size={13} />
                        <span>Update Stock</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Edit Existing Stock Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141c] border border-[#1e2230] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2230]">
              <div className="flex items-center gap-2">
                <Store size={18} className="text-emerald-400" />
                <h3 className="text-base font-bold text-white">Update Stock Level</h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#171a26]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#171a26] border border-[#24283b] space-y-1">
              <div className="text-xs text-gray-400">Target Medicine Variant:</div>
              <div className="text-sm font-bold text-emerald-400">{editingItem.product_name}</div>
              <div className="text-xs text-gray-300">
                {editingItem.variant_name} ({editingItem.variant_sku})
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Physical Stock Quantity (Pcs) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockInput}
                  onChange={(e) => setStockInput(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-[#171a26] border border-[#24283b] rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Low Stock Reorder Alert Threshold *
                </label>
                <input
                  type="number"
                  min="1"
                  value={reorderInput}
                  onChange={(e) => setReorderInput(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 bg-[#171a26] border border-[#24283b] rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl bg-[#171a26] hover:bg-[#1e2230] text-gray-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStock}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                <Save size={14} className={saving ? 'animate-spin' : ''} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add New Product Stock Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141c] border border-[#1e2230] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2230]">
              <div className="flex items-center gap-2">
                <PlusCircle size={18} className="text-emerald-400" />
                <h3 className="text-base font-bold text-white">Add Medicine Product Stock</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#171a26]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Auto Store Owner Indicator */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
              <Store size={16} />
              <span>
                Store Context: <strong>{profile?.name || 'Logged-in Vendor'}</strong> (Auto-selected from login)
              </span>
            </div>

            <form onSubmit={handleAddNewStockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Select Medicine / Product Variant *
                </label>
                <select
                  value={selectedVariantId || ''}
                  onChange={(e) => setSelectedVariantId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#171a26] border border-[#24283b] rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.product_name} - {v.variant_name} (SKU: {v.sku}) - ৳{v.price}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Initial Physical Stock Quantity (Pcs) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={addStockQty}
                  onChange={(e) => setAddStockQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 bg-[#171a26] border border-[#24283b] rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Reorder Alert Threshold *
                </label>
                <input
                  type="number"
                  min="1"
                  value={addReorderLevel}
                  onChange={(e) => setAddReorderLevel(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 bg-[#171a26] border border-[#24283b] rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#171a26] hover:bg-[#1e2230] text-gray-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingStock}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  <Save size={14} className={addingStock ? 'animate-spin' : ''} />
                  <span>{addingStock ? 'Saving...' : 'Assign Product Stock'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
