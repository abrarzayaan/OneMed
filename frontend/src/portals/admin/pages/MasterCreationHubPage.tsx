import React, { useState } from 'react';
import {
  PlusCircle,
  TagPlus,
  PackagePlus,
  FolderPlus,
  Building2,
  Boxes,
  ImagePlus,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CategoryManager } from '../components/creation/CategoryManager';
import { ProductManager } from '../components/creation/ProductManager';
import { VariantManager } from '../components/creation/VariantManager';
import { ImageManager } from '../components/creation/ImageManager';
import { BrandManager } from '../components/creation/BrandManager';
import { InventoryManager } from '../components/creation/InventoryManager';

export const MasterCreationHubPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    'brand' | 'category' | 'product' | 'variant' | 'inventory' | 'image'
  >('brand');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-purple-400">
            <PlusCircle className="w-4 h-4" />
            <span>ADMINISTRATIVE CREATION & CRUD HUB</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-head font-bold text-content-primary tracking-tight">
            Master CRUD & Catalog Administration
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary mt-1">
            Full API-connected CRUD management for Brands, Categories, Products, Variants, Inventory & Images with dynamic Meta JSON forms.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/catalog')}
          className="px-4 py-2.5 rounded-xl bg-bg-card hover:bg-bg-hover border border-bg-border text-content-primary text-xs font-bold flex items-center space-x-2 transition-colors self-start sm:self-auto shadow-sm"
        >
          <span>Catalog & Pricing Dashboard</span>
          <ArrowRight className="w-4 h-4 text-primary-400" />
        </button>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Brand */}
        <button
          onClick={() => setActiveTab('brand')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            activeTab === 'brand'
              ? 'bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-glow'
              : 'bg-bg-card border-bg-border text-content-muted hover:bg-bg-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <Building2 className="w-4 h-4 text-purple-400" />
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
              CRUD 1
            </span>
          </div>
          <div className="mt-2 font-head font-bold text-xs text-content-primary">Brands & Pharma</div>
          <div className="text-[10px] text-content-muted">Manufacturers</div>
        </button>

        {/* Category */}
        <button
          onClick={() => setActiveTab('category')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            activeTab === 'category'
              ? 'bg-primary-500/10 border-primary-500/50 text-primary-400 shadow-glow'
              : 'bg-bg-card border-bg-border text-content-muted hover:bg-bg-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <FolderPlus className="w-4 h-4 text-primary-400" />
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400">
              CRUD 2
            </span>
          </div>
          <div className="mt-2 font-head font-bold text-xs text-content-primary">Categories</div>
          <div className="text-[10px] text-content-muted">Hierarchies</div>
        </button>

        {/* Product */}
        <button
          onClick={() => setActiveTab('product')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            activeTab === 'product'
              ? 'bg-accent-500/10 border-accent-500/50 text-accent-400 shadow-glow'
              : 'bg-bg-card border-bg-border text-content-muted hover:bg-bg-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <PackagePlus className="w-4 h-4 text-accent-400" />
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-accent-500/20 text-accent-400">
              CRUD 3
            </span>
          </div>
          <div className="mt-2 font-head font-bold text-xs text-content-primary">Products</div>
          <div className="text-[10px] text-content-muted">Master Generic</div>
        </button>

        {/* Variant */}
        <button
          onClick={() => setActiveTab('variant')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            activeTab === 'variant'
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-glow'
              : 'bg-bg-card border-bg-border text-content-muted hover:bg-bg-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <TagPlus className="w-4 h-4 text-emerald-400" />
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
              CRUD 4
            </span>
          </div>
          <div className="mt-2 font-head font-bold text-xs text-content-primary">Variants</div>
          <div className="text-[10px] text-content-muted">Prices & Meta</div>
        </button>

        {/* Inventory */}
        <button
          onClick={() => setActiveTab('inventory')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            activeTab === 'inventory'
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-glow'
              : 'bg-bg-card border-bg-border text-content-muted hover:bg-bg-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <Boxes className="w-4 h-4 text-amber-400" />
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
              CRUD 5
            </span>
          </div>
          <div className="mt-2 font-head font-bold text-xs text-content-primary">Inventory</div>
          <div className="text-[10px] text-content-muted">Stock Control</div>
        </button>

        {/* Image */}
        <button
          onClick={() => setActiveTab('image')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            activeTab === 'image'
              ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-glow'
              : 'bg-bg-card border-bg-border text-content-muted hover:bg-bg-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <ImagePlus className="w-4 h-4 text-cyan-400" />
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
              CRUD 6
            </span>
          </div>
          <div className="mt-2 font-head font-bold text-xs text-content-primary">Product Images</div>
          <div className="text-[10px] text-content-muted">Photo Gallery</div>
        </button>
      </div>

      {/* ACTIVE TAB CONTENT */}
      {activeTab === 'brand' && <BrandManager />}
      {activeTab === 'category' && <CategoryManager />}
      {activeTab === 'product' && <ProductManager />}
      {activeTab === 'variant' && <VariantManager />}
      {activeTab === 'inventory' && <InventoryManager />}
      {activeTab === 'image' && <ImageManager />}
    </div>
  );
};
