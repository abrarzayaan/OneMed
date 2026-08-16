import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  HeartOff,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useWishlistStore } from '@/store/wishlist.store';
import { productsApi } from '@/api/products.api';
import { useCart } from '@/hooks/useCart';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency, formatDiscount } from '@/utils/formatCurrency';
import type { ProductVariantDetail } from '@/types/product.types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  const isPartnerUser = Boolean(
    user?.role && (user.role.toLowerCase() === 'vendor' || user.role.toLowerCase() === 'rider')
  );
  const isConsumerLoggedIn = isLoggedIn && !isPartnerUser;

  const { items: wishlistIds, toggle, clear } = useWishlistStore();
  const { addItem, isAdding, updatingVariantId } = useCart();

  // Fetch variant details for all wishlisted items
  const { data: variants = [], isLoading } = useQuery<ProductVariantDetail[]>({
    queryKey: ['wishlist-variants', wishlistIds],
    queryFn: async () => {
      if (wishlistIds.length === 0) return [];
      const responses = await Promise.allSettled(
        wishlistIds.map((id) => productsApi.getVariantDetail(id))
      );
      const list: ProductVariantDetail[] = [];
      for (const res of responses) {
        if (res.status === 'fulfilled' && res.value?.data) {
          list.push(res.value.data);
        }
      }
      return list;
    },
    enabled: wishlistIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  const handleAddToCart = (variant: ProductVariantDetail) => {
    if (!isConsumerLoggedIn) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    addItem({ variantId: variant.id, quantity: 1 });
  };

  const handleRemoveFromWishlist = (id: number, name: string) => {
    toggle(id);
    toast(`${name} removed from wishlist`, { icon: '💔' });
  };

  const handleClearWishlist = () => {
    clear();
    toast.success('Wishlist cleared');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-bg-border pb-6">
        <div>
          <nav className="flex items-center gap-2 text-xs text-content-muted mb-2">
            <Link to="/" className="hover:text-content-primary transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-primary-400 font-medium">Wishlist</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="font-head text-2xl sm:text-3xl font-extrabold text-content-primary flex items-center gap-2.5">
              <Heart className="w-7 h-7 text-red-500 fill-red-500" /> My Saved Items
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-600/20 text-primary-400 text-xs font-bold border border-primary-500/30">
              {wishlistIds.length} {wishlistIds.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {wishlistIds.length > 0 && (
            <Button
              onClick={handleClearWishlist}
              variant="ghost"
              size="sm"
              className="rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-1.5 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Wishlist
            </Button>
          )}
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-xs text-content-secondary hover:text-primary-400 font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Explore Catalog
          </Link>
        </div>
      </div>

      {/* Main Content */}
      {wishlistIds.length === 0 ? (
        // Empty State
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto py-16 text-center space-y-6 bg-bg-card border border-bg-border rounded-3xl p-8 shadow-card"
        >
          <div className="w-20 h-20 rounded-3xl bg-bg-surface border border-bg-border flex items-center justify-center text-red-400/60 mx-auto">
            <HeartOff className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="font-head font-bold text-xl text-content-primary">
              Your Wishlist is Empty
            </h3>
            <p className="text-xs text-content-secondary max-w-xs mx-auto">
              Save your essential medicines and products for easy ordering anytime.
            </p>
          </div>
          <Button
            onClick={() => navigate('/products')}
            variant="primary"
            size="md"
            className="rounded-full px-8 gap-2 font-bold shadow-glow"
          >
            Discover Products <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      ) : isLoading ? (
        // Skeleton Loader Grid
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-80 rounded-2xl w-full" />
          ))}
        </div>
      ) : (
        // Wishlist Variants Grid
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {variants.map((variant) => {
              const priceNum =
                typeof variant.price === 'string' ? parseFloat(variant.price) : variant.price;
              const saleNum = variant.sale_price
                ? typeof variant.sale_price === 'string'
                  ? parseFloat(variant.sale_price)
                  : variant.sale_price
                : null;
              const isAddingThis = isAdding && updatingVariantId === variant.id;
              const isRx = variant.is_prescription_required;

              // Image resolution
              const imageList = variant.variant_images || (variant as any).images || [];
              const firstImage = imageList.length > 0 ? imageList[0].image_url : null;
              const imageUrl = firstImage || variant.thumbnail;
              const productName = variant.product_name || variant.variant_name;

              return (
                <motion.div
                  key={variant.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="group relative bg-bg-card border border-bg-border hover:border-primary-500/50 rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-card hover:shadow-glow transition-all"
                >
                  <div>
                    {/* Top Action & Thumbnail */}
                    <div className="relative aspect-square w-full rounded-xl bg-bg-surface overflow-hidden flex items-center justify-center mb-3">
                      {imageUrl ? (
                        <img
                          src={
                            imageUrl.startsWith('http')
                              ? imageUrl
                              : `http://localhost:8000${imageUrl}`
                          }
                          alt={productName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-3 text-center text-content-muted">
                          <span className="text-2xl font-head font-bold text-primary-500/40">
                            Rx
                          </span>
                          <span className="text-[10px] mt-0.5">OneMed</span>
                        </div>
                      )}

                      {/* Discount Pill Badge */}
                      {saleNum && saleNum < priceNum && (
                        <div className="absolute top-2 left-2 z-10">
                          <span className="px-1.5 py-0.5 rounded bg-primary-600 text-white font-head font-extrabold text-[10px]">
                            {formatDiscount(priceNum, saleNum)}
                          </span>
                        </div>
                      )}

                      {/* Rx Badge */}
                      {isRx && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge variant="danger" className="gap-0.5 text-[9px] px-1.5 py-0.5">
                            <AlertCircle className="w-2.5 h-2.5" /> Rx
                          </Badge>
                        </div>
                      )}

                      {/* Remove Wishlist Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveFromWishlist(variant.id, productName)}
                        className="absolute bottom-2 right-2 p-2 rounded-full bg-black/60 hover:bg-red-500 text-white transition-colors z-10 shadow-md cursor-pointer"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {variant.brand_name && (
                          <span className="text-[10px] uppercase font-bold text-primary-400 tracking-wider">
                            {variant.brand_name}
                          </span>
                        )}
                        <span className="text-[10px] text-content-muted">
                          SKU: {variant.sku}
                        </span>
                      </div>

                      <Link
                        to={`/variants/${variant.id}`}
                        className="font-head font-bold text-sm text-content-primary hover:text-primary-400 transition-colors line-clamp-1 block"
                      >
                        {productName}
                      </Link>

                      <p className="text-xs text-content-secondary line-clamp-1">
                        {variant.variant_name}
                      </p>
                    </div>
                  </div>

                  {/* Price & Add to Cart */}
                  <div className="mt-4 pt-3 border-t border-bg-border/60 space-y-3">
                    <div className="flex items-baseline gap-2">
                      {saleNum && saleNum < priceNum ? (
                        <>
                          <span className="font-mono font-bold text-accent-400 text-sm">
                            {formatCurrency(saleNum)}
                          </span>
                          <span className="font-mono text-xs text-content-muted line-through">
                            {formatCurrency(priceNum)}
                          </span>
                        </>
                      ) : (
                        <span className="font-mono font-bold text-content-primary text-sm">
                          {formatCurrency(priceNum)}
                        </span>
                      )}
                    </div>

                    <Button
                      onClick={() => handleAddToCart(variant)}
                      loading={isAddingThis}
                      variant="primary"
                      size="sm"
                      className="w-full rounded-xl gap-2 font-bold text-xs py-2 shadow-glow"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add To Cart</span>
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
