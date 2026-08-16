import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ProductVariantItem } from '@/types/product.types';
import { useWishlistStore } from '@/store/wishlist.store';
import { useAuthStore } from '@/store/auth.store';
import { useCart } from '@/hooks/useCart';
import { formatCurrency, formatDiscount } from '@/utils/formatCurrency';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface VariantCardProps {
  variant: ProductVariantItem;
  showTimer?: boolean;
}

export default function VariantCard({ variant, showTimer = false }: VariantCardProps) {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  const isPartnerUser = Boolean(
    user?.role && (user.role.toLowerCase() === 'vendor' || user.role.toLowerCase() === 'rider')
  );
  const isConsumerLoggedIn = isLoggedIn && !isPartnerUser;

  const { toggle, isWishlisted } = useWishlistStore();
  const wishlisted = isWishlisted(variant.id);
  const { addItem, isAdding, updatingVariantId } = useCart();
  const adding = isAdding && updatingVariantId === variant.id;

  const priceNum = typeof variant.price === 'string' ? parseFloat(variant.price) : variant.price;
  const saleNum = variant.sale_price ? (typeof variant.sale_price === 'string' ? parseFloat(variant.sale_price) : variant.sale_price) : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isConsumerLoggedIn) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    addItem({ variantId: variant.id, quantity: 1 });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(variant.id);
    if (!wishlisted) {
      toast.success('Added to wishlist ❤️');
    } else {
      toast('Removed from wishlist', { icon: '💔' });
    }
  };

  return (
    <div className="group relative bg-bg-card border border-bg-border hover:border-primary-500/50 rounded-2xl p-3 flex flex-col justify-between overflow-hidden shadow-card hover:shadow-glow transition-all duration-200">
      <Link to={`/variants/${variant.id}`} className="block space-y-2.5">
        {/* Image Container with Badges */}
        <div className="relative aspect-square w-full rounded-xl bg-bg-surface overflow-hidden flex items-center justify-center">
          {variant.thumbnail ? (
            <img
              src={variant.thumbnail.startsWith('http') ? variant.thumbnail : `http://localhost:8000${variant.thumbnail}`}
              alt={variant.product_name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-3 text-center text-content-muted">
              <span className="text-2xl font-head font-bold text-primary-500/40">Rx</span>
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
          {variant.is_prescription_required && (
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="danger" className="gap-0.5 text-[9px] px-1.5 py-0.5">
                <AlertCircle className="w-2.5 h-2.5" /> Rx
              </Badge>
            </div>
          )}

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label="Toggle wishlist"
            className="absolute bottom-2 right-2 p-1.5 rounded-full bg-bg-card/80 backdrop-blur-md border border-bg-border text-content-secondary hover:text-red-400 transition-colors z-10"
          >
            <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        </div>

        {/* Flash Deal Countdown Timer */}
        {showTimer && (
          <div className="py-1 px-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <span className="font-mono text-[10px] font-bold text-red-400">
              86d : 10h : 18m : 01s
            </span>
          </div>
        )}

        {/* Info */}
        <div className="space-y-1 min-h-[58px]">
          <h3 className="font-head font-semibold text-content-primary text-xs line-clamp-2 leading-snug group-hover:text-primary-400 transition-colors">
            {variant.product_name}
          </h3>
          {variant.variant_name && (
            <span className="text-[11px] font-medium text-primary-400/90 block font-sans truncate">
              {variant.variant_name}
            </span>
          )}

          {/* Star Rating */}
          <div className="flex items-center gap-1 pt-0.5">
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
        </div>
      </Link>

      {/* Price & Add To Cart Button */}
      <div className="mt-2 pt-2 border-t border-bg-border/60 space-y-2">
        <div className="flex items-baseline gap-1.5">
          {saleNum && saleNum < priceNum ? (
            <>
              <span className="font-mono font-bold text-accent-400 text-sm">
                {formatCurrency(saleNum)}
              </span>
              <span className="font-mono text-[10px] text-content-muted line-through">
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
          type="button"
          variant="outline"
          size="sm"
          loading={adding}
          onClick={handleAddToCart}
          className="w-full rounded-full gap-1.5 text-[11px] font-bold hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all py-1"
        >
          <ShoppingCart className="w-3 h-3" />
          <span>Add To Cart</span>
        </Button>
      </div>
    </div>
  );
}
