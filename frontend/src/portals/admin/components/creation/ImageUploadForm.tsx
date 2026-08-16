import React, { useState, useEffect } from 'react';
import { ImagePlus, CheckCircle2, Loader2, Upload, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminCatalogApi } from '../../api/adminCatalog.api';
import type { AdminVariantItem } from '../../types/admin.types';

export const ImageUploadForm: React.FC = () => {
  const [variants, setVariants] = useState<AdminVariantItem[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<number | ''>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPrimary, setIsPrimary] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    adminCatalogApi.getVariants().then((vars) => {
      setVariants(vars);
      if (vars.length > 0) setSelectedVariantId(vars[0].id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId) {
      toast.error('Please select a Variant');
      return;
    }
    if (!selectedFile) {
      toast.error('Please select an Image file to upload');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('variant', String(selectedVariantId));
      formData.append('image_url', selectedFile);
      formData.append('is_primary', String(isPrimary));
      formData.append('status', 'active');

      await adminCatalogApi.uploadVariantImage(formData);
      toast.success('Product Variant Image uploaded successfully to Database!');
      setSelectedFile(null);
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-bg-card border border-bg-border shadow-card space-y-6">
      <div className="flex items-center space-x-3 border-b border-bg-border pb-4">
        <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
          <ImagePlus className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-head font-bold text-lg text-content-primary">Upload Variant Image Gallery</h2>
          <p className="text-xs text-content-muted">Attach high-resolution product photos directly to variants</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
            Select Product Variant *
          </label>
          <select
            required
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-primary-500"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.product_name} — {v.variant_name} ({v.sku})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
            Image File *
          </label>
          <input
            type="file"
            accept="image/*"
            required
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-1.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-500 file:text-white hover:file:bg-primary-600"
          />
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-bg-surface border border-bg-border flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-content-primary">
          <Star className="w-4 h-4 text-amber-400" />
          <span>Mark as Main/Primary Thumbnail Image</span>
        </div>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-500"
          />
          <span className="text-xs font-mono text-indigo-400 font-bold">
            {isPrimary ? 'PRIMARY IMAGE' : 'GALLERY IMAGE'}
          </span>
        </label>
      </div>

      <div className="flex items-center justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting || !selectedFile}
          className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          <span>Upload Image to Database</span>
        </button>
      </div>
    </form>
  );
};
