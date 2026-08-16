import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
  PackageX,
} from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { useCart } from '@/hooks/useCart';
import { formatCurrency } from '@/utils/formatCurrency';
import Button from '@/components/ui/Button';

export default function CartDrawer() {
  const navigate = useNavigate();
  const { isDrawerOpen, closeDrawer } = useCartStore();
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

  const handleCheckout = () => {
    closeDrawer();
    navigate('/checkout');
  };

  const handleViewCart = () => {
    closeDrawer();
    navigate('/cart');
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-bg-card border-l border-bg-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-bg-border flex items-center justify-between bg-bg-surface/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-600/20 text-primary-400 border border-primary-500/30 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-head font-bold text-base text-content-primary">
                    Shopping Cart
                  </h2>
                  <p className="text-xs text-content-muted">
                    {cart?.total_items || 0} {cart?.total_items === 1 ? 'item' : 'items'} in your cart
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-bg-surface transition-colors"
                aria-label="Close cart drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Prescription Warning Banner */}
            {hasPrescriptionItem && (
              <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center gap-2 text-xs text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p>Cart includes prescription items. Rx verification required at checkout.</p>
              </div>
            )}

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
              {isLoading ? (
                // Skeleton Loader
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="p-3 bg-bg-surface border border-bg-border rounded-xl flex gap-3 animate-pulse"
                    >
                      <div className="w-16 h-16 rounded-lg bg-bg-border/60 shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 bg-bg-border/60 rounded w-3/4" />
                        <div className="h-3 bg-bg-border/60 rounded w-1/2" />
                        <div className="h-4 bg-bg-border/60 rounded w-1/4 pt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                // Empty Cart State
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-4">
                  <div className="w-20 h-20 rounded-2xl bg-bg-surface border border-bg-border flex items-center justify-center text-content-muted">
                    <PackageX className="w-10 h-10 text-content-muted" />
                  </div>
                  <div>
                    <h3 className="font-head font-bold text-lg text-content-primary">
                      Your Cart is Empty
                    </h3>
                    <p className="text-xs text-content-secondary max-w-xs mt-1">
                      Looks like you haven't added any medicines or healthcare products yet.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      closeDrawer();
                      navigate('/products');
                    }}
                    variant="primary"
                    size="md"
                    className="rounded-full gap-2 px-6"
                  >
                    Start Shopping <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                // Items List
                <div className="space-y-3">
                  {items.map((item) => {
                    const isItemUpdating = isUpdating && updatingVariantId === item.variant_id;
                    const isItemRemoving = isRemoving && removingVariantId === item.variant_id;

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-3 bg-bg-surface border border-bg-border rounded-2xl flex gap-3 group hover:border-primary-500/40 transition-all ${
                          isItemRemoving ? 'opacity-40 pointer-events-none' : ''
                        }`}
                      >
                        {/* Thumbnail Placeholder */}
                        <div className="w-16 h-16 rounded-xl bg-bg-card border border-bg-border flex items-center justify-center text-primary-400 shrink-0 font-head font-bold text-xs">
                          Rx
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-head font-semibold text-xs text-content-primary truncate">
                                {item.product_name}
                              </h4>
                              <p className="text-[11px] text-content-secondary truncate">
                                {item.variant_name} • SKU: {item.sku}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.variant_id)}
                              disabled={isItemRemoving}
                              className="text-content-muted hover:text-red-400 transition-colors p-1"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Stepper & Price */}
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-bg-border/40">
                            {/* Quantity Stepper */}
                            <div className="flex items-center bg-bg-card border border-bg-border rounded-lg p-0.5">
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
                                className="w-6 h-6 rounded bg-bg-surface hover:bg-bg-border text-content-secondary flex items-center justify-center text-xs transition-colors disabled:opacity-50"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center font-mono text-xs font-bold text-content-primary">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateItem({ variantId: item.variant_id, quantity: item.quantity + 1 })
                                }
                                disabled={isItemUpdating}
                                className="w-6 h-6 rounded bg-bg-surface hover:bg-bg-border text-content-secondary flex items-center justify-center text-xs transition-colors disabled:opacity-50"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Item Price Total */}
                            <div className="text-right font-mono">
                              <span className="text-xs font-bold text-accent-400">
                                {formatCurrency(item.total_price)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Clear Cart Link */}
                  {items.length > 0 && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => clearCart()}
                        disabled={isClearing}
                        className="text-[11px] text-content-muted hover:text-red-400 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Clear Cart
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Summary & Action Buttons */}
            {items.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-bg-border bg-bg-surface/80 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-content-secondary">
                    <span>Subtotal</span>
                    <span className="font-mono text-content-primary font-bold">
                      {formatCurrency(cart?.total_price || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-content-muted text-[11px]">
                    <span>Taxes & Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <Button
                    onClick={handleCheckout}
                    variant="primary"
                    size="md"
                    className="w-full rounded-xl font-bold gap-2 py-2.5 shadow-glow"
                  >
                    Proceed to Checkout <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handleViewCart}
                    variant="outline"
                    size="md"
                    className="w-full rounded-xl font-bold py-2 text-xs"
                  >
                    View Full Cart Page
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-content-muted pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent-400" />
                  <span>100% Genuine Medicines & Encrypted Checkout</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
