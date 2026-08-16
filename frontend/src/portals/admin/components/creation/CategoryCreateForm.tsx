import React, { useState, useEffect } from 'react';
import { FolderPlus, CheckCircle2, Loader2, Layers, Search, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminCatalogApi } from '../../api/adminCatalog.api';

interface CategoryCreateFormProps {
  onSuccess?: () => void;
}

export const CategoryCreateForm: React.FC<CategoryCreateFormProps> = ({ onSuccess }) => {
  const [name, setName] = useState<string>('');
  const [parent, setParent] = useState<number | ''>('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [status, setStatus] = useState<'active' | 'hidden'>('active');
  const [seoTitle, setSeoTitle] = useState<string>('');
  const [seoDescription, setSeoDescription] = useState<string>('');

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    adminCatalogApi.getCategories().then(setCategories);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminCatalogApi.createCategory({
        name,
        parent: parent === '' ? null : Number(parent),
        sort_order: sortOrder,
        status,
        metadata: {
          show_on_homepage: true,
          seo_title: seoTitle || name,
          seo_description: seoDescription,
        },
      });

      toast.success(`Category "${name}" created successfully! Saved to Database.`);
      setName('');
      setSeoTitle('');
      setSeoDescription('');
      adminCatalogApi.getCategories().then(setCategories);
      if (onSuccess) onSuccess();
    } catch {
      toast.error('Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-bg-card border border-bg-border shadow-card space-y-6">
      <div className="flex items-center space-x-3 border-b border-bg-border pb-4">
        <div className="p-2.5 rounded-xl bg-primary-500/15 text-primary-400 border border-primary-500/30">
          <FolderPlus className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-head font-bold text-lg text-content-primary">Create New Category</h2>
          <p className="text-xs text-content-muted">Add a main or sub-category to organize medicine catalog</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Name */}
        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
            Category Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Antibiotics & Anti-infectives"
            className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-primary-500"
          />
        </div>

        {/* Parent Category */}
        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
            Parent Category (Optional for Sub-category)
          </label>
          <select
            value={parent}
            onChange={(e) => setParent(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-primary-500"
          >
            <option value="">None (Top-Level Category)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
            Sort Order Priority
          </label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-mono font-bold outline-none focus:border-primary-500"
          />
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
            <option value="active">Active (Visible on Portal)</option>
            <option value="hidden">Hidden (Draft)</option>
          </select>
        </div>
      </div>

      {/* SEO Metadata Box */}
      <div className="p-4 rounded-2xl bg-bg-surface border border-bg-border space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-content-muted uppercase">
          <Sparkles className="w-4 h-4 text-accent-400" />
          <span>SEO Metadata (Saved in `metadata` JSON)</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono text-content-muted mb-1">SEO Title</label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="e.g. Buy Prescription Antibiotics Online in Bangladesh"
              className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-content-muted mb-1">SEO Description</label>
            <textarea
              rows={2}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Meta description for search engines..."
              className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>Save Category to Database</span>
        </button>
      </div>
    </form>
  );
};
