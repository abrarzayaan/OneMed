import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Truck,
  PackageX,
  Sparkles,
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency } from '@/utils/formatCurrency';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';

export default function CartPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  const isPartnerUser = Boolean(
    user?.role && (user.role.toLowerCase() === 'vendor' || user.role.toLowerCase() === 'rider')
  );
  const isConsumerLoggedIn = isLoggedIn && !isPartnerUser;

  const {
    cart,
    isLoading,
    updateItem,
    isUpdating,
    updatingVariantId,
    removeItem,
    isRemoving,
    removingVariantId,
    clearCart,
    isClearing,
  } = useCart();

  const items = cart?.items || [];
  const hasPrescriptionItem = items.some((i) => i.is_prescription_required);

  if (!isConsumerLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto bg-bg-card border border-bg-border rounded-2xl p-8 space-y-4 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-primary-600/20 text-primary-400 mx-auto flex items-center justify-center">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="font-head font-bold text-xl text-content-primary">
            Please Log In to View Your Cart
          </h2>
          <p className="text-xs text-content-secondary">
            Your shopping cart is saved in your OneMed account. Sign in to access your items.
          </p>
          <Button
            onClick={() => navigate('/login')}
            variant="primary"
            size="md"
            className="w-full rounded-full gap-2 font-bold"
          >
            Log In Now <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

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
            <span className="text-primary-400 font-medium">Cart</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="font-head text-2xl sm:text-3xl font-extrabold text-content-primary">
              Shopping Cart
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-600/20 text-primary-400 text-xs font-bold border border-primary-500/30">
              {cart?.total_items || 0} {cart?.total_items === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>

        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-xs text-content-secondary hover:text-primary-400 font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Link>
      </div>

      {isLoading ? (
        // Skeleton Loading State
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-20 rounded-2xl w-full" />
            <Skeleton className="h-20 rounded-2xl w-full" />
            <Skeleton className="h-20 rounded-2xl w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 rounded-2xl w-full" />
          </div>
        </div>
      ) : items.length === 0 ? (
        // Empty State
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto py-16 text-center space-y-6 bg-bg-card border border-bg-border rounded-3xl p-8 shadow-card"
        >
          <div className="w-20 h-20 rounded-3xl bg-bg-surface border border-bg-border flex items-center justify-center text-content-muted mx-auto">
            <PackageX className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="font-head font-bold text-xl text-content-primary">
              Your Cart is Currently Empty
            </h3>
            <p className="text-xs text-content-secondary">
              Discover generic medicines, personal care, baby healthcare, and OTC essentials.
            </p>
          </div>
          <Button
            onClick={() => navigate('/products')}
            variant="primary"
            size="md"
            className="rounded-full px-8 gap-2 font-bold shadow-glow"
          >
            Browse Products <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      ) : (
        // Cart Layout (Items + Summary)
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Cart Items Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prescription Item Notice */}
            {hasPrescriptionItem && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-amber-200 text-xs">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-300">Prescription Required Items Detected</h4>
                  <p className="mt-1 text-amber-200/80">
                    Your cart contains medicines requiring a valid doctor prescription. You can attach or verify your prescription during checkout.
                  </p>
                </div>
              </div>
            )}

            {/* Items List Table / Cards */}
            <div className="bg-bg-card border border-bg-border rounded-3xl overflow-hidden shadow-card">
              <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-bg-border bg-bg-surface/50 text-xs font-semibold text-content-muted">
                <div className="col-span-6">Product Details</div>
                <div className="col-span-2 text-center">Unit Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Subtotal</div>
              </div>

              <div className="divide-y divide-bg-border/60">
                {items.map((item) => {
                  const isItemUpdating = isUpdating && updatingVariantId === item.variant_id;
                  const isItemRemoving = isRemoving && removingVariantId === item.variant_id;

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`p-4 sm:p-5 flex flex-col md:grid md:grid-cols-12 gap-4 items-center ${
                        isItemRemoving ? 'opacity-40 pointer-events-none' : ''
                      }`}
                    >
                      {/* Product Details (Col 6) */}
                      <div className="w-full md:col-span-6 flex items-center gap-3">
                        <Link
                          to={`/variants/${item.variant_id}`}
                          className="w-16 h-16 rounded-xl bg-bg-surface border border-bg-border flex items-center justify-center font-head font-bold text-xs text-primary-400 shrink-0 hover:border-primary-500 transition-colors"
                        >
                          Rx
                        </Link>
                        <div className="space-y-1 min-w-0 flex-1">
                          <Link
                            to={`/variants/${item.variant_id}`}
                            className="font-head font-semibold text-sm text-content-primary hover:text-primary-400 transition-colors line-clamp-1"
                          >
                            {item.product_name}
                          </Link>
                          <p className="text-xs text-content-secondary truncate">
                            {item.variant_name} • <span className="font-mono text-content-muted">SKU: {item.sku}</span>
                          </p>
                          {item.is_prescription_required && (
                            <Badge variant="danger" className="text-[10px] py-0 px-1.5 inline-flex gap-1">
                              <AlertCircle className="w-2.5 h-2.5" /> Rx Required
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Unit Price (Col 2) */}
                      <div className="w-full md:col-span-2 flex justify-between md:justify-center items-center text-xs font-mono text-content-secondary">
                        <span className="md:hidden text-content-muted font-sans text-xs">Unit Price:</span>
                        <span>{formatCurrency(item.unit_price)}</span>
                      </div>

                      {/* Quantity Stepper (Col 2) */}
                      <div className="w-full md:col-span-2 flex justify-between md:justify-center items-center">
                        <span className="md:hidden text-content-muted text-xs">Quantity:</span>
                        <div className="flex items-center bg-bg-surface border border-bg-border rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.quantity > 1) {
                                updateItem({ variantId: item.variant_id, quantity: item.quantity - 1 });
                              } else {
                                removeItem(item.variant_id);
                              }
                            }}
                            disabled={isItemUpdating}
                            className="w-7 h-7 rounded-lg bg-bg-card hover:bg-bg-border text-content-secondary flex items-center justify-center text-xs transition-colors disabled:opacity-50"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center font-mono text-xs font-bold text-content-primary">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateItem({ variantId: item.variant_id, quantity: item.quantity + 1 })
                            }
                            disabled={isItemUpdating}
                            className="w-7 h-7 rounded-lg bg-bg-card hover:bg-bg-border text-content-secondary flex items-center justify-center text-xs transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Line Subtotal & Remove (Col 2) */}
                      <div className="w-full md:col-span-2 flex items-center justify-between md:justify-end gap-3 text-right">
                        <span className="md:hidden text-content-muted text-xs">Subtotal:</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-accent-400">
                            {formatCurrency(item.total_price)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(item.variant_id)}
                            disabled={isItemRemoving}
                            className="text-content-muted hover:text-red-400 p-1.5 rounded-lg hover:bg-bg-surface transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Card Footer Toolbar */}
              <div className="p-4 bg-bg-surface/50 border-t border-bg-border flex items-center justify-between">
                <Button
                  onClick={() => navigate('/products')}
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2 text-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
                </Button>
                <Button
                  onClick={() => clearCart()}
                  loading={isClearing}
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-1.5 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                </Button>
              </div>
            </div>
          </div>

          {/* Sticky Order Summary Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="bg-bg-card border border-bg-border rounded-3xl p-6 shadow-card space-y-6">
              <h2 className="font-head font-bold text-lg text-content-primary pb-3 border-b border-bg-border">
                Order Summary
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-content-secondary">
                  <span>Subtotal ({cart?.total_items || 0} items)</span>
                  <span className="font-mono text-content-primary font-bold">
                    {formatCurrency(cart?.total_price || 0)}
                  </span>
                </div>

                <div className="flex justify-between text-content-secondary">
                  <span>Estimated Delivery</span>
                  <span className="text-accent-400 font-semibold">Calculated at checkout</span>
                </div>

                <div className="flex justify-between text-content-secondary">
                  <span>Vat / Tax</span>
                  <span className="text-content-muted">Included</span>
                </div>

                <div className="pt-3 border-t border-bg-border flex justify-between items-baseline">
                  <span className="font-head font-bold text-sm text-content-primary">Total</span>
                  <span className="font-mono font-extrabold text-xl text-accent-400">
                    {formatCurrency(cart?.total_price || 0)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={() => navigate('/checkout')}
                variant="primary"
                size="lg"
                className="w-full rounded-2xl font-bold py-3.5 gap-2 shadow-glow text-sm"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Button>

              {/* Micro Perks */}
              <div className="pt-4 border-t border-bg-border/60 space-y-3 text-[11px] text-content-secondary">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-primary-400 shrink-0" />
                  <span>Priority express delivery available nationwide</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-accent-400 shrink-0" />
                  <span>100% Genuine, verified pharmaceutical products</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Earn OneMed reward points on every order</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
