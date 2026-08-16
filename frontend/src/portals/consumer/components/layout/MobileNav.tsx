import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, ShoppingCart, Package, User } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { useCategoryModalStore } from '@/store/categoryModal.store';
import { motion } from 'framer-motion';

export default function MobileNav() {
  const { pathname } = useLocation();
  const itemCount = useCartStore((s) => s.itemCount);
  const openCategoryModal = useCategoryModalStore((s) => s.openModal);
  const isCategoryModalOpen = useCategoryModalStore((s) => s.isOpen);

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 inset-x-0 z-50 bg-bg-surface/95 backdrop-blur-md border-t border-bg-border md:hidden"
    >
      <div className="flex items-center justify-around h-16 px-1">
        {/* Home */}
        <Link
          to="/"
          aria-label="Home"
          className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors"
        >
          <Home
            className={`h-5 w-5 transition-colors ${
              pathname === '/' && !isCategoryModalOpen ? 'text-primary-400' : 'text-content-muted'
            }`}
          />
          <span
            className={`text-[10px] font-medium transition-colors ${
              pathname === '/' && !isCategoryModalOpen ? 'text-primary-400' : 'text-content-muted'
            }`}
          >
            Home
          </span>
          {pathname === '/' && !isCategoryModalOpen && (
            <motion.div
              layoutId="mobile-nav-indicator"
              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary-500 rounded-full"
            />
          )}
        </Link>

        {/* Categories (Opens Split-Screen Categories Modal) */}
        <button
          type="button"
          onClick={openCategoryModal}
          aria-label="Categories"
          className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors"
        >
          <Grid
            className={`h-5 w-5 transition-colors ${
              isCategoryModalOpen ? 'text-primary-400 font-bold animate-pulse' : 'text-content-muted'
            }`}
          />
          <span
            className={`text-[10px] font-medium transition-colors ${
              isCategoryModalOpen ? 'text-primary-400 font-bold' : 'text-content-muted'
            }`}
          >
            Categories
          </span>
          {isCategoryModalOpen && (
            <motion.div
              layoutId="mobile-nav-indicator"
              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary-500 rounded-full"
            />
          )}
        </button>

        {/* Cart */}
        <Link
          to="/cart"
          aria-label="Cart"
          className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors"
        >
          <div className="relative">
            <ShoppingCart
              className={`h-5 w-5 transition-colors ${
                pathname === '/cart' && !isCategoryModalOpen ? 'text-primary-400' : 'text-content-muted'
              }`}
            />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] font-medium transition-colors ${
              pathname === '/cart' && !isCategoryModalOpen ? 'text-primary-400' : 'text-content-muted'
            }`}
          >
            Cart
          </span>
          {pathname === '/cart' && !isCategoryModalOpen && (
            <motion.div
              layoutId="mobile-nav-indicator"
              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary-500 rounded-full"
            />
          )}
        </Link>

        {/* Orders */}
        <Link
          to="/account/orders"
          aria-label="Orders"
          className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors"
        >
          <Package
            className={`h-5 w-5 transition-colors ${
              pathname.startsWith('/account/orders') && !isCategoryModalOpen ? 'text-primary-400' : 'text-content-muted'
            }`}
          />
          <span
            className={`text-[10px] font-medium transition-colors ${
              pathname.startsWith('/account/orders') && !isCategoryModalOpen ? 'text-primary-400' : 'text-content-muted'
            }`}
          >
            Orders
          </span>
          {pathname.startsWith('/account/orders') && !isCategoryModalOpen && (
            <motion.div
              layoutId="mobile-nav-indicator"
              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary-500 rounded-full"
            />
          )}
        </Link>

        {/* Profile */}
        <Link
          to="/account/profile"
          aria-label="Profile"
          className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors"
        >
          <User
            className={`h-5 w-5 transition-colors ${
              pathname.startsWith('/account/profile') && !isCategoryModalOpen ? 'text-primary-400' : 'text-content-muted'
            }`}
          />
          <span
            className={`text-[10px] font-medium transition-colors ${
              pathname.startsWith('/account/profile') && !isCategoryModalOpen ? 'text-primary-400' : 'text-content-muted'
            }`}
          >
            Profile
          </span>
          {pathname.startsWith('/account/profile') && !isCategoryModalOpen && (
            <motion.div
              layoutId="mobile-nav-indicator"
              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary-500 rounded-full"
            />
          )}
        </Link>
      </div>
    </nav>
  );
}
