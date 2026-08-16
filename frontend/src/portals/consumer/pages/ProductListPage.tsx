import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  X,
  ChevronRight,
  SlidersHorizontal,
  Pill,
  Check,
  Grid,
  Layers,
} from 'lucide-react';
import { productsApi } from '@/api/products.api';
import type { Category, Brand, ProductVariantItem } from '@/types/product.types';
import VariantCard from '@/portals/consumer/components/product/VariantCard';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import { useCategoryModalStore } from '@/store/categoryModal.store';

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentSearch = searchParams.get('search') || '';
  const currentSubcategory = searchParams.get('subcategory') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentFilter = searchParams.get('filter') || '';

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(
    currentSubcategory ? parseInt(currentSubcategory) : null
  );
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(
    currentBrand ? parseInt(currentBrand) : null
  );
  const [rxOnlyFilter, setRxOnlyFilter] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'name'>('price_asc');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const openCategoryModal = useCategoryModalStore((s) => s.openModal);
  const [expandedCatId, setExpandedCatId] = useState<number | null>(
    currentCategory ? parseInt(currentCategory) : null
  );

  // Sync state with URL search params
  useEffect(() => {
    setSearchInput(searchParams.get('search') || '');
    if (searchParams.get('subcategory')) {
      setSelectedSubcategoryId(parseInt(searchParams.get('subcategory')!));
    } else {
      setSelectedSubcategoryId(null);
    }

    if (searchParams.get('category')) {
      setExpandedCatId(parseInt(searchParams.get('category')!));
    } else {
      setExpandedCatId(null);
    }

    if (searchParams.get('brand')) {
      setSelectedBrandId(parseInt(searchParams.get('brand')!));
    } else {
      setSelectedBrandId(null);
    }
  }, [searchParams]);

  // Cached Fetch Categories
  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await productsApi.getCategories();
      const raw = res.data;
      if (Array.isArray(raw)) return raw;
      return (raw as any).results || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const topLevelCategories = useMemo(() => {
    return (categories || []).filter((c: any) => !c.parent);
  }, [categories]);

  // Cached Fetch Brands
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await productsApi.getBrands();
      const raw = res.data;
      if (Array.isArray(raw)) return raw;
      return (raw as any).results || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Cached Fetch Product Variants
  const { data: rawVariants = [], isLoading: variantsLoading } = useQuery({
    queryKey: ['variants-list', selectedSubcategoryId],
    queryFn: async () => {
      if (selectedSubcategoryId) {
        const res = await productsApi.getVariantsBySubcategory(selectedSubcategoryId);
        const raw = res.data;
        if (Array.isArray(raw)) return raw;
        return (raw as any).results || [];
      } else {
        const res = await productsApi.getVariants({ page_size: 100 });
        const raw = res.data;
        if (Array.isArray(raw)) return raw;
        return (raw as any).results || [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // Filter & Sort logic
  const filteredVariants = useMemo(() => {
    let result = [...rawVariants];

    // Meta filter (best_selling, hot_deals, flash_sale, quick_access)
    if (currentFilter === 'best_selling') {
      result = result.filter((item) => (item as any).meta?.is_best_selling === true);
    } else if (currentFilter === 'hot_deals') {
      result = result.filter((item) => (item as any).meta?.is_hot_deal === true);
    } else if (currentFilter === 'flash_sale' || currentFilter === 'top_rated') {
      result = result.filter(
        (item) => (item as any).meta?.is_flash_sale === true || (item as any).meta?.is_top_rated === true
      );
    } else if (currentFilter === 'quick_access' || currentFilter === 'featured') {
      result = result.filter(
        (item) => (item as any).meta?.is_quick_access === true || (item as any).meta?.is_featured === true
      );
    }

    // Category Filter (if parent category set and no specific subcategory selected)
    if (expandedCatId && !selectedSubcategoryId) {
      const allowedCategoryIds = new Set<number>();
      allowedCategoryIds.add(expandedCatId);
      (categories || [])
        .filter((c: any) => c.id === expandedCatId || c.parent === expandedCatId)
        .forEach((c: any) => {
          allowedCategoryIds.add(c.id);
          if (Array.isArray(c.children)) {
            c.children.forEach((sub: any) => allowedCategoryIds.add(sub.id));
          }
        });

      result = result.filter(
        (item) => allowedCategoryIds.has(item.category_id) || allowedCategoryIds.has((item as any).category)
      );
    }

    // Search query filter
    if (searchInput.trim()) {
      const query = searchInput.toLowerCase();
      result = result.filter(
        (item) =>
          item.product_name.toLowerCase().includes(query) ||
          (item.variant_name && item.variant_name.toLowerCase().includes(query)) ||
          (item.brand_name && item.brand_name.toLowerCase().includes(query))
      );
    }

    // Brand filter
    if (selectedBrandId) {
      result = result.filter((item) => item.brand_id === selectedBrandId);
    }

    // Rx Filter
    if (rxOnlyFilter) {
      result = result.filter((item) => item.is_prescription_required);
    }

    // Sorting
    result.sort((a, b) => {
      const priceA = typeof a.price === 'string' ? parseFloat(a.price) : a.price;
      const priceB = typeof b.price === 'string' ? parseFloat(b.price) : b.price;
      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'name') return a.product_name.localeCompare(b.product_name);
      return 0;
    });

    return result;
  }, [
    rawVariants,
    currentFilter,
    searchInput,
    selectedBrandId,
    expandedCatId,
    selectedSubcategoryId,
    rxOnlyFilter,
    sortBy,
    categories,
  ]);

  const clearFilters = () => {
    setSearchInput('');
    setSelectedSubcategoryId(null);
    setSelectedBrandId(null);
    setExpandedCatId(null);
    setRxOnlyFilter(false);
    setSearchParams({});
  };

  const removeFilterParam = (paramName: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete(paramName);
    setSearchParams(nextParams);
  };

  const hasActiveFilters =
    Boolean(searchInput) ||
    Boolean(currentFilter) ||
    selectedSubcategoryId !== null ||
    expandedCatId !== null ||
    selectedBrandId !== null ||
    rxOnlyFilter;

  // Active Category & Subcategory Name
  const activeCategory = useMemo(() => {
    if (!expandedCatId) return null;
    return (categories || []).find((c: any) => c.id === expandedCatId);
  }, [categories, expandedCatId]);

  const activeCategoryChildren = useMemo(() => {
    if (!activeCategory) return [];
    if (Array.isArray(activeCategory.children) && activeCategory.children.length > 0) {
      return activeCategory.children;
    }
    return (categories || []).filter((c: any) => c.parent === activeCategory.id);
  }, [activeCategory, categories]);

  const activeCategoryName = activeCategory?.name;
  const activeSubcategoryName = useMemo(() => {
    if (!selectedSubcategoryId) return null;
    for (const cat of categories) {
      if (cat.id === selectedSubcategoryId) return cat.name;
      if (Array.isArray(cat.children)) {
        const sub = cat.children.find((s: any) => s.id === selectedSubcategoryId);
        if (sub) return sub.name;
      }
    }
    return null;
  }, [categories, selectedSubcategoryId]);

  // Page Title
  const filterTitleMap: Record<string, string> = {
    best_selling: '🏆 Best Selling Products',
    hot_deals: '🔥 Hot Deals & Offers',
    flash_sale: '⚡ Flash Sale Items',
    top_rated: '⚡ Flash Sale Items',
    quick_access: '⭐ Featured Essentials',
  };
  const activeTitle = currentFilter
    ? filterTitleMap[currentFilter] || 'Promotional Products'
    : activeSubcategoryName
    ? activeSubcategoryName
    : activeCategoryName
    ? activeCategoryName
    : searchInput
    ? `Search "${searchInput}"`
    : 'All Products Catalog';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 py-4 pb-20">
      {/* ── NATIVE MOBILE APP COMPACT HEADER ── */}
      <div className="bg-bg-card border border-bg-border rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-head font-extrabold text-base sm:text-xl text-content-primary">
              {activeTitle}
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-primary-600/15 border border-primary-500/30 text-primary-400 text-[11px] font-mono font-bold">
              {filteredVariants.length} items
            </span>
          </div>

          {/* Quick Dual-Pane Category Modal Trigger */}
          <button
            type="button"
            onClick={openCategoryModal}
            className="sm:hidden p-1.5 rounded-xl bg-bg-surface border border-bg-border text-primary-400 hover:bg-bg-border transition-colors flex items-center gap-1 text-[11px] font-bold"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Categories</span>
          </button>
        </div>

        {/* Desktop Category Trigger */}
        <button
          type="button"
          onClick={openCategoryModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-surface border border-bg-border text-xs font-bold text-content-secondary hover:text-primary-400 transition-all shrink-0"
        >
          <Grid className="w-3.5 h-3.5 text-primary-400" />
          <span>Full Category Tree</span>
        </button>
      </div>

      {/* ── SINGLE CLEAN HORIZONTAL CATEGORY / SUBCATEGORY SCROLL STRIP ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar flex-nowrap">
        {/* All Products Pill */}
        <button
          type="button"
          onClick={clearFilters}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            !expandedCatId && !selectedSubcategoryId
              ? 'bg-primary-600 text-white shadow-glow'
              : 'bg-bg-card border border-bg-border text-content-secondary hover:text-content-primary'
          }`}
        >
          All
        </button>

        {/* If a parent Category is selected: Show its Subcategories */}
        {activeCategory && activeCategoryChildren.length > 0 ? (
          <>
            <button
              type="button"
              onClick={() => {
                setSelectedSubcategoryId(null);
                setSearchParams({ category: activeCategory.id.toString() });
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                !selectedSubcategoryId
                  ? 'bg-primary-600/30 border border-primary-500/40 text-primary-300'
                  : 'bg-bg-card border border-bg-border text-content-secondary'
              }`}
            >
              All {activeCategory.name}
            </button>

            {activeCategoryChildren.map((sub: any) => {
              const isSelected = selectedSubcategoryId === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedSubcategoryId(null);
                      setSearchParams({ category: activeCategory.id.toString() });
                    } else {
                      setSelectedSubcategoryId(sub.id);
                      setSearchParams({
                        category: activeCategory.id.toString(),
                        subcategory: sub.id.toString(),
                      });
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1 ${
                    isSelected
                      ? 'bg-primary-600 text-white font-bold shadow-glow'
                      : 'bg-bg-card border border-bg-border text-content-secondary hover:text-content-primary'
                  }`}
                >
                  <span>{sub.name}</span>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </button>
              );
            })}
          </>
        ) : (
          /* If No Category is selected: Show Main Top-Level Categories */
          topLevelCategories.map((cat: any) => {
            const isSelected = expandedCatId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setExpandedCatId(null);
                    setSelectedSubcategoryId(null);
                    removeFilterParam('category');
                  } else {
                    setExpandedCatId(cat.id);
                    setSelectedSubcategoryId(null);
                    setSearchParams({ category: cat.id.toString() });
                  }
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-primary-600 text-white shadow-glow'
                    : 'bg-bg-card border border-bg-border text-content-secondary hover:text-content-primary'
                }`}
              >
                {cat.name}
              </button>
            );
          })
        )}
      </div>

      {/* ── CONTROLS & PRODUCT CATALOG ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── DESKTOP FILTER SIDEBAR ── */}
        <aside className="hidden lg:block lg:col-span-3 space-y-5 bg-bg-card border border-bg-border rounded-2xl p-4 shadow-card sticky top-24">
          <div className="flex items-center justify-between pb-2.5 border-b border-bg-border">
            <h3 className="font-head font-bold text-xs uppercase tracking-wider text-content-primary flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary-400" />
              Filter Catalog
            </h3>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] font-bold text-primary-400 hover:underline"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Categories Accordion */}
          <div className="space-y-2">
            <h4 className="font-head font-semibold text-[11px] text-content-muted uppercase tracking-wider">
              Categories
            </h4>
            <div className="space-y-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {topLevelCategories.map((cat: any) => {
                const isExpanded = expandedCatId === cat.id;
                const subcats = (Array.isArray(cat.children) && cat.children.length > 0)
                  ? cat.children
                  : (categories || []).filter((c: any) => c.parent === cat.id);
                const hasSub = subcats.length > 0;
                return (
                  <div key={cat.id} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (isExpanded) {
                          setExpandedCatId(null);
                          setSelectedSubcategoryId(null);
                          removeFilterParam('category');
                          removeFilterParam('subcategory');
                        } else {
                          setExpandedCatId(cat.id);
                          setSelectedSubcategoryId(null);
                          setSearchParams({ category: cat.id.toString() });
                        }
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                        isExpanded
                          ? 'bg-primary-600/20 text-primary-400 font-bold'
                          : 'text-content-secondary hover:bg-bg-surface hover:text-content-primary'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      {hasSub && (
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform ${
                            isExpanded ? 'rotate-90 text-primary-400' : 'text-content-muted'
                          }`}
                        />
                      )}
                    </button>

                    {isExpanded && hasSub && (
                      <div className="pl-3 space-y-1 border-l border-bg-border/60 ml-2 py-1">
                        {subcats.map((sub: any) => {
                          const isSelected = selectedSubcategoryId === sub.id;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedSubcategoryId(null);
                                  setSearchParams({ category: cat.id.toString() });
                                } else {
                                  setSelectedSubcategoryId(sub.id);
                                  setSearchParams({
                                    category: cat.id.toString(),
                                    subcategory: sub.id.toString(),
                                  });
                                }
                              }}
                              className={`w-full text-left px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-between ${
                                isSelected
                                  ? 'bg-primary-600/30 text-primary-300 font-bold'
                                  : 'text-content-muted hover:text-content-secondary hover:bg-bg-surface'
                              }`}
                            >
                              <span>{sub.name}</span>
                              {isSelected && <Check className="w-3 h-3 text-primary-400" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Brands Filter */}
          {brands.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-bg-border">
              <h4 className="font-head font-semibold text-[11px] text-content-muted uppercase tracking-wider">
                Brands
              </h4>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                {brands.map((b: any) => {
                  const isSelected = selectedBrandId === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBrandId(isSelected ? null : b.id)}
                      className={`w-full flex items-center justify-between p-1.5 px-2 rounded-xl text-xs transition-colors ${
                        isSelected
                          ? 'bg-primary-600/20 text-primary-400 font-bold'
                          : 'text-content-secondary hover:bg-bg-surface hover:text-content-primary'
                      }`}
                    >
                      <span>{b.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rx Toggle */}
          <div className="pt-3 border-t border-bg-border">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-content-secondary">
                Prescription Only (Rx)
              </span>
              <input
                type="checkbox"
                checked={rxOnlyFilter}
                onChange={(e) => setRxOnlyFilter(e.target.checked)}
                className="w-4 h-4 rounded border-bg-border text-primary-600 focus:ring-primary-500 bg-bg-surface"
              />
            </label>
          </div>
        </aside>

        {/* ── PRODUCTS MAIN CATALOG DISPLAY ── */}
        <main className="lg:col-span-9 space-y-4">
          {/* Top Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-bg-card border border-bg-border rounded-2xl p-3 sm:px-4 shadow-card">
            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-content-muted" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-full bg-bg-surface border border-bg-border text-content-primary text-xs focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="flex items-center justify-between w-full sm:w-auto gap-2.5">
              {/* Mobile Filter Sheet Button */}
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden rounded-full gap-1.5 text-xs py-1.5"
                onClick={() => setMobileFilterOpen(true)}
              >
                <Filter className="w-3.5 h-3.5 text-primary-400" /> Filters
              </Button>

              {/* Sort Select */}
              <div className="flex items-center gap-1.5 text-xs text-content-secondary font-medium">
                <span className="hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-bg-surface border border-bg-border rounded-full px-3 py-1.5 text-xs text-content-primary focus:outline-none focus:border-primary-500"
                >
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name">Product Name</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 bg-bg-card/50 border border-bg-border/60 rounded-xl p-2 px-3">
              <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider">
                Active:
              </span>
              {currentFilter && (
                <Badge variant="warning" className="gap-1 text-[11px] rounded-full uppercase tracking-wider font-bold">
                  {currentFilter.replace('_', ' ')}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilterParam('filter')} />
                </Badge>
              )}
              {searchInput && (
                <Badge variant="primary" className="gap-1 text-[11px] rounded-full">
                  "{searchInput}"
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchInput('')} />
                </Badge>
              )}
              {activeCategoryName && (
                <Badge variant="info" className="gap-1 text-[11px] rounded-full">
                  Cat: {activeCategoryName}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => {
                      setExpandedCatId(null);
                      setSelectedSubcategoryId(null);
                      removeFilterParam('category');
                      removeFilterParam('subcategory');
                    }}
                  />
                </Badge>
              )}
              {activeSubcategoryName && (
                <Badge variant="success" className="gap-1 text-[11px] rounded-full">
                  Sub: {activeSubcategoryName}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedSubcategoryId(null)} />
                </Badge>
              )}
              {selectedBrandId && (
                <Badge variant="secondary" className="gap-1 text-[11px] rounded-full">
                  Brand: {brands.find((b: any) => b.id === selectedBrandId)?.name}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedBrandId(null)} />
                </Badge>
              )}
              {rxOnlyFilter && (
                <Badge variant="danger" className="gap-1 text-[11px] rounded-full">
                  Rx Required
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setRxOnlyFilter(false)} />
                </Badge>
              )}

              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] font-bold text-primary-400 hover:underline ml-auto"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Products Grid (Native App 2-Column Mobile Layout) */}
          {variantsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : filteredVariants.length === 0 ? (
            <div className="text-center py-16 bg-bg-card border border-bg-border rounded-3xl space-y-3 shadow-card">
              <Pill className="w-10 h-10 text-content-muted mx-auto" />
              <h3 className="font-head font-bold text-lg text-content-primary">No Matching Products</h3>
              <p className="text-content-muted text-xs max-w-sm mx-auto">
                Try adjusting search keywords or clearing selected filters.
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2 rounded-full text-xs font-bold">
                  Reset All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
              {filteredVariants.map((variant) => (
                <VariantCard key={variant.id} variant={variant} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── MOBILE FILTER BOTTOM DRAWER ── */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />

          <div className="relative z-10 bg-bg-card border-t border-bg-border rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-2.5 border-b border-bg-border">
              <h3 className="font-head font-bold text-base text-content-primary flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary-400" />
                Filter Products
              </h3>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-full bg-bg-surface border border-bg-border text-content-muted hover:text-content-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categories & Subcategories Accordion */}
            <div className="space-y-2">
              <h4 className="font-head font-semibold text-xs text-content-muted uppercase tracking-wider">
                Categories & Subcategories
              </h4>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {topLevelCategories.map((cat: any) => {
                  const isExpanded = expandedCatId === cat.id;
                  const subcats = (Array.isArray(cat.children) && cat.children.length > 0)
                    ? cat.children
                    : (categories || []).filter((c: any) => c.parent === cat.id);
                  const hasSub = subcats.length > 0;
                  return (
                    <div key={cat.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedCatId(isExpanded ? null : cat.id);
                          setSelectedSubcategoryId(null);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-left ${
                          isExpanded
                            ? 'bg-primary-600/20 text-primary-400 font-bold'
                            : 'text-content-secondary bg-bg-surface/50'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        {hasSub && (
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${
                              isExpanded ? 'rotate-90 text-primary-400' : 'text-content-muted'
                            }`}
                          />
                        )}
                      </button>

                      {isExpanded && hasSub && (
                        <div className="pl-3 space-y-1 border-l border-bg-border/60 ml-2 py-1">
                          {subcats.map((sub: any) => {
                            const isSelected = selectedSubcategoryId === sub.id;
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedSubcategoryId(null);
                                    removeFilterParam('subcategory');
                                  } else {
                                    setSelectedSubcategoryId(sub.id);
                                    setSearchParams({
                                      category: cat.id.toString(),
                                      subcategory: sub.id.toString(),
                                    });
                                  }
                                  setMobileFilterOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-primary-600/30 text-primary-300 font-bold'
                                    : 'text-content-muted hover:bg-bg-surface'
                                }`}
                              >
                                <span>{sub.name}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-primary-400" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Brands Filter */}
            {brands.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-bg-border">
                <h4 className="font-head font-semibold text-xs text-content-muted uppercase tracking-wider">
                  Brands
                </h4>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {brands.map((b: any) => {
                    const isSelected = selectedBrandId === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setSelectedBrandId(isSelected ? null : b.id);
                          setMobileFilterOpen(false);
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                          isSelected
                            ? 'bg-primary-600/20 text-primary-400 font-bold border border-primary-500/40'
                            : 'bg-bg-surface/50 text-content-secondary border border-bg-border'
                        }`}
                      >
                        <span className="truncate">{b.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rx Filter */}
            <div className="pt-2 border-t border-bg-border">
              <label className="flex items-center justify-between cursor-pointer p-2 bg-bg-surface/50 rounded-xl border border-bg-border">
                <span className="text-xs font-semibold text-content-secondary">
                  Prescription Only (Rx)
                </span>
                <input
                  type="checkbox"
                  checked={rxOnlyFilter}
                  onChange={(e) => {
                    setRxOnlyFilter(e.target.checked);
                    setMobileFilterOpen(false);
                  }}
                  className="w-4 h-4 rounded border-bg-border text-primary-600 focus:ring-primary-500 bg-bg-surface"
                />
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearFilters();
                    setMobileFilterOpen(false);
                  }}
                  className="flex-1 rounded-full text-xs font-bold"
                >
                  Reset All
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 rounded-full text-xs font-bold py-2.5"
              >
                View ({filteredVariants.length} Items)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
