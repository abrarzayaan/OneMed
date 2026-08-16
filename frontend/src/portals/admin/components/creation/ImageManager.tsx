import React, { useState, useEffect } from 'react';
import {
  ImagePlus,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Loader2,
  Star,
  RefreshCw,
  AlertTriangle,
  UploadCloud,
  ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminCatalogApi, type ProductImageItem } from '../../api/adminCatalog.api';
import type { AdminVariantItem } from '../../types/admin.types';

export const ImageManager: React.FC = () => {
  const [images, setImages] = useState<ProductImageItem[]>([]);
  const [variants, setVariants] = useState<AdminVariantItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedVariantId, setSelectedVariantId] = useState<number | 'ALL'>('ALL');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form states
  const [targetVariantId, setTargetVariantId] = useState<number | ''>('');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPrimary, setIsPrimary] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [imgData, varData] = await Promise.all([
        adminCatalogApi.getImages(selectedVariantId === 'ALL' ? undefined : selectedVariantId),
        adminCatalogApi.getVariants(),
      ]);
      setImages(imgData);
      setVariants(varData);
      if (varData.length > 0 && !targetVariantId) setTargetVariantId(varData[0].id);
    } catch {
      toast.error('Failed to load images from API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [selectedVariantId]);

  const openUploadModal = () => {
    if (variants.length > 0) setTargetVariantId(variants[0].id);
    setImageUrlInput('');
    setSelectedFile(null);
    setIsPrimary(true);
    setIsModalOpen(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetVariantId) {
      toast.error('Select a Product Variant');
      return;
    }

    if (!selectedFile && !imageUrlInput.trim()) {
      toast.error('Please select an image file or enter an Image URL');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('variant', String(targetVariantId));
      formData.append('is_primary', String(isPrimary));

      if (selectedFile) {
        formData.append('image', selectedFile);
      } else {
        formData.append('image_url', imageUrlInput.trim());
      }

      await adminCatalogApi.uploadVariantImage(formData);
      toast.success('Image uploaded successfully to database!');
      setIsModalOpen(false);
      fetchInitialData();
    } catch {
      toast.error('Failed to upload image via API');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPrimary = async (img: ProductImageItem) => {
    try {
      await adminCatalogApi.updateImage(img.id, { is_primary: true });
      toast.success('Primary image updated!');
      fetchInitialData();
    } catch {
      toast.error('Failed to update primary image status');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminCatalogApi.deleteImage(id);
      toast.success('Image deleted successfully!');
      setDeleteConfirmId(null);
      fetchInitialData();
    } catch {
      toast.error('Failed to delete image');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-bg-card border border-bg-border shadow-card">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <ImagePlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-head font-bold text-xl text-content-primary">
              Product Image Gallery Control
            </h2>
            <p className="text-xs text-content-muted">
              Upload product photos, set primary thumbnails & manage image ordering
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchInitialData}
            className="p-2.5 rounded-xl bg-bg-surface hover:bg-bg-hover text-content-secondary border border-bg-border transition-colors"
            title="Refresh Images"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openUploadModal}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Image</span>
          </button>
        </div>
      </div>

      {/* Filter by Variant */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-content-muted">Filter by Variant:</span>
          <select
            value={selectedVariantId}
            onChange={(e) =>
              setSelectedVariantId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
            }
            className="px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Product Variants</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.product_name} ({v.variant_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Image Grid */}
      {isLoading ? (
        <div className="p-12 text-center space-y-3 bg-bg-card border border-bg-border rounded-3xl">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
          <p className="text-xs text-content-muted">Loading product images from API...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-bg-card border border-bg-border rounded-3xl shadow-card">
          <ImageIcon className="w-12 h-12 text-content-muted mx-auto opacity-40" />
          <p className="text-sm font-bold text-content-secondary">No Product Images Uploaded</p>
          <p className="text-xs text-content-muted">Click &quot;Upload New Image&quot; to add photos</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative rounded-2xl bg-bg-card border border-bg-border overflow-hidden shadow-card hover:border-cyan-500/50 transition-all flex flex-col justify-between"
            >
              {/* Image Preview */}
              <div className="relative aspect-square w-full bg-bg-surface overflow-hidden flex items-center justify-center p-2">
                {img.image_url ? (
                  <img
                    src={img.image_url}
                    alt={img.variant_name || 'Product Variant Image'}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <ImageIcon className="w-10 h-10 text-content-muted opacity-30" />
                )}

                {/* Primary Tag */}
                {img.is_primary && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-cyan-500 text-white font-mono text-[9px] font-bold shadow flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-white" /> Primary
                  </span>
                )}
              </div>

              {/* Info & Action Controls */}
              <div className="p-3 bg-bg-surface/80 border-t border-bg-border space-y-2">
                <div className="text-[11px] font-bold text-content-primary truncate">
                  {img.variant_name || `Variant #${img.variant}`}
                </div>

                <div className="flex items-center justify-between pt-1">
                  {!img.is_primary ? (
                    <button
                      onClick={() => handleSetPrimary(img)}
                      className="px-2 py-1 rounded bg-bg-card hover:bg-cyan-500/20 text-cyan-400 border border-bg-border text-[10px] font-mono font-bold transition-colors"
                    >
                      Set Primary
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono text-content-muted">Main View</span>
                  )}

                  <button
                    onClick={() => setDeleteConfirmId(img.id)}
                    className="p-1 rounded bg-bg-card hover:bg-rose-500/20 text-rose-400 border border-bg-border transition-colors"
                    title="Delete Image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPLOAD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-bg-card border border-bg-border rounded-3xl p-6 shadow-glow space-y-6">
            <div className="flex items-center justify-between border-b border-bg-border pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-head font-bold text-lg text-content-primary">Upload Product Image</h3>
                  <p className="text-xs text-content-muted">Attach photo to product variant</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
                  Select Product Variant *
                </label>
                <select
                  required
                  value={targetVariantId}
                  onChange={(e) => setTargetVariantId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-cyan-500"
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
                  Image File Upload
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs outline-none"
                />
              </div>

              <div className="text-center font-mono text-[11px] text-content-muted uppercase">OR</div>

              <div>
                <label className="block text-xs font-mono font-bold text-content-muted mb-1">
                  Image Direct URL
                </label>
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://i.ibb.co/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs outline-none focus:border-cyan-500"
                />
              </div>

              <label className="p-3 rounded-xl bg-bg-surface border border-bg-border flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500"
                />
                <span className="text-xs font-bold text-content-primary">Set as Primary Display Image</span>
              </label>

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
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Upload Image</span>
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
            <h3 className="font-head font-bold text-lg text-content-primary">Delete Image</h3>
            <p className="text-xs text-content-muted">
              Are you sure you want to delete image #{deleteConfirmId}?
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
                Delete Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
