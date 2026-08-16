import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Search,
  ChevronRight,
  Grid,
  Layers,
  Sparkles,
  ArrowRight,
  Pill,
  HeartPulse,
  Baby,
  Smile,
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { productsApi } from '@/api/products.api';
import type { Category, Subcategory } from '@/types/product.types';
import { useCategoryModalStore } from '@/store/categoryModal.store';

const defaultIcons = [HeartPulse, Sparkles, Baby, Smile, Pill, Stethoscope, ShieldCheck, Layers];

export default function CategoryModal() {
  const navigate = useNavigate();
  const { isOpen, closeModal } = useCategoryModalStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);

  // Fetch categories using React Query with caching
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await productsApi.getCategories();
      const raw = res.data;
      if (Array.isArray(raw)) return raw;
      return (raw as any).results || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  if (!isOpen) return null;

  // Filter only top-level categories (parent is null/undefined) for consumer portal navigation
  const topLevelCategories = (categories || []).filter((cat: Category) => !cat.parent);

  // Auto select first category if none selected
  const activeCatId = selectedCatId ?? (topLevelCategories.length > 0 ? topLevelCategories[0].id : null);

  // Filter categories based on search input
  const filteredCategories = topLevelCategories.filter((cat: Category) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const catMatches = cat.name.toLowerCase().includes(query);
    const subMatches = cat.children?.some((sub: Subcategory) => sub.name.toLowerCase().includes(query));
    return catMatches || subMatches;
  });

  const activeCategory = topLevelCategories.find((c: Category) => c.id === activeCatId) || filteredCategories[0] || topLevelCategories[0];

  const handleSelectCategory = (catId: number, subId?: number) => {
    closeModal();
    if (subId) {
      navigate(`/products?subcategory=${subId}`);
    } else {
      navigate(`/products?category=${catId}`);
    }
  };

  const handleViewAllProducts = () => {
    closeModal();
    navigate('/products');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative z-10 w-full max-w-4xl bg-bg-card border border-bg-border rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[88vh] max-h-[720px]"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-5 border-b border-bg-border bg-bg-surface/80 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-primary-600/20 border border-primary-500/30 text-primary-400 flex items-center justify-center shrink-0">
                <Grid className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-head font-extrabold text-base sm:text-lg text-content-primary leading-tight">
                  Categories & Subcategories
                </h2>
                <p className="text-[11px] text-content-muted hidden sm:block">
                  Select a category or subcategory to explore medicine products
                </p>
              </div>
            </div>

            {/* Search Input & Close Button */}
            <div className="flex items-center gap-2 flex-1 max-w-xs sm:max-w-sm justify-end">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-content-muted" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-full bg-bg-card border border-bg-border text-content-primary text-xs focus:outline-none focus:border-primary-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-full bg-bg-surface border border-bg-border text-content-secondary hover:text-content-primary hover:bg-bg-card transition-colors shrink-0"
                aria-label="Close categories modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* DUAL PANE BODY - Splitted 35% Left (Categories) and 65% Right (Subcategories) for BOTH Mobile & Desktop */}
          <div className="flex-1 overflow-hidden flex flex-row">
            {/* LEFT COLUMN: Main Categories List (35% width on Mobile, 30% on Desktop) */}
            <div className="w-[38%] sm:w-72 bg-bg-surface/50 border-r border-bg-border overflow-y-auto p-1.5 sm:p-3 space-y-1 custom-scrollbar shrink-0">
              <div className="px-2 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-content-muted flex items-center justify-between">
                <span>Categories</span>
                <span className="text-primary-400 font-mono text-[10px]">{filteredCategories.length}</span>
              </div>

              {isLoading ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-2xl bg-bg-card animate-pulse" />
                  ))}
                </div>
              ) : (
                filteredCategories.map((cat: Category, idx: number) => {
                  const IconComp = defaultIcons[idx % defaultIcons.length];
                  const isSelected = activeCategory?.id === cat.id;
                  const subCount = cat.children?.length || 0;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCatId(cat.id)}
                      className={`w-full flex items-center justify-between p-2 sm:p-2.5 rounded-2xl text-xs transition-all text-left group ${isSelected
                          ? 'bg-primary-600 text-white font-bold shadow-glow'
                          : 'text-content-secondary hover:bg-bg-card hover:text-content-primary'
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-white/20 text-white' : 'bg-primary-600/10 text-primary-400 group-hover:bg-primary-600/20'
                            }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate text-[11px] sm:text-xs font-semibold leading-tight">{cat.name}</span>
                      </div>

                      <div className="hidden sm:flex items-center gap-1 shrink-0">
                        {subCount > 0 && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[9px] ${isSelected ? 'bg-white/20 text-white' : 'bg-bg-card text-content-muted'
                              }`}
                          >
                            {subCount}
                          </span>
                        )}
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-white translate-x-0.5' : 'text-content-muted group-hover:text-content-primary'
                            }`}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* RIGHT COLUMN: Subcategories & Direct Product Link Panel (62% width on Mobile, 70% on Desktop) */}
            <div className="flex-1 p-3 sm:p-5 overflow-y-auto custom-scrollbar bg-bg-card space-y-5">
              {activeCategory ? (
                <div className="space-y-5">
                  {/* Category Header Card */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-primary-950/70 via-bg-surface to-bg-card border border-primary-800/40 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] sm:text-[10px] font-extrabold text-primary-400 uppercase tracking-wider">
                          Selected Category
                        </span>
                        <h3 className="font-head font-extrabold text-base sm:text-xl text-content-primary">
                          {activeCategory.name}
                        </h3>
                        <p className="text-[11px] text-content-muted mt-0.5 leading-snug">
                          {activeCategory.children?.length
                            ? `${activeCategory.children.length} subcategories available`
                            : 'Direct products catalog available'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectCategory(activeCategory.id)}
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs transition-all shadow-glow shrink-0"
                      >
                        <span>View All</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories Grid */}
                  {activeCategory.children && activeCategory.children.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-head font-bold text-xs text-content-muted uppercase tracking-wider">
                          Subcategories ({activeCategory.children.length})
                        </h4>
                        <span className="text-[10px] text-content-muted">Tap to view products</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {activeCategory.children.map((sub: Subcategory) => (
                          <div
                            key={sub.id}
                            onClick={() => handleSelectCategory(activeCategory.id, sub.id)}
                            className="cursor-pointer group p-3 rounded-2xl bg-bg-surface/70 border border-bg-border hover:border-primary-500/60 hover:bg-bg-surface transition-all flex items-center justify-between shadow-sm"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-primary-600/15 group-hover:bg-primary-600 group-hover:text-white text-primary-400 flex items-center justify-center shrink-0 transition-colors">
                                <Layers className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-head font-bold text-xs text-content-primary group-hover:text-primary-400 transition-colors truncate">
                                  {sub.name}
                                </h5>
                                <span className="text-[10px] text-content-muted flex items-center gap-0.5">
                                  Products <ChevronRight className="w-2.5 h-2.5" />
                                </span>
                              </div>
                            </div>

                            <ChevronRight className="w-4 h-4 text-content-muted group-hover:text-primary-400 group-hover:translate-x-1 transition-all shrink-0 ml-1" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-bg-surface/40 rounded-2xl border border-bg-border space-y-2 p-4">
                      <Pill className="w-7 h-7 text-primary-400 mx-auto" />
                      <p className="text-xs text-content-muted">
                        No direct subcategories listed. You can browse all items in this category directly.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSelectCategory(activeCategory.id)}
                        className="px-4 py-1.5 rounded-full bg-primary-600 text-white text-xs font-bold"
                      >
                        View Category Products
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-content-muted text-xs">
                  No categories found matching your search term.
                </div>
              )}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-2.5 px-4 sm:px-6 bg-bg-surface border-t border-bg-border flex items-center justify-between text-xs shrink-0">
            <span className="text-content-muted text-[10px] sm:text-[11px] truncate">
              Select category on left to view subcategories on right
            </span>
            <button
              type="button"
              onClick={handleViewAllProducts}
              className="font-bold text-primary-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
            >
              Shop All Products <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
