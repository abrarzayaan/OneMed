import React, { useState, useEffect } from 'react';
import {
  PackagePlus,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Loader2,
  FileText,
  Sparkles,
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminCatalogApi, type ProductItem } from '../../api/adminCatalog.api';
import { DynamicMetaKeyValueBuilder, type KeyValuePair } from './DynamicMetaKeyValueBuilder';
import { AdminPagination } from '../AdminPagination';

export const ProductManager: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<number | ''>('');
  const [brand, setBrand] = useState<number | ''>('');
  const [isPrescription, setIsPrescription] = useState<boolean>(false);
  const [status, setStatus] = useState<'active' | 'hidden'>('active');
  const [shortDesc, setShortDesc] = useState<string>('');
  const [longDesc, setLongDesc] = useState<string>('');
  const [metaPairs, setMetaPairs] = useState<KeyValuePair[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [prodsData, catsData, brandsData] = await Promise.all([
        adminCatalogApi.getProductsDetailed(),
        adminCatalogApi.getCategories(),
        adminCatalogApi.getBrands(),
      ]);
      setProducts(prodsData);
      setCategories(catsData);
      setBrands(brandsData);
      if (catsData.length > 0) setCategory(catsData[0].id);
      if (brandsData.length > 0) setBrand(brandsData[0].id);
    } catch {
      toast.error('Failed to load products from API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    if (categories.length > 0) setCategory(categories[0].id);
    if (brands.length > 0) setBrand(brands[0].id);
    setIsPrescription(false);
    setStatus('active');
    setShortDesc('');
    setLongDesc('');
    setMetaPairs([
      { id: '1', key: 'returnable', value: 'true' },
      { id: '2', key: 'warranty_days', value: '0' },
      { id: '3', key: 'storage_temp', value: 'Below 30°C' },
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: ProductItem) => {
    setEditingProduct(prod);
    setName(prod.name);
    setCategory(prod.category || (categories.length > 0 ? categories[0].id : ''));
    setBrand(prod.brand || (brands.length > 0 ? brands[0].id : ''));
    setIsPrescription(!!prod.is_prescription_required);
    setStatus((prod.status as 'active' | 'hidden') || 'active');
    setShortDesc(typeof prod.short_description === 'string' ? prod.short_description : JSON.stringify(prod.short_description || ''));
    setLongDesc(typeof prod.long_description === 'string' ? prod.long_description : JSON.stringify(prod.long_description || ''));

    const meta = prod.meta || {};
    const pairs: KeyValuePair[] = [];
    Object.entries(meta).forEach(([k, v]) => {
      pairs.push({
        id: Math.random().toString(36).substr(2, 9),
        key: k,
        value: typeof v === 'object' ? JSON.stringify(v) : String(v),
      });
    });
    setMetaPairs(pairs);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!category) {
      toast.error('Please select a Category');
      return;
    }

    setIsSubmitting(true);
    try {
      const metaObj: Record<string, any> = {
        returnable: true,
        warranty_days: 0,
      };

      metaPairs.forEach((p) => {
        if (p.key.trim()) {
          metaObj[p.key.trim()] = p.value.trim();
        }
      });

      const payload = {
        name,
        category: Number(category),
        brand: brand ? Number(brand) : null,
        is_prescription_required: isPrescription,
        status,
        short_description: shortDesc,
        long_description: longDesc,
        meta: metaObj,
      };

      if (editingProduct) {
        await adminCatalogApi.updateProduct(editingProduct.id, payload);
        toast.success(`Product "${name}" updated successfully!`);
      } else {
        await adminCatalogApi.createProduct(payload);
        toast.success(`Product "${name}" created successfully!`);
      }

      setIsModalOpen(false);
      fetchInitialData();
    } catch {
      toast.error('Failed to save product via API');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminCatalogApi.deleteProduct(id);
      toast.success('Product deleted successfully!');
      setDeleteConfirmId(null);
      fetchInitialData();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-bg-card border border-bg-border shadow-card">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-accent-500/15 text-accent-400 border border-accent-500/30">
            <PackagePlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-head font-bold text-xl text-content-primary">
              Product Master Catalog
            </h2>
            <p className="text-xs text-content-muted">
              Manage parent pharmaceutical products, brand associations & prescription rules
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchInitialData}
            className="p-2.5 rounded-xl bg-bg-surface hover:bg-bg-hover text-content-secondary border border-bg-border transition-colors"
            title="Refresh Products"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Product</span>
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
            placeholder="Search products by name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-accent-500"
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

      {/* Product Table */}
      <div className="rounded-3xl bg-bg-card border border-bg-border overflow-hidden shadow-card">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent-400 mx-auto" />
            <p className="text-xs text-content-muted">Loading products from API...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <PackagePlus className="w-10 h-10 text-content-muted mx-auto opacity-40" />
            <p className="text-sm font-bold text-content-secondary">No Products Found</p>
            <p className="text-xs text-content-muted">Click &quot;Create New Product&quot; to add one</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-content-secondary">
                <thead className="bg-bg-surface text-content-muted font-mono uppercase text-[10px] border-b border-bg-border">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">ID</th>
                    <th className="py-3.5 px-4 font-bold">Product Master Name</th>
                    <th className="py-3.5 px-4 font-bold">Category & Brand</th>
                    <th className="py-3.5 px-4 font-bold">Rx Policy</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bg-border">
                  {paginatedProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-bg-hover/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-content-muted">
                        #{prod.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-head font-bold text-content-primary text-sm">
                          {prod.name}
                        </div>
                        {prod.slug && (
                          <div className="text-[10px] font-mono text-content-muted">{prod.slug}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="text-content-primary font-bold">
                          {prod.category_name || `Category #${prod.category}`}
                        </div>
                        {prod.brand_name && (
                          <div className="text-[10px] font-mono text-purple-400">
                            {prod.brand_name}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {prod.is_prescription_required ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center space-x-1 w-max">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Rx Required</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 w-max inline-block">
                            OTC Medicine
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold inline-flex items-center space-x-1 ${
                            prod.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-bg-surface text-content-muted border border-bg-border'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              prod.status === 'active' ? 'bg-emerald-400' : 'bg-content-muted'
                            }`}
                          />
                          <span className="capitalize">{prod.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 rounded-lg bg-bg-surface hover:bg-accent-500/20 text-accent-400 border border-bg-border transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(prod.id)}
                            className="p-1.5 rounded-lg bg-bg-surface hover:bg-rose-500/20 text-rose-400 border border-bg-border transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredProducts.length}
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
          <div className="relative w-full max-w-2xl bg-bg-card border border-bg-border rounded-3xl p-6 shadow-glow space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-bg-border pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-accent-500/15 text-accent-400 border border-accent-500/30">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-head font-bold text-lg text-content-primary">
                    {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create Product Master'}
                  </h3>
                  <p className="text-xs text-content-muted">
                    Set up medicine master profile, brand link, and dynamic meta inputs
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
                    Product Generic / Master Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Napa Extra 500mg"
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-accent-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
                    Category *
                  </label>
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-accent-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
                    Brand / Manufacturer (Optional)
                  </label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-accent-500"
                  >
                    <option value="">None (Generic)</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'hidden')}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-accent-500"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="hidden">Hidden (Draft)</option>
                  </select>
                </div>
              </div>

              {/* Prescription Toggle */}
              <label className="p-3.5 rounded-2xl bg-bg-surface border border-bg-border flex items-center space-x-3 cursor-pointer hover:border-rose-500/40 transition-all">
                <input
                  type="checkbox"
                  checked={isPrescription}
                  onChange={(e) => setIsPrescription(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-500"
                />
                <div>
                  <div className="text-xs font-bold text-content-primary flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Prescription Required (Rx Medicine)</span>
                  </div>
                  <div className="text-[10px] text-content-muted">
                    If checked, customers must upload valid prescription to purchase this product.
                  </div>
                </div>
              </label>

              {/* Descriptions */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Short Description / Highlights
                  </label>
                  <textarea
                    rows={2}
                    value={shortDesc}
                    onChange={(e) => setShortDesc(e.target.value)}
                    placeholder="Brief highlights of this medicine..."
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs outline-none focus:border-accent-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                    Detailed Medical Description
                  </label>
                  <textarea
                    rows={3}
                    value={longDesc}
                    onChange={(e) => setLongDesc(e.target.value)}
                    placeholder="Comprehensive medical usage, dosage, and warning details..."
                    className="w-full px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs outline-none focus:border-accent-500"
                  />
                </div>
              </div>

              {/* DYNAMIC META KEY VALUE FORM BUILDER */}
              <DynamicMetaKeyValueBuilder
                title="Dynamic Meta Form Builder (`meta` JSON)"
                description="Fill up meta fields like a form for return policies, tags, and warranty"
                pairs={metaPairs}
                onChange={setMetaPairs}
                presetSuggestions={[
                  'returnable',
                  'warranty_days',
                  'storage_temp',
                  'max_dose_per_day',
                  'seo_title',
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
                  className="px-6 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
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
            <h3 className="font-head font-bold text-lg text-content-primary">Delete Product Master</h3>
            <p className="text-xs text-content-muted">
              Are you sure you want to delete product #{deleteConfirmId}? This communicates directly with DRF API.
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
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
