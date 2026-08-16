import React, { useState, useEffect } from 'react';
import { PackagePlus, CheckCircle2, Loader2, FileCheck2, Tag, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminCatalogApi } from '../../api/adminCatalog.api';

interface ProductCreateFormProps {
  onSuccess?: () => void;
}

export const ProductCreateForm: React.FC<ProductCreateFormProps> = ({ onSuccess }) => {
  const [name, setName] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [brandId, setBrandId] = useState<number | ''>('');
  const [isPrescriptionRequired, setIsPrescriptionRequired] = useState<boolean>(false);
  const [status, setStatus] = useState<'active' | 'hidden'>('active');
  const [tags, setTags] = useState<string>('painkiller, fever, paracetamol');
  const [seoTitle, setSeoTitle] = useState<string>('');

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    adminCatalogApi.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setCategoryId(cats[0].id);
    });
    adminCatalogApi.getBrands().then(setBrands);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Product Name is required');
      return;
    }
    if (!categoryId) {
      toast.error('Please select a Category');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await adminCatalogApi.createProduct({
        name,
        category: Number(categoryId),
        brand: brandId === '' ? null : Number(brandId),
        is_prescription_required: isPrescriptionRequired,
        status,
        meta: {
          tags: parsedTags,
          seo_title: seoTitle || name,
          returnable: true,
          warranty_days: 0,
        },
      });

      toast.success(`Product Master "${name}" created successfully in Database!`);
      setName('');
      setSeoTitle('');
      if (onSuccess) onSuccess();
    } catch {
      toast.error('Failed to create product master');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-bg-card border border-bg-border shadow-card space-y-6">
      <div className="flex items-center space-x-3 border-b border-bg-border pb-4">
        <div className="p-2.5 rounded-xl bg-accent-500/15 text-accent-400 border border-accent-500/30">
          <PackagePlus className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-head font-bold text-lg text-content-primary">Create Product Master</h2>
          <p className="text-xs text-content-muted">Establish top-level product entity before adding specific pack variants</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Name */}
        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
            Product Master Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Napa Extra 500mg Paracetamol"
            className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-primary-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
            Category *
          </label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-primary-500"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Brand */}
        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
            Pharmaceutical Manufacturer / Brand
          </label>
          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-primary-500"
          >
            <option value="">None (Generic)</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'hidden')}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-primary-500"
          >
            <option value="active">Active (Visible)</option>
            <option value="hidden">Hidden (Draft)</option>
          </select>
        </div>
      </div>

      {/* Prescription Requirement Toggle */}
      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileCheck2 className="w-5 h-5 text-rose-400" />
          <div>
            <div className="text-xs font-bold text-content-primary">Prescription Requirement Flag</div>
            <div className="text-[11px] text-content-muted">Require customer to upload doctor prescription during checkout</div>
          </div>
        </div>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPrescriptionRequired}
            onChange={(e) => setIsPrescriptionRequired(e.target.checked)}
            className="w-5 h-5 rounded border-bg-border text-rose-500 focus:ring-rose-500"
          />
          <span className="text-xs font-mono font-bold text-rose-400">
            {isPrescriptionRequired ? 'Rx REQUIRED' : 'NO Rx NEEDED'}
          </span>
        </label>
      </div>

      {/* Meta Box */}
      <div className="p-4 rounded-2xl bg-bg-surface border border-bg-border space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-content-muted uppercase">
          <Sparkles className="w-4 h-4 text-accent-400" />
          <span>Tags & Search Meta (`meta` JSON)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono text-content-muted mb-1">Search Keywords / Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. fever, headache, bicksmco"
              className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-content-muted mb-1">SEO Title</label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Product Page Title..."
              className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>Create Product Master</span>
        </button>
      </div>
    </form>
  );
};
