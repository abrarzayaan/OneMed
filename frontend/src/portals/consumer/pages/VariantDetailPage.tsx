import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShoppingCart,
  ShieldCheck,
  Truck,
  RotateCcw,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Star,
  Minus,
  Plus,
  ChevronRight,
  Share2,
  Maximize2,
  X,
  Info,
  Pill,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { productsApi } from '@/api/products.api';
import { cartApi } from '@/api/cart.api';
import { profileApi } from '@/api/profile.api';
import { useAuthStore } from '@/store/auth.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { useCart } from '@/hooks/useCart';
import type { ProductVariantItem } from '@/types/product.types';
import { formatCurrency } from '@/utils/formatCurrency';
import VariantCard from '@/portals/consumer/components/product/VariantCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';

export default function VariantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const variantId = Number(id);

  const { isLoggedIn, user } = useAuthStore();
  const isPartnerUser = Boolean(
    user?.role && (user.role.toLowerCase() === 'vendor' || user.role.toLowerCase() === 'rider')
  );
  const isConsumerLoggedIn = isLoggedIn && !isPartnerUser;
  const { toggle: toggleWishlist, isWishlisted } = useWishlistStore();
  const { addItem, isAdding: isAddingCart } = useCart();

  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'usage'>('overview');
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);

  // 1. Fetch Variant Detail
  const {
    data: variant,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['variant-detail', variantId],
    queryFn: async () => {
      const res = await productsApi.getVariantDetail(variantId);
      return res.data;
    },
    enabled: !!variantId && !isNaN(variantId),
    staleTime: 1000 * 60 * 5,
  });

  // 2. Fetch Related Product Variants (Same subcategory or related)
  const { data: relatedVariants = [] } = useQuery({
    queryKey: ['related-variants', variant?.category_id],
    queryFn: async () => {
      if (!variant?.category_id) return [];
      const res = await productsApi.getVariantsBySubcategory(variant.category_id);
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (raw as any).results || [];
      return list.filter((v: ProductVariantItem) => v.id !== variantId);
    },
    enabled: !!variant?.category_id,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return <VariantDetailSkeleton />;
  }

  if (isError || !variant) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-danger-500/10 text-danger-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="font-head text-2xl font-bold text-content-primary">
          Product Variant Not Found
        </h2>
        <p className="text-content-secondary text-sm max-w-md mx-auto">
          The requested product variant may have been removed or is temporarily unavailable.
        </p>
        <div className="pt-4">
          <Button variant="primary" onClick={() => navigate('/products')}>
            Back to Product Catalog
          </Button>
        </div>
      </div>
    );
  }

  // Gallery images setup
  const galleryImages: string[] = [];
  if (variant.variant_images && variant.variant_images.length > 0) {
    variant.variant_images.forEach((img) => {
      if (img.image_url) galleryImages.push(img.image_url);
    });
  }
  if (galleryImages.length === 0 && variant.thumbnail) {
    galleryImages.push(variant.thumbnail);
  }

  const activeImageUrl =
    galleryImages[selectedImageIndex] || variant.thumbnail || '';

  const getFullImageUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:8000${url}`;
  };

  // Pricing calculations
  const priceNum = parseFloat(String(variant.price || '0'));
  const salePriceNum = variant.sale_price ? parseFloat(String(variant.sale_price)) : null;
  const hasDiscount = salePriceNum !== null && salePriceNum < priceNum;
  const unitPrice = hasDiscount ? salePriceNum! : priceNum;
  const discountPercent = hasDiscount
    ? Math.round(((priceNum - salePriceNum!) / priceNum) * 100)
    : 0;

  const isWish = isWishlisted(variant.id);
  const minQty = variant.min_order_qty || 1;
  const maxQty = variant.max_order_qty || 10;
  const isOutOfStock = variant.status !== 'active';

  // Handle Add to Cart
  const handleAddToCart = () => {
    addItem({ variantId: variant.id, quantity });
  };

  // Handle Buy Now
  const handleBuyNow = async () => {
    if (!isConsumerLoggedIn) {
      toast.error('Please log in as a consumer to proceed with checkout.');
      navigate('/login');
      return;
    }

    try {
      const addressRes = await profileApi.getAddresses();
      const addrData = addressRes.data;
      const addressList = Array.isArray(addrData) ? addrData : (addrData?.results || []);
      if (addressList.length === 0) {
        toast.error('Please add a shipping address before proceeding to checkout 📍', { duration: 4000 });
        navigate('/account/addresses');
        return;
      }
      navigate(`/checkout?variant=${variant.id}&qty=${quantity}`);
    } catch (err: any) {
      toast.error('Could not process immediate buy. Please try again.');
    }
  };

  // Handle Share
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${variant.product_name} - ${variant.variant_name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-6">
      {/* ── BREADCRUMB ── */}
      <nav className="flex items-center gap-2 text-xs text-content-muted flex-wrap">
        <Link to="/" className="hover:text-primary-400 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/products" className="hover:text-primary-400 transition-colors">
          Catalog
        </Link>
        {variant.category_name && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-content-secondary">{variant.category_name}</span>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-content-primary font-medium truncate">
          {variant.product_name} ({variant.variant_name})
        </span>
      </nav>

      {/* ── MAIN PRODUCT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── LEFT: IMAGE GALLERY (5 COLS) ── */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Image Box */}
          <div className="relative rounded-3xl bg-bg-card border border-bg-border overflow-hidden group aspect-square flex items-center justify-center p-6">
            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              {hasDiscount && (
                <Badge variant="danger" className="font-head font-extrabold text-xs">
                  {discountPercent}% OFF
                </Badge>
              )}
              {variant.is_prescription_required && (
                <Badge variant="warning" className="font-head font-extrabold text-xs">
                  Rx Required
                </Badge>
              )}
              {isOutOfStock && (
                <Badge variant="muted" className="font-head text-xs">
                  Out of Stock
                </Badge>
              )}
            </div>

            {/* Quick Actions (Zoom + Share) */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="w-9 h-9 rounded-full bg-bg-surface/80 backdrop-blur border border-bg-border text-content-secondary hover:text-content-primary flex items-center justify-center transition-all hover:scale-105"
                title="Share product"
              >
                <Share2 className="w-4 h-4" />
              </button>
              {activeImageUrl && (
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="w-9 h-9 rounded-full bg-bg-surface/80 backdrop-blur border border-bg-border text-content-secondary hover:text-content-primary flex items-center justify-center transition-all hover:scale-105"
                  title="Zoom image"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Main Preview Image */}
            {activeImageUrl ? (
              <img
                src={getFullImageUrl(activeImageUrl)}
                alt={variant.product_name}
                className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => setIsZoomOpen(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-content-muted space-y-2">
                <Pill className="w-16 h-16 stroke-1" />
                <span className="text-xs">No image available</span>
              </div>
            )}
          </div>

          {/* Thumbnails Carousel Strip */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-2xl bg-bg-card border-2 p-1 overflow-hidden shrink-0 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-primary-500 ring-2 ring-primary-500/30'
                      : 'border-bg-border hover:border-content-muted'
                  }`}
                >
                  <img
                    src={getFullImageUrl(imgUrl)}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-contain rounded-xl"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: PRODUCT DETAILS & BUY ACTIONS (7 COLS) ── */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Info */}
          <div className="space-y-3 border-b border-bg-border pb-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Brand, Category & Promotional Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {variant.brand_name && (
                  <span className="px-3 py-1 rounded-full bg-primary-600/15 border border-primary-500/30 text-primary-400 text-xs font-bold uppercase tracking-wider">
                    {variant.brand_name}
                  </span>
                )}
                {variant.category_name && (
                  <span className="text-xs font-semibold text-content-muted">
                    {variant.category_name}
                  </span>
                )}

                {/* Dynamic Promotional Badges from variant.meta */}
                {variant.meta?.is_hot_deal && (
                  <span className="px-2.5 py-0.5 rounded-full bg-danger-500/20 border border-danger-500/30 text-danger-400 text-xs font-bold">
                    🔥 Hot Deal
                  </span>
                )}
                {variant.meta?.is_best_selling && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold">
                    ⭐ Best Seller
                  </span>
                )}
                {(variant.meta?.is_flash_sale || variant.meta?.is_top_rated) && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold">
                    ⚡ Flash Sale
                  </span>
                )}
                {variant.meta?.is_featured && (
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-400 text-xs font-bold">
                    ✨ Featured
                  </span>
                )}
              </div>

              {/* SKU Badge */}
              <span className="text-xs font-mono text-content-muted bg-bg-card px-2.5 py-1 rounded-lg border border-bg-border">
                SKU: {variant.sku}
              </span>
            </div>

            {/* Product Title & Variant Name */}
            <div>
              <h1 className="font-head font-extrabold text-2xl sm:text-3xl text-content-primary leading-tight">
                {variant.product_name}
              </h1>
              <p className="font-head font-semibold text-base text-accent-400 mt-1">
                {variant.variant_name}
              </p>
            </div>

            {/* Rating Stars & Stock */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
                <span className="font-bold text-content-primary ml-1">4.8</span>
                <span className="text-content-muted">(42 reviews)</span>
              </div>

              <span className="text-bg-border">•</span>

              <div className="flex items-center gap-1.5 font-semibold">
                {isOutOfStock ? (
                  <span className="text-danger-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-danger-500" />
                    Out of Stock
                  </span>
                ) : (
                  <span className="text-success flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    In Stock (Ready to Dispatch)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-bg-card border border-bg-border rounded-3xl p-5 space-y-2">
            <span className="text-xs font-bold text-content-muted uppercase tracking-wider">
              Price Range
            </span>

            <div className="flex items-baseline gap-3">
              <span className="font-head font-extrabold text-3xl sm:text-4xl text-content-primary">
                {formatCurrency(unitPrice)}
              </span>

              {hasDiscount && (
                <>
                  <span className="text-base text-content-muted line-through">
                    {formatCurrency(priceNum)}
                  </span>
                  <span className="text-xs font-extrabold text-danger-400 bg-danger-500/10 px-2.5 py-1 rounded-full border border-danger-500/20">
                    Save {formatCurrency(priceNum - salePriceNum!)} ({discountPercent}%)
                  </span>
                </>
              )}
            </div>

            <p className="text-[11px] text-content-muted">
              Inclusive of all taxes. Free shipping on orders over ৳1,000.
            </p>
          </div>

          {/* Prescription Required Alert Banner */}
          {variant.is_prescription_required && (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-start gap-3 text-xs text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-300">Prescription Required (Rx)</p>
                <p className="leading-relaxed">
                  This item is a prescription-only medication. You must present or upload a valid prescription from a registered physician during delivery.
                </p>
              </div>
            </div>
          )}

          {/* Quantity & Actions Row */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs font-bold text-content-secondary uppercase tracking-wider">
                Quantity:
              </span>

              {/* Quantity Stepper */}
              <div className="inline-flex items-center rounded-full bg-bg-card border border-bg-border p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(minQty, q - 1))}
                  disabled={quantity <= minQty || isOutOfStock}
                  className="w-8 h-8 rounded-full bg-bg-surface hover:bg-bg-border flex items-center justify-center text-content-primary disabled:opacity-40 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-12 text-center font-mono font-bold text-sm text-content-primary">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  disabled={quantity >= maxQty || isOutOfStock}
                  className="w-8 h-8 rounded-full bg-bg-surface hover:bg-bg-border flex items-center justify-center text-content-primary disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-xs text-content-muted">
                (Subtotal: <strong className="text-content-primary">{formatCurrency(unitPrice * quantity)}</strong>)
              </span>
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAddingCart}
                loading={isAddingCart}
                className="sm:col-span-6 rounded-full font-bold text-sm gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </Button>

              <Button
                variant="accent"
                size="lg"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="sm:col-span-4 rounded-full font-bold text-sm"
              >
                Buy Now
              </Button>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => {
                  toggleWishlist(variant.id);
                  toast(isWish ? 'Removed from Wishlist' : 'Added to Wishlist!', {
                    icon: isWish ? '🗑️' : '❤️',
                  });
                }}
                className={`sm:col-span-2 rounded-full border flex items-center justify-center p-3 transition-all ${
                  isWish
                    ? 'bg-danger-500/20 border-danger-500/40 text-danger-400'
                    : 'bg-bg-card border-bg-border text-content-secondary hover:text-content-primary'
                }`}
                title={isWish ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-5 h-5 ${isWish ? 'fill-danger-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-3 border-t border-bg-border pt-6 text-center text-[11px] text-content-secondary">
            <div className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-bg-card/50 border border-bg-border/50">
              <Truck className="w-5 h-5 text-accent-400" />
              <span className="font-semibold text-content-primary">Express Delivery</span>
              <span className="text-[10px] text-content-muted">Within 2-4 Hours</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-bg-card/50 border border-bg-border/50">
              <ShieldCheck className="w-5 h-5 text-primary-400" />
              <span className="font-semibold text-content-primary">100% Genuine</span>
              <span className="text-[10px] text-content-muted">Direct from Manufacturer</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-bg-card/50 border border-bg-border/50">
              <RotateCcw className="w-5 h-5 text-success" />
              <span className="font-semibold text-content-primary">Easy Returns</span>
              <span className="text-[10px] text-content-muted">Hassle-free 7 Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── PRODUCT INFO TABS SECTION ── */}
      <section className="bg-bg-card border border-bg-border rounded-3xl p-6 space-y-6">
        {/* Tab Headers */}
        <div className="flex items-center gap-4 border-b border-bg-border pb-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`font-head font-bold text-sm pb-2 border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-content-secondary hover:text-content-primary'
            }`}
          >
            Overview & Description
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`font-head font-bold text-sm pb-2 border-b-2 transition-all ${
              activeTab === 'specs'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-content-secondary hover:text-content-primary'
            }`}
          >
            Specifications & Meta
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('usage')}
            className={`font-head font-bold text-sm pb-2 border-b-2 transition-all ${
              activeTab === 'usage'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-content-secondary hover:text-content-primary'
            }`}
          >
            Usage & Storage Advice
          </button>
        </div>

        {/* Tab Contents */}
        <div className="text-xs text-content-secondary leading-relaxed space-y-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h3 className="font-head font-bold text-sm text-content-primary">
                About {variant.product_name} ({variant.variant_name})
              </h3>

              {(() => {
                const longDesc: Record<string, any> = typeof variant.long_description === 'object' && variant.long_description !== null
                  ? (variant.long_description as Record<string, any>)
                  : typeof variant.long_description === 'string'
                  ? { about: variant.long_description }
                  : {};

                const aboutText = (longDesc.about || '').trim();

                let highlightsList: string[] = [];
                if (Array.isArray(longDesc.highlights)) {
                  highlightsList = longDesc.highlights.map((h: any) => String(h).trim()).filter(Boolean);
                } else if (typeof longDesc.highlights === 'string' && longDesc.highlights.trim()) {
                  highlightsList = longDesc.highlights.split(/\r?\n|,/).map((s: string) => s.trim()).filter(Boolean);
                }

                const indicationsText = (longDesc.indications || '').trim();

                const knownKeys = ['about', 'highlights', 'indications'];
                const extraKeys = Object.entries(longDesc).filter(([k, v]) => !knownKeys.includes(k) && v !== null && v !== '');

                const hasAnyOverviewContent = aboutText || highlightsList.length > 0 || indicationsText || extraKeys.length > 0;

                if (!hasAnyOverviewContent) {
                  return (
                    <div className="p-6 text-center text-content-muted text-xs bg-bg-surface/40 rounded-2xl border border-bg-border">
                      No detailed overview available for this product variant.
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {aboutText && (
                      <p className="text-content-secondary leading-relaxed text-sm">
                        {aboutText}
                      </p>
                    )}

                    {(highlightsList.length > 0 || indicationsText) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {/* Key Highlights & Features */}
                        {highlightsList.length > 0 && (
                          <div className="p-4 rounded-2xl bg-bg-surface border border-bg-border space-y-2">
                            <span className="font-bold text-content-primary flex items-center gap-1.5 text-xs">
                              <CheckCircle2 className="w-4 h-4 text-success" /> Key Highlights & Features
                            </span>
                            <ul className="list-disc list-inside space-y-1.5 text-content-muted text-xs">
                              {highlightsList.map((hl: string, idx: number) => (
                                <li key={idx}>{hl}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Quick Medical Note / Indications */}
                        {indicationsText && (
                          <div className="p-4 rounded-2xl bg-bg-surface border border-bg-border space-y-2">
                            <span className="font-bold text-content-primary flex items-center gap-1.5 text-xs">
                              <Info className="w-4 h-4 text-primary-400" /> Quick Medical Note / Indications
                            </span>
                            <p className="text-content-muted text-xs leading-relaxed">
                              {indicationsText}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dynamic Extra Overview Keys */}
                    {extraKeys.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {extraKeys.map(([key, val]) => (
                          <div key={key} className="p-4 rounded-2xl bg-bg-surface border border-bg-border space-y-1">
                            <span className="font-bold text-content-primary text-xs uppercase tracking-wider capitalize">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <p className="text-content-muted text-xs leading-relaxed">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <tbody>
                  <tr className="border-b border-bg-border/60">
                    <td className="py-2.5 px-4 font-bold text-content-primary bg-bg-surface/50 w-1/3">
                      Product Name
                    </td>
                    <td className="py-2.5 px-4 text-content-secondary">{variant.product_name}</td>
                  </tr>
                  <tr className="border-b border-bg-border/60">
                    <td className="py-2.5 px-4 font-bold text-content-primary bg-bg-surface/50">
                      Variant Specification
                    </td>
                    <td className="py-2.5 px-4 text-content-secondary">{variant.variant_name}</td>
                  </tr>
                  <tr className="border-b border-bg-border/60">
                    <td className="py-2.5 px-4 font-bold text-content-primary bg-bg-surface/50">
                      SKU Code
                    </td>
                    <td className="py-2.5 px-4 text-mono text-content-secondary">{variant.sku}</td>
                  </tr>
                  {variant.barcode && (
                    <tr className="border-b border-bg-border/60">
                      <td className="py-2.5 px-4 font-bold text-content-primary bg-bg-surface/50">
                        Barcode / EAN
                      </td>
                      <td className="py-2.5 px-4 text-mono text-content-secondary">{variant.barcode}</td>
                    </tr>
                  )}
                  {variant.brand_name && (
                    <tr className="border-b border-bg-border/60">
                      <td className="py-2.5 px-4 font-bold text-content-primary bg-bg-surface/50">
                        Brand
                      </td>
                      <td className="py-2.5 px-4 text-content-secondary">{variant.brand_name}</td>
                    </tr>
                  )}
                  {variant.category_name && (
                    <tr className="border-b border-bg-border/60">
                      <td className="py-2.5 px-4 font-bold text-content-primary bg-bg-surface/50">
                        Category
                      </td>
                      <td className="py-2.5 px-4 text-content-secondary">{variant.category_name}</td>
                    </tr>
                  )}
                  {variant.weight && (
                    <tr className="border-b border-bg-border/60">
                      <td className="py-2.5 px-4 font-bold text-content-primary bg-bg-surface/50">
                        Weight
                      </td>
                      <td className="py-2.5 px-4 text-content-secondary">{variant.weight} kg</td>
                    </tr>
                  )}
                  {(() => {
                    const dims = (variant as any).dimensions || (variant.meta as any)?.dimensions;
                    if (dims && typeof dims === 'object' && (dims.length || dims.width || dims.height)) {
                      return (
                        <tr className="border-b border-bg-border/60">
                          <td className="py-2.5 px-4 font-bold text-content-primary bg-bg-surface/50">
                            Dimensions
                          </td>
                          <td className="py-2.5 px-4 text-content-secondary">
                            {dims.length || 0} × {dims.width || 0} × {dims.height || 0} {dims.unit || 'cm'}
                          </td>
                        </tr>
                      );
                    }
                    return null;
                  })()}

                  {/* Render Dynamic Non-Boolean Meta JSON Key-Values */}
                  {variant.meta && Object.entries(variant.meta).map(([key, val]) => {
                    if (typeof val === 'boolean' || key.startsWith('is_') || key === 'dimensions') {
                      return null;
                    }
                    if (val === null || val === '') return null;

                    let displayVal = '';
                    if (typeof val === 'object' && val !== null) {
                      displayVal = JSON.stringify(val);
                    } else {
                      displayVal = String(val);
                    }

                    return (
                      <tr key={key} className="border-b border-bg-border/60">
                        <td className="py-2.5 px-4 font-bold text-content-primary bg-bg-surface/50 capitalize">
                          {key.replace(/_/g, ' ')}
                        </td>
                        <td className="py-2.5 px-4 text-content-secondary">{displayVal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-4">
              <h3 className="font-head font-bold text-sm text-content-primary">
                Directions, Dosage & Storage Advice
              </h3>

              {(() => {
                const shortDesc: Record<string, any> = typeof variant.short_description === 'object' && variant.short_description !== null
                  ? (variant.short_description as Record<string, any>)
                  : typeof variant.short_description === 'string'
                  ? { usage: variant.short_description }
                  : {};

                const standardKeys = ['dosage', 'storage', 'warnings', 'side_effects'];
                const extraKeys = Object.entries(shortDesc).filter(([k, v]) => !standardKeys.includes(k) && v !== null && v !== '');

                const dosage = (shortDesc.dosage || '').trim();
                const storage = (shortDesc.storage || '').trim();
                const warnings = (shortDesc.warnings || '').trim();
                const sideEffects = (shortDesc.side_effects || '').trim();

                const hasAnyContent = dosage || storage || warnings || sideEffects || extraKeys.length > 0;

                if (!hasAnyContent) {
                  return (
                    <div className="p-6 text-center text-content-muted text-xs bg-bg-surface/40 rounded-2xl border border-bg-border">
                      No usage or storage advice available for this product variant.
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dosage && (
                        <div className="p-4 rounded-2xl bg-bg-surface border border-bg-border space-y-1.5">
                          <span className="font-bold text-primary-400 text-xs flex items-center gap-1.5">
                            <Pill className="w-4 h-4" /> Dosage & Administration
                          </span>
                          <p className="text-content-secondary text-xs leading-relaxed">{dosage}</p>
                        </div>
                      )}

                      {storage && (
                        <div className="p-4 rounded-2xl bg-bg-surface border border-bg-border space-y-1.5">
                          <span className="font-bold text-accent-400 text-xs flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" /> Storage Advice
                          </span>
                          <p className="text-content-secondary text-xs leading-relaxed">{storage}</p>
                        </div>
                      )}

                      {warnings && (
                        <div className="p-4 rounded-2xl bg-bg-surface border border-bg-border space-y-1.5">
                          <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" /> Warnings & Precautions
                          </span>
                          <p className="text-content-secondary text-xs leading-relaxed">{warnings}</p>
                        </div>
                      )}

                      {sideEffects && (
                        <div className="p-4 rounded-2xl bg-bg-surface border border-bg-border space-y-1.5">
                          <span className="font-bold text-danger-400 text-xs flex items-center gap-1.5">
                            <Info className="w-4 h-4" /> Side Effects
                          </span>
                          <p className="text-content-secondary text-xs leading-relaxed">{sideEffects}</p>
                        </div>
                      )}
                    </div>

                    {/* Dynamic Extra Usage Keys */}
                    {extraKeys.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-bg-border/50">
                        {extraKeys.map(([key, val]) => (
                          <div key={key} className="p-4 rounded-2xl bg-bg-surface border border-bg-border space-y-1.5">
                            <span className="font-bold text-content-primary text-xs flex items-center gap-1.5 capitalize">
                              <Info className="w-4 h-4 text-primary-400" /> {key.replace(/_/g, ' ')}
                            </span>
                            <p className="text-content-secondary text-xs leading-relaxed">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </section>

      {/* ── RELATED VARIANTS / SIBLING VARIANTS ── */}
      {relatedVariants.length > 0 && (
        <section className="space-y-6 pt-4">
          <h2 className="font-head font-bold text-xl sm:text-2xl text-content-primary">
            Other Variants & Related Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {relatedVariants.slice(0, 6).map((item: ProductVariantItem) => (
              <VariantCard key={item.id} variant={item} />
            ))}
          </div>
        </section>
      )}

      {/* ── FULLSCREEN ZOOM MODAL ── */}
      <AnimatePresence>
        {isZoomOpen && activeImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsZoomOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors z-50"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={getFullImageUrl(activeImageUrl)}
              alt={variant.product_name}
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Skeleton Component for Detail Page Loading State
function VariantDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-6">
      {/* Breadcrumb Skeleton */}
      <Skeleton className="h-4 w-64 rounded-md" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Image Skeleton */}
        <div className="lg:col-span-5 space-y-4">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="flex gap-3">
            <Skeleton className="w-20 h-20 rounded-2xl" />
            <Skeleton className="w-20 h-20 rounded-2xl" />
            <Skeleton className="w-20 h-20 rounded-2xl" />
          </div>
        </div>

        {/* Right Info Skeleton */}
        <div className="lg:col-span-7 space-y-6">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-10 w-3/4 rounded-xl" />
          <Skeleton className="h-6 w-1/2 rounded-lg" />
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-14 w-full rounded-full" />
          <Skeleton className="h-32 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
