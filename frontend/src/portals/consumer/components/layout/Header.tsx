import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  Heart,
  User as UserIcon,
  Phone,
  ChevronDown,
  ChevronRight,
  Menu,
  LogOut,
  Package,
  MapPin,
  Flame,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { useCategoryModalStore } from '@/store/categoryModal.store';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/api/products.api';
import { adminCmsApi } from '@/portals/admin/api/adminCms.api';
import type { Category } from '@/types/product.types';
import ThemeSelector from './ThemeSelector';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, logout } = useAuthStore();
  const isPartnerUser = Boolean(
    user?.role && (user.role.toLowerCase() === 'vendor' || user.role.toLowerCase() === 'rider')
  );
  const isConsumerLoggedIn = isLoggedIn && !isPartnerUser;
  const itemCount = useCartStore((s) => s.itemCount);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const openCategoryModal = useCategoryModalStore((s) => s.openModal);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [activeHoverCat, setActiveHoverCat] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCatExpanded, setMobileCatExpanded] = useState<number | null>(null);

  // Active navigation helper
  const isNavActive = (path: string, filterParam?: string) => {
    if (filterParam) {
      return location.pathname === path && location.search.includes(`filter=${filterParam}`);
    }
    if (path === '/') return location.pathname === '/' && !location.search;
    return location.pathname === path && !location.search;
  };

  // Fetch categories with caching
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await productsApi.getCategories();
      const raw = res.data;
      if (Array.isArray(raw)) return raw;
      return (raw as any).results || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const topLevelCategories = (categories || []).filter((c: any) => !c.parent);

  // Fetch CMS Announcement Bar
  const { data: announcement } = useQuery({
    queryKey: ['cms-announcement'],
    queryFn: () => adminCmsApi.getAnnouncementBar(),
    staleTime: 1000 * 30,
  });

  const announcementBgClass =
    announcement && announcement.bg_theme
      ? {
          midnight: 'bg-primary-950/90 border-primary-900/50 text-primary-200',
          emerald: 'bg-emerald-950/90 border-emerald-900/50 text-emerald-200',
          indigo: 'bg-indigo-950/90 border-indigo-900/50 text-indigo-200',
          rose: 'bg-rose-950/90 border-rose-900/50 text-rose-200',
          amber: 'bg-amber-950/90 border-amber-900/50 text-amber-200',
        }[announcement.bg_theme] || 'bg-primary-950/90 border-primary-900/50 text-primary-200'
      : 'bg-primary-950/90 border-primary-900/50 text-primary-200';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedCat) params.set('category', selectedCat);
    navigate(`/products?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-bg-base/95 backdrop-blur-md border-b border-bg-border shadow-sm">
      {/* ── TOP ANNOUNCEMENT BAR ── */}
      {announcement?.is_active !== false && (
        <div className={`${announcementBgClass} border-b py-1.5 px-4 text-[11px] text-content-secondary transition-colors`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <p className="truncate font-medium">
              {announcement?.text ||
                'Due to high medicine demand, orders are processed with priority express delivery across Bangladesh.'}
            </p>

            <div className="hidden lg:flex items-center gap-4 shrink-0 font-medium">
              <Link to="/products" className="hover:text-content-primary transition-colors">About Us</Link>
              <span>|</span>
              <Link to="/products" className="hover:text-content-primary transition-colors">FAQs</Link>
              <span>|</span>
              <Link to={announcement?.cta_url || '/account/orders'} className="hover:text-content-primary transition-colors text-accent-400 font-bold">
                {announcement?.cta_text || 'Track Order'}
              </Link>
              <span>|</span>
              {isConsumerLoggedIn ? (
                <span className="text-accent-400 font-bold">
                  Hello, {user?.first_name ? user.first_name : user?.phone}
                </span>
              ) : (
                <Link to="/login" className="hover:text-content-primary transition-colors">My Account</Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN HEADER ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3 flex items-center justify-between gap-2">
        {/* Mobile Menu Hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="md:hidden p-1.5 rounded-xl bg-bg-card border border-bg-border text-content-secondary shrink-0"
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <img src="/onemed-logo.png" alt="OneMed" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover shadow-glow shrink-0" />
          <div className="min-w-0">
            <span className="font-head font-extrabold text-sm sm:text-2xl text-content-primary tracking-tight truncate block">
              One<span className="text-primary-400">Med</span>
            </span>
            <span className="hidden sm:block text-[9px] text-content-muted -mt-1 font-semibold tracking-wider uppercase">
              Healthcare & Pharmacy
            </span>
          </div>
        </Link>

        {/* Search Bar with Category Selector */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex items-center flex-1 max-w-xl bg-bg-card border border-bg-border rounded-full p-1 shadow-sm focus-within:border-primary-500 transition-all"
        >
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="bg-transparent text-content-secondary text-xs font-medium px-4 py-2 border-r border-bg-border focus:outline-none cursor-pointer max-w-[130px] truncate"
          >
            <option value="" className="bg-bg-card text-content-primary">All Categories</option>
            {topLevelCategories.map((c: any) => (
              <option key={c.id} value={c.id} className="bg-bg-card text-content-primary">
                {c.name}
              </option>
            ))}

          </select>

          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent px-4 py-1.5 text-xs text-content-primary placeholder:text-content-muted focus:outline-none"
          />

          <button
            type="submit"
            aria-label="Search"
            className="w-8 h-8 rounded-full bg-primary-600 hover:bg-primary-500 text-white flex items-center justify-center transition-colors mr-1"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Right Section Icons */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          <div className="hidden xl:flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent-500/10 text-accent-400 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div className="text-left leading-tight">
              <span className="text-[9px] text-content-muted uppercase font-semibold">Need Help?</span>
              <p className="text-xs font-extrabold text-content-primary">+880 1334-317864</p>
            </div>
          </div>

          <Link
            to="/wishlist"
            className="relative p-1.5 sm:p-2 text-content-secondary hover:text-content-primary transition-colors"
            title="Wishlist"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-red-500 text-white text-[8px] sm:text-[9px] font-bold flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={openDrawer}
            aria-label="Open cart drawer"
            className="flex items-center gap-1.5 bg-bg-card border border-bg-border hover:border-primary-500/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-content-primary transition-all cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-primary-400" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-accent-500 text-bg-base text-[8px] sm:text-[9px] font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </div>
            <div className="text-left leading-none hidden sm:block">
              <span className="text-[9px] text-content-muted font-medium">Cart</span>
              <p className="text-xs font-extrabold text-primary-400 mt-0.5">{itemCount}</p>
            </div>
          </button>

          {/* Theme Selector Dropdown */}
          <div className="hidden xs:block">
            <ThemeSelector />
          </div>

          {isConsumerLoggedIn ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="w-8 h-8 rounded-full bg-primary-600/30 border border-primary-500/50 text-primary-300 font-bold text-xs flex items-center justify-center uppercase hover:ring-2 hover:ring-primary-500/50 transition-all"
              >
                {user?.first_name ? user.first_name[0].toUpperCase() : user?.phone?.[0] ?? 'U'}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-bg-card border border-bg-border rounded-2xl shadow-card py-2 z-50">
                  <div className="px-3 py-2 border-b border-bg-border">
                    <p className="text-xs font-bold text-content-primary truncate">
                      {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user?.username || 'Valued User')}
                    </p>
                    <p className="text-[10px] text-content-muted font-mono truncate">{user?.phone}</p>
                    {Boolean(user?.is_superuser || user?.is_staff || user?.role === 'SUPERADMIN' || user?.role === 'ADMIN') && (
                      <span className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 font-mono font-bold border border-primary-500/30">
                        {user?.staff_role || (user?.is_superuser ? 'Super Admin' : 'Staff Admin')}
                      </span>
                    )}
                  </div>
                  {Boolean(user?.is_superuser || user?.is_staff || user?.role === 'SUPERADMIN' || user?.role === 'ADMIN') && (
                    <Link
                      to="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-primary-400 hover:bg-primary-500/10 transition-colors font-bold border-b border-bg-border"
                    >
                      <Sparkles className="w-4 h-4 text-primary-400" /> Admin Portal Dashboard
                    </Link>
                  )}
                  <Link
                    to="/account/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-content-secondary hover:text-content-primary hover:bg-bg-surface transition-colors font-medium"
                  >
                    <UserIcon className="w-4 h-4 text-primary-400" /> My Profile
                  </Link>
                  <Link
                    to="/account/orders"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-content-secondary hover:text-content-primary hover:bg-bg-surface transition-colors font-medium"
                  >
                    <Package className="w-4 h-4 text-primary-400" /> My Orders
                  </Link>
                  <Link
                    to="/account/addresses"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-content-secondary hover:text-content-primary hover:bg-bg-surface transition-colors font-medium"
                  >
                    <MapPin className="w-4 h-4 text-primary-400" /> Delivery Addresses
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-bg-surface transition-colors border-t border-bg-border font-medium"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login">
              <div className="w-8 h-8 rounded-full bg-bg-card border border-bg-border text-content-secondary hover:text-content-primary flex items-center justify-center transition-colors">
                <UserIcon className="w-4 h-4" />
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* ── SECONDARY NAVIGATION BAR (SHOP BY CATEGORIES HOVER FLYOUT) ── */}
      <div className="border-t border-bg-border/60 bg-bg-card/40 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-11">
          {/* Shop By Categories Dropdown triggering on HOVER & CLICK */}
          <div
            className="relative"
            onMouseEnter={() => setCatMenuOpen(true)}
            onMouseLeave={() => {
              setCatMenuOpen(false);
              setActiveHoverCat(null);
            }}
          >
            <button
              type="button"
              onClick={() => setCatMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-head font-bold text-xs transition-colors shadow-glow"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>Shop By Categories</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${catMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Hover Mega Category & Subcategory Flyout Menu */}
            {catMenuOpen && (
              <div className="absolute left-0 mt-1 flex z-50">
                {/* Main Categories Panel */}
                <div className="w-64 bg-bg-card border border-bg-border rounded-2xl shadow-card p-2 space-y-1">
                  {topLevelCategories.map((cat: any) => {
                    const hasChildren = cat.children && cat.children.length > 0;
                    const isHovered = activeHoverCat === cat.id;
                    return (
                      <div
                        key={cat.id}
                        onMouseEnter={() => setActiveHoverCat(cat.id)}
                        className="relative"
                      >
                        <Link
                          to={`/products?category=${cat.id}`}
                          onClick={() => setCatMenuOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${isHovered
                            ? 'bg-primary-600/20 text-primary-400 font-semibold'
                            : 'text-content-secondary hover:text-content-primary hover:bg-bg-surface'
                            }`}
                        >
                          <span className="truncate">{cat.name}</span>
                          {hasChildren && <ChevronRight className="w-3.5 h-3.5 text-primary-400" />}
                        </Link>
                      </div>
                    );
                  })}
                </div>

                {/* Nested Subcategories Sub-Panel */}
                {activeHoverCat && (
                  <div className="w-60 bg-bg-card border border-bg-border rounded-2xl shadow-card p-2 space-y-1 ml-1 self-start max-h-80 overflow-y-auto custom-scrollbar">
                    {categories
                      .find((c: any) => c.id === activeHoverCat)
                      ?.children?.map((sub: any) => (
                        <Link
                          key={sub.id}
                          to={`/products?subcategory=${sub.id}`}
                          onClick={() => {
                            setCatMenuOpen(false);
                            setActiveHoverCat(null);
                          }}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-content-secondary hover:text-primary-400 hover:bg-bg-surface transition-colors"
                        >
                          <span>{sub.name}</span>
                          <ChevronRight className="w-3 h-3 text-content-muted" />
                        </Link>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Links with Active State Highlighting */}
          <nav className="flex items-center gap-6 text-xs font-semibold">
            <Link
              to="/"
              className={`transition-colors ${isNavActive('/')
                ? 'text-primary-400 font-bold border-b-2 border-primary-400 py-1'
                : 'text-content-secondary hover:text-content-primary'
                }`}
            >
              Home
            </Link>
            <Link
              to="/products"
              className={`transition-colors ${isNavActive('/products')
                ? 'text-primary-400 font-bold border-b-2 border-primary-400 py-1'
                : 'text-content-secondary hover:text-content-primary'
                }`}
            >
              Shop All
            </Link>
            <Link
              to="/products?filter=hot_deals"
              className={`flex items-center gap-1 transition-colors ${isNavActive('/products', 'hot_deals')
                ? 'text-primary-400 font-bold border-b-2 border-primary-400 py-1'
                : 'text-content-secondary hover:text-content-primary'
                }`}
            >
              Hot Deals
              <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-bold flex items-center gap-0.5 animate-pulse">
                <Flame className="w-2.5 h-2.5" /> HOT
              </span>
            </Link>
            <Link
              to="/products?filter=best_selling"
              className={`flex items-center gap-1 transition-colors ${isNavActive('/products', 'best_selling')
                ? 'text-primary-400 font-bold border-b-2 border-primary-400 py-1'
                : 'text-content-secondary hover:text-content-primary'
                }`}
            >
              Best Selling
              <span className="px-1.5 py-0.5 rounded bg-accent-500/20 text-accent-400 text-[9px] font-bold">
                BEST
              </span>
            </Link>
            <Link
              to="/products?filter=flash_sale"
              className={`flex items-center gap-1 transition-colors ${isNavActive('/products', 'flash_sale')
                ? 'text-primary-400 font-bold border-b-2 border-primary-400 py-1'
                : 'text-content-secondary hover:text-content-primary'
                }`}
            >
              Flash Sale
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold">
                ⚡ FLASH
              </span>
            </Link>
          </nav>
        </div>
      </div>

      {/* ── MOBILE MENU DRAWER ── */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-bg-card border-t border-bg-border px-4 py-4 space-y-4 shadow-card max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Mobile Search Bar */}
          <form onSubmit={handleSearch} className="flex items-center bg-bg-surface border border-bg-border rounded-full p-1">
            <input
              type="text"
              placeholder="Search medicines, health products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent px-3 py-1 text-xs text-content-primary placeholder:text-content-muted focus:outline-none"
            />
            <button
              type="submit"
              className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center mr-0.5"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Dedicated Shop by Categories Mobile Accordion / Drawer Section */}
          <div className="space-y-2 pt-1 border-b border-bg-border pb-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                Shop By Categories
              </span>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  useCategoryModalStore.getState().openModal();
                }}
                className="text-[11px] font-bold text-primary-400 hover:underline"
              >
                View Dual View
              </button>
            </div>

            {/* Collapsible Mobile Category List */}
            <div className="space-y-1">
              {categories.map((cat: any) => {
                const isExpanded = mobileCatExpanded === cat.id;
                const hasChildren = cat.children && cat.children.length > 0;
                return (
                  <div key={cat.id} className="rounded-xl border border-bg-border/60 bg-bg-surface/40 overflow-hidden">
                    <div className="flex items-center justify-between p-2 px-3">
                      <Link
                        to={`/products?category=${cat.id}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-xs font-semibold text-content-primary hover:text-primary-400 truncate flex-1"
                      >
                        {cat.name}
                      </Link>

                      {hasChildren && (
                        <button
                          type="button"
                          onClick={() => setMobileCatExpanded(isExpanded ? null : cat.id)}
                          className="p-1 text-content-muted hover:text-content-primary transition-transform"
                        >
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90 text-primary-400' : ''}`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Nested Subcategories for Mobile */}
                    {isExpanded && hasChildren && (
                      <div className="bg-bg-card/70 border-t border-bg-border/60 p-2 pl-4 space-y-1">
                        {cat.children.map((sub: any) => (
                          <Link
                            key={sub.id}
                            to={`/products?subcategory=${sub.id}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block py-1 px-2 text-xs text-content-secondary hover:text-primary-400 hover:bg-bg-surface rounded-lg transition-colors flex items-center justify-between"
                          >
                            <span>{sub.name}</span>
                            <ChevronRight className="w-3 h-3 text-content-muted" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <nav className="flex flex-col space-y-1 text-xs font-semibold">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-xl transition-colors ${isNavActive('/') ? 'bg-primary-600/20 text-primary-400 font-bold' : 'text-content-secondary hover:bg-bg-surface'
                }`}
            >
              Home Page
            </Link>
            <Link
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-xl transition-colors ${isNavActive('/products') ? 'bg-primary-600/20 text-primary-400 font-bold' : 'text-content-secondary hover:bg-bg-surface'
                }`}
            >
              Shop All Products
            </Link>
            <Link
              to="/products?filter=hot_deals"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${isNavActive('/products', 'hot_deals') ? 'bg-primary-600/20 text-primary-400 font-bold' : 'text-content-secondary hover:bg-bg-surface'
                }`}
            >
              <span>Hot Deals</span>
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold flex items-center gap-1">
                <Flame className="w-3 h-3" /> HOT
              </span>
            </Link>
            <Link
              to="/products?filter=best_selling"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${isNavActive('/products', 'best_selling') ? 'bg-primary-600/20 text-primary-400 font-bold' : 'text-content-secondary hover:bg-bg-surface'
                }`}
            >
              <span>Best Selling Products</span>
              <span className="px-2 py-0.5 rounded bg-accent-500/20 text-accent-400 text-[10px] font-bold">
                BEST
              </span>
            </Link>
            <Link
              to="/products?filter=flash_sale"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${isNavActive('/products', 'flash_sale') ? 'bg-primary-600/20 text-primary-400 font-bold' : 'text-content-secondary hover:bg-bg-surface'
                }`}
            >
              <span>Flash Sale Products</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                ⚡ FLASH
              </span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
