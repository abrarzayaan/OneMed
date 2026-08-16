import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Loader2,
  Award,
  Globe,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminCatalogApi, type BrandItem } from '../../api/adminCatalog.api';
import { DynamicMetaKeyValueBuilder, type KeyValuePair } from './DynamicMetaKeyValueBuilder';
import { AdminPagination } from '../AdminPagination';

export const BrandManager: React.FC = () => {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState<string>('');
  const [status, setStatus] = useState<'active' | 'hidden'>('active');
  const [country, setCountry] = useState<string>('Bangladesh');
  const [licenseNo, setLicenseNo] = useState<string>('');
  const [metaPairs, setMetaPairs] = useState<KeyValuePair[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchBrands = async () => {
    setIsLoading(true);
    try {
      const data = await adminCatalogApi.getBrandsDetailed();
      setBrands(data);
    } catch {
      toast.error('Failed to load brands from API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const openCreateModal = () => {
    setEditingBrand(null);
    setName('');
    setStatus('active');
    setCountry('Bangladesh');
    setLicenseNo('');
    setMetaPairs([
      { id: '1', key: 'website', value: 'https://' },
      { id: '2', key: 'headquarters', value: 'Dhaka, Bangladesh' },
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (brand: BrandItem) => {
    setEditingBrand(brand);
    setName(brand.name);
    setStatus(brand.status as 'active' | 'hidden');
    const meta = brand.metadata || {};
    setCountry(meta.country || meta.country_origin || 'Bangladesh');
    setLicenseNo(meta.license_no || '');

    // Convert extra metadata to key-value pairs
    const pairs: KeyValuePair[] = [];
    Object.entries(meta).forEach(([k, v]) => {
      if (k !== 'country' && k !== 'country_origin' && k !== 'license_no') {
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
    if (!name.trim()) {
      toast.error('Brand name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const metadata: Record<string, any> = {
        country,
        license_no: licenseNo,
      };

      metaPairs.forEach((p) => {
        if (p.key.trim()) {
          metadata[p.key.trim()] = p.value.trim();
        }
      });

      if (editingBrand) {
        await adminCatalogApi.updateBrand(editingBrand.id, {
          name,
          status,
          metadata,
        });
        toast.success(`Brand "${name}" updated successfully!`);
      } else {
        await adminCatalogApi.createBrand({
          name,
          status,
          metadata,
        });
        toast.success(`Brand "${name}" created successfully!`);
      }

      setIsModalOpen(false);
      fetchBrands();
    } catch {
      toast.error('Failed to save brand via API');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminCatalogApi.deleteBrand(id);
      toast.success('Brand deleted successfully!');
      setDeleteConfirmId(null);
      fetchBrands();
    } catch {
      toast.error('Failed to delete brand');
    }
  };

  const filteredBrands = brands.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);
  const paginatedBrands = filteredBrands.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-bg-card border border-bg-border shadow-card">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-head font-bold text-xl text-content-primary">
              Brand & Manufacturer Management
            </h2>
            <p className="text-xs text-content-muted">
              Create, update, and manage pharmaceutical companies & DGDA credentials
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchBrands}
            className="p-2.5 rounded-xl bg-bg-surface hover:bg-bg-hover text-content-secondary border border-bg-border transition-colors"
            title="Refresh Brands List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Brand</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-content-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brands by name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-purple-500"
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

      {/* Brands Table */}
      <div className="rounded-3xl bg-bg-card border border-bg-border overflow-hidden shadow-card">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
            <p className="text-xs text-content-muted">Loading pharmaceutical brands from API...</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Building2 className="w-10 h-10 text-content-muted mx-auto opacity-40" />
            <p className="text-sm font-bold text-content-secondary">No Brands Found</p>
            <p className="text-xs text-content-muted">Try adjusting search or click &quot;Create New Brand&quot;</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-content-secondary">
                <thead className="bg-bg-surface text-content-muted font-mono uppercase text-[10px] border-b border-bg-border">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">ID</th>
                    <th className="py-3.5 px-4 font-bold">Brand / Company Name</th>
                    <th className="py-3.5 px-4 font-bold">Origin & License</th>
                    <th className="py-3.5 px-4 font-bold">Metadata Specs</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bg-border">
                  {paginatedBrands.map((brand) => {
                    const meta = brand.metadata || {};
                    return (
                      <tr key={brand.id} className="hover:bg-bg-hover/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-content-muted">
                          #{brand.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-head font-bold text-content-primary text-sm">
                            {brand.name}
                          </div>
                          {brand.slug && (
                            <div className="text-[10px] font-mono text-content-muted">{brand.slug}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 space-y-0.5">
                          <div className="flex items-center space-x-1.5 text-content-primary font-medium">
                            <Globe className="w-3.5 h-3.5 text-purple-400" />
                            <span>{meta.country || meta.country_origin || 'Bangladesh'}</span>
                          </div>
                          {meta.license_no && (
                            <div className="flex items-center space-x-1 text-[10px] font-mono text-content-muted">
                              <Award className="w-3 h-3 text-amber-400" />
                              <span>Lic: {meta.license_no}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {Object.entries(meta)
                              .filter(([k]) => k !== 'country' && k !== 'country_origin' && k !== 'license_no')
                              .slice(0, 3)
                              .map(([k, v]) => (
                                <span
                                  key={k}
                                  className="px-2 py-0.5 rounded bg-bg-surface border border-bg-border text-[10px] font-mono text-content-muted"
                                >
                                  {k}: {String(v)}
                                </span>
                              ))}
                            {Object.keys(meta).length === 0 && (
                              <span className="text-content-muted italic text-[11px]">No extra meta</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold inline-flex items-center space-x-1 ${
                              brand.status === 'active'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-bg-surface text-content-muted border border-bg-border'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                brand.status === 'active' ? 'bg-emerald-400' : 'bg-content-muted'
                              }`}
                            />
                            <span className="capitalize">{brand.status}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openEditModal(brand)}
                              className="p-1.5 rounded-lg bg-bg-surface hover:bg-purple-500/20 text-purple-400 border border-bg-border transition-colors"
                              title="Edit Brand"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(brand.id)}
                              className="p-1.5 rounded-lg bg-bg-surface hover:bg-rose-500/20 text-rose-400 border border-bg-border transition-colors"
                              title="Delete Brand"
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
              totalItems={filteredBrands.length}
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
                <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-head font-bold text-lg text-content-primary">
                    {editingBrand ? `Edit Brand: ${editingBrand.name}` : 'Create Brand / Manufacturer'}
                  </h3>
                  <p className="text-xs text-content-muted">
                    {editingBrand ? 'Update brand details & metadata JSON' : 'Add pharmaceutical brand with form & dynamic meta fields'}
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
                    Brand / Manufacturer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Beximco Pharmaceuticals Ltd."
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'hidden')}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-purple-500"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="hidden">Hidden (Draft)</option>
                  </select>
                </div>
              </div>

              {/* Standard Metadata Fields */}
              <div className="p-4 rounded-2xl bg-bg-surface border border-bg-border space-y-3">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-content-muted uppercase">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span>Standard Brand Specs (`metadata`)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-content-muted mb-1">
                      Country of Origin
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-content-muted mb-1">
                      DGDA Manufacturing License No
                    </label>
                    <input
                      type="text"
                      value={licenseNo}
                      onChange={(e) => setLicenseNo(e.target.value)}
                      placeholder="e.g. DGDA-LIC-9842"
                      className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* DYNAMIC META FORM BUILDER (AS REQUESTED) */}
              <DynamicMetaKeyValueBuilder
                title="Dynamic Meta Fields Form (`metadata` JSON)"
                description="Fill up meta fields like a form (key-value pairs stored in JSON)"
                pairs={metaPairs}
                onChange={setMetaPairs}
                presetSuggestions={[
                  'website',
                  'headquarters',
                  'founded_year',
                  'support_email',
                  'compliance_status',
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
                  className="px-6 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{editingBrand ? 'Save Changes' : 'Create Brand'}</span>
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
            <h3 className="font-head font-bold text-lg text-content-primary">Delete Brand</h3>
            <p className="text-xs text-content-muted">
              Are you sure you want to delete brand #{deleteConfirmId}? This action communicates directly with DRF API.
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
                Delete Brand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
