import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  MapPin,
  CreditCard,
  Wallet,
  Banknote,
  Truck,
  Tag,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Plus,
  Building2,
  Sparkles,
  Package,
  FileText,
  X,
  Phone,
  User,
  Home,
  Briefcase,
  Crosshair,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { profileApi } from '@/api/profile.api';
import { checkoutApi } from '@/api/checkout.api';
import { ordersApi } from '@/api/orders.api';
import { cartApi } from '@/api/cart.api';
import { productsApi } from '@/api/products.api';
import { useCartStore } from '@/store/cart.store';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import type { Address, CreateAddressPayload } from '@/types/address.types';

// Label Icons helper
const LABEL_ICONS: Record<string, React.ReactNode> = {
  home: <Home className="w-3.5 h-3.5" />,
  office: <Briefcase className="w-3.5 h-3.5" />,
  pharmacy: <Building2 className="w-3.5 h-3.5" />,
  other: <Crosshair className="w-3.5 h-3.5" />,
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const setItemCount = useCartStore((s) => s.setItemCount);

  // Check if direct Buy Now parameters are passed in URL
  const variantIdParam = searchParams.get('variant');
  const qtyParam = searchParams.get('qty');
  const isDirectCheckout = Boolean(variantIdParam && qtyParam);

  const variantId = variantIdParam ? parseInt(variantIdParam, 10) : null;
  const directQty = qtyParam ? parseInt(qtyParam, 10) : 1;

  // Local state
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD'>('COD');
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);

  // Address modal form state
  const [newAddress, setNewAddress] = useState<CreateAddressPayload>({
    label: 'home',
    receiver_name: '',
    receiver_phone: '',
    full_address: '',
    area: '',
    city: 'Dhaka',
    postal_code: '',
    landmark: '',
    is_default: false,
  });

  // 1. Fetch user addresses
  const { data: addresses = [], isLoading: isLoadingAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await profileApi.getAddresses();
      const raw = res.data;
      const list: Address[] = Array.isArray(raw) ? raw : (raw as any).results || [];
      return list.filter((a) => a.status !== 'hidden');
    },
  });

  // Set initial selected address (default address or first item)
  useEffect(() => {
    if (addresses.length > 0 && selectedAddressId === null) {
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  // 2. Fetch cart items if standard checkout
  const { data: cartData, isLoading: isLoadingCart } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await cartApi.getCart();
      return res.data;
    },
    enabled: !isDirectCheckout,
  });

  // 3. Fetch direct variant details if Buy Now checkout
  const { data: directVariantRes, isLoading: isLoadingDirectVariant } = useQuery({
    queryKey: ['variant', variantId],
    queryFn: async () => {
      if (!variantId) return null;
      const res = await productsApi.getVariant(variantId);
      return res.data;
    },
    enabled: isDirectCheckout && Boolean(variantId),
  });

  // 4. Preview pricing calculation query
  const {
    data: checkoutPreview,
    isLoading: isLoadingPreview,
  } = useQuery({
    queryKey: ['checkout-preview', selectedAddressId, appliedCoupon, isDirectCheckout, variantId, directQty],
    queryFn: async () => {
      if (!selectedAddressId) return null;
      if (isDirectCheckout && variantId) {
        const res = await checkoutApi.directPreview(
          variantId,
          directQty,
          selectedAddressId,
          appliedCoupon || undefined
        );
        return res.data;
      } else {
        const res = await checkoutApi.preview(
          selectedAddressId,
          appliedCoupon || undefined
        );
        return res.data;
      }
    },
    enabled: Boolean(selectedAddressId) && (!isDirectCheckout || Boolean(variantId)),
  });

  // Create address mutation
  const createAddressMutation = useMutation({
    mutationFn: async (payload: CreateAddressPayload) => {
      const res = await profileApi.createAddress(payload);
      return res.data;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setSelectedAddressId(created.id);
      setIsAddAddressModalOpen(false);
      toast.success('New delivery address added & selected! 📍');
      setNewAddress({
        label: 'home',
        receiver_name: '',
        receiver_phone: '',
        full_address: '',
        area: '',
        city: 'Dhaka',
        postal_code: '',
        landmark: '',
        is_default: false,
      });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Failed to add address.';
      toast.error(msg);
    },
  });

  // Coupon application handler
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) {
      toast.error('Please enter a valid coupon code.');
      return;
    }
    setAppliedCoupon(couponCodeInput.trim().toUpperCase());
    toast.success(`Coupon code "${couponCodeInput.trim().toUpperCase()}" applied!`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    toast.success('Coupon removed.');
  };

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAddressId) {
        toast.error('Please select or add a delivery address first.');
        throw new Error('Please select a delivery address.');
      }

      if (isDirectCheckout && variantId) {
        const res = await ordersApi.buyNow({
          product_variant_id: variantId,
          quantity: directQty,
          address_id: selectedAddressId,
          payment_method: 'COD',
          coupon_code: appliedCoupon || undefined,
          notes: deliveryNotes.trim() || undefined,
        });
        return res.data;
      } else {
        const res = await ordersApi.placeOrder({
          address_id: selectedAddressId,
          payment_method: 'COD',
          coupon_code: appliedCoupon || undefined,
          notes: deliveryNotes.trim() || undefined,
        });
        return res.data;
      }
    },
    onSuccess: (orderData) => {
      if (!isDirectCheckout) {
        setItemCount(0); // Immediately reset store item count
        queryClient.setQueryData(['cart'], null); // Clear TanStack cart cache
      }
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order placed successfully! 🎉');
      navigate(`/order-success/${orderData.id}`);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        err?.message ||
        'Failed to place order. Please try again.';
      toast.error(msg);
    },
  });

  // Calculate items list to render
  const checkoutItems = useMemo(() => {
    if (checkoutPreview?.items && checkoutPreview.items.length > 0) {
      return checkoutPreview.items;
    }
    if (isDirectCheckout && directVariantRes) {
      const v = directVariantRes;
      const priceStr = v.sale_price !== null && v.sale_price !== undefined ? String(v.sale_price) : String(v.price);
      const unitPrice = parseFloat(priceStr) || 0;
      return [
        {
          product_variant_id: v.id,
          product_name: v.product_name || 'Medicine Variant',
          variant_name: v.variant_name,
          quantity: directQty,
          unit_price: unitPrice,
          total_price: unitPrice * directQty,
          is_prescription_required: Boolean(v.is_prescription_required),
        },
      ];
    }
    if (!isDirectCheckout && cartData?.items) {
      return cartData.items.map((item: any) => ({
        product_variant_id: item.product_variant?.id || item.variant,
        product_name: item.product_variant?.product?.name || item.product_name || 'Medicine',
        variant_name: item.product_variant?.variant_name || item.variant_name,
        quantity: item.quantity,
        unit_price: parseFloat(item.unit_price || item.price || '0'),
        total_price: parseFloat(item.total_price || '0'),
        is_prescription_required: Boolean(
          item.product_variant?.is_prescription_required || item.product_variant?.product?.is_prescription_required
        ),
      }));
    }
    return [];
  }, [checkoutPreview, isDirectCheckout, directVariantRes, directQty, cartData]);

  // Check prescription requirement
  const isRxRequired = useMemo(() => {
    return checkoutItems.some((i: any) => Boolean(i.is_prescription_required));
  }, [checkoutItems]);

  // Check loading state
  const isInitialLoading =
    isLoadingAddresses || (isDirectCheckout ? isLoadingDirectVariant : isLoadingCart);

  // Fallback pricing calculation if preview API is pending
  const subtotalDisplay =
    checkoutPreview?.pricing?.subtotal ??
    (checkoutItems.reduce((acc: number, item: any) => acc + (item.total_price || item.unit_price * item.quantity), 0) || '0.00');

  const grandTotalDisplay =
    checkoutPreview?.pricing?.grand_total ?? subtotalDisplay;

  if (!isInitialLoading && checkoutItems.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary-600/10 text-primary-400 border border-primary-500/20 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="font-head font-extrabold text-2xl text-content-primary">Your Checkout Cart is Empty</h2>
          <p className="text-xs text-content-secondary">
            You don't have any items in your checkout session. Add medicines to your cart to proceed.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/products')} className="rounded-full px-8 font-bold shadow-glow">
          Explore Medicines Catalog
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ── BREADCRUMB / STEPPER BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-bg-border pb-6">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs text-content-muted hover:text-primary-400 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <h1 className="font-head text-2xl sm:text-3xl font-extrabold text-content-primary flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-primary-400" /> Secure Checkout
          </h1>
          <p className="text-xs text-content-secondary mt-1">
            Review delivery address, payment method, and complete your medicine order.
          </p>
        </div>

        {/* Stepper Pills */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Link to="/cart" className="text-content-muted hover:text-content-primary flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cart
          </Link>
          <span className="text-content-muted">/</span>
          <span className="px-3 py-1 rounded-full bg-primary-600/20 text-primary-400 border border-primary-500/30 flex items-center gap-1.5 font-bold">
            <Truck className="w-3.5 h-3.5" /> Shipping & Payment
          </span>
          <span className="text-content-muted">/</span>
          <span className="text-content-muted">Confirmation</span>
        </div>
      </div>

      {isInitialLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* ── LEFT COLUMN: ADDRESS & PAYMENT ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* 1. DELIVERY ADDRESS SELECTOR */}
            <div className="bg-bg-card border border-bg-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-card">
              <div className="flex items-center justify-between border-b border-bg-border pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="font-head font-bold text-base text-content-primary flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary-400" /> Delivery Shipping Address
                    </h2>
                    <p className="text-xs text-content-secondary">
                      Select where you want your prescription & medicines delivered.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddAddressModalOpen(true)}
                  className="rounded-full gap-1.5 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Address
                </Button>
              </div>

              {addresses.length === 0 ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center space-y-4">
                  <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                  <div>
                    <h4 className="font-head font-bold text-sm text-amber-300">No Shipping Address Found</h4>
                    <p className="text-xs text-content-secondary max-w-md mx-auto mt-1">
                      You must add a valid shipping address before placing your order.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setIsAddAddressModalOpen(true)}
                    className="rounded-full px-6 font-bold shadow-glow"
                  >
                    <Plus className="w-4 h-4" /> Create Delivery Address Now
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`relative rounded-2xl border p-5 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? 'bg-primary-950/20 border-primary-500 ring-2 ring-primary-500/30 shadow-card'
                            : 'bg-bg-surface/50 border-bg-border hover:border-content-muted'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-1 rounded-xl bg-primary-600/10 text-primary-400 border border-primary-500/20 text-[11px] font-bold capitalize flex items-center gap-1.5">
                              {LABEL_ICONS[addr.label]}
                              {addr.label}
                            </span>

                            {isSelected && (
                              <Badge variant="success" className="gap-1 text-[10px] px-2">
                                <CheckCircle2 className="w-3 h-3" /> Selected
                              </Badge>
                            )}
                          </div>

                          <div className="text-xs space-y-0.5 pt-1">
                            {addr.receiver_name && (
                              <p className="font-bold text-content-primary flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-content-muted" /> {addr.receiver_name}
                              </p>
                            )}
                            {addr.receiver_phone && (
                              <p className="text-content-secondary font-mono text-[11px] flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-content-muted" /> {addr.receiver_phone}
                              </p>
                            )}
                          </div>

                          <p className="text-xs text-content-secondary leading-relaxed pt-1 border-t border-bg-border/50">
                            <span className="font-medium text-content-primary">{addr.full_address}</span>
                            <br />
                            {addr.area}, {addr.city} {addr.postal_code ? `- ${addr.postal_code}` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. PAYMENT METHOD SELECTOR */}
            <div className="bg-bg-card border border-bg-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-card">
              <div className="flex items-center gap-2.5 border-b border-bg-border pb-4">
                <div className="w-8 h-8 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h2 className="font-head font-bold text-base text-content-primary flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary-400" /> Payment Options
                  </h2>
                  <p className="text-xs text-content-secondary">
                    Select your preferred payment method. Cash on Delivery is default & active.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ── OPTION A: CASH ON DELIVERY (ACTIVE & DEFAULT) ── */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className={`relative rounded-2xl border p-5 cursor-pointer transition-all flex items-start gap-4 ${
                    paymentMethod === 'COD'
                      ? 'bg-primary-950/30 border-primary-500 ring-2 ring-primary-500/30 shadow-card'
                      : 'bg-bg-surface/50 border-bg-border'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-600/20 text-primary-400 border border-primary-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Banknote className="w-5 h-5" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-head font-bold text-sm text-content-primary flex items-center gap-1.5">
                        Cash on Delivery
                      </h3>
                      <Badge variant="success" className="text-[10px] px-2">
                        Active
                      </Badge>
                    </div>
                    <p className="text-xs text-content-secondary leading-relaxed">
                      Pay with cash directly to the express rider when your medicine package arrives.
                    </p>
                  </div>
                </div>

                {/* ── OPTION B: BKASH (DISABLED / NOT SELECTED / BLURRED) ── */}
                <div className="relative rounded-2xl border border-bg-border bg-bg-surface/30 p-5 opacity-50 cursor-not-allowed select-none flex items-start gap-4 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    bKash
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-head font-bold text-sm text-content-secondary">bKash Payment</h3>
                      <span className="px-2 py-0.5 rounded-full bg-bg-surface text-content-muted border border-bg-border text-[10px] font-bold uppercase">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-xs text-content-muted leading-relaxed">
                      bKash payment gateway integration currently under maintenance.
                    </p>
                  </div>
                </div>

                {/* ── OPTION C: NAGAD (DISABLED / NOT SELECTED / BLURRED) ── */}
                <div className="relative rounded-2xl border border-bg-border bg-bg-surface/30 p-5 opacity-50 cursor-not-allowed select-none flex items-start gap-4 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    Nagad
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-head font-bold text-sm text-content-secondary">Nagad Wallet</h3>
                      <span className="px-2 py-0.5 rounded-full bg-bg-surface text-content-muted border border-bg-border text-[10px] font-bold uppercase">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-xs text-content-muted leading-relaxed">
                      Nagad instant payment unavailable for this merchant.
                    </p>
                  </div>
                </div>

                {/* ── OPTION D: CARD / BANK (DISABLED / NOT SELECTED / BLURRED) ── */}
                <div className="relative rounded-2xl border border-bg-border bg-bg-surface/30 p-5 opacity-50 cursor-not-allowed select-none flex items-start gap-4 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-head font-bold text-sm text-content-secondary">Credit / Debit Card</h3>
                      <span className="px-2 py-0.5 rounded-full bg-bg-surface text-content-muted border border-bg-border text-[10px] font-bold uppercase">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-xs text-content-muted leading-relaxed">
                      Visa, Mastercard & online banking cards integration upcoming.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. DELIVERY INSTRUCTIONS / NOTES */}
            <div className="bg-bg-card border border-bg-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-card">
              <h2 className="font-head font-bold text-sm text-content-primary flex items-center gap-2 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-primary-400" /> Delivery Notes & Special Instructions (Optional)
              </h2>
              <textarea
                rows={2}
                placeholder="e.g. Call before arrival, leave with apartment gate guard..."
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="w-full rounded-2xl bg-bg-surface border border-bg-border p-3 text-content-primary text-xs focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* ── RIGHT COLUMN: ORDER SUMMARY ── */}
          <div className="space-y-6 sticky top-24">
            <div className="bg-bg-card border border-bg-border rounded-3xl p-6 space-y-6 shadow-card">
              <h2 className="font-head font-bold text-base text-content-primary border-b border-bg-border pb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-400" /> Order Items ({checkoutItems.length})
              </h2>

              {/* Items List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {checkoutItems.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 text-xs bg-bg-surface/50 p-3 rounded-2xl border border-bg-border/60"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="font-semibold text-content-primary truncate">
                        {item.product_name}
                      </p>
                      {item.variant_name && (
                        <p className="text-[11px] text-content-muted truncate">
                          Variant: {item.variant_name}
                        </p>
                      )}
                      <p className="text-[11px] text-content-secondary font-mono">
                        ৳{item.unit_price} × {item.quantity}
                      </p>
                    </div>

                    <span className="font-mono font-bold text-primary-400 shrink-0">
                      ৳{item.total_price || item.unit_price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Rx Alert Notice if required */}
              {isRxRequired && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-2 text-xs text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    <strong>Rx Required:</strong> 1 or more items require a valid doctor prescription. Our pharmacist will verify upon confirmation.
                  </span>
                </div>
              )}

              {/* Promo Coupon Box */}
              <div className="pt-2 border-t border-bg-border space-y-3">
                <label className="text-xs font-bold text-content-primary flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-primary-400" /> Have a Coupon Code?
                </label>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl">
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                      <Sparkles className="w-4 h-4" />
                      <span>{appliedCoupon} Applied!</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="p-1 text-content-muted hover:text-red-400 transition-colors"
                      title="Remove coupon"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ENTER CODE"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      className="flex-1 rounded-xl bg-bg-surface border border-bg-border px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:border-primary-500"
                    />
                    <Button type="submit" variant="outline" size="sm" className="rounded-xl text-xs font-bold shrink-0">
                      Apply
                    </Button>
                  </form>
                )}
              </div>

              {/* Detailed Calculations */}
              <div className="pt-3 border-t border-bg-border space-y-2 text-xs">
                <div className="flex justify-between text-content-secondary">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-content-primary">
                    ৳{subtotalDisplay}
                  </span>
                </div>

                <div className="flex justify-between text-content-secondary">
                  <span>Delivery Charge</span>
                  <span className="font-mono font-medium text-emerald-400">
                    {parseFloat(checkoutPreview?.pricing?.delivery_charge || '0') === 0
                      ? 'FREE'
                      : `৳${checkoutPreview?.pricing?.delivery_charge}`}
                  </span>
                </div>

                {appliedCoupon && checkoutPreview?.pricing?.discount && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Coupon Discount ({appliedCoupon})</span>
                    <span className="font-mono">- ৳{checkoutPreview.pricing.discount}</span>
                  </div>
                )}

                <div className="flex justify-between text-content-secondary">
                  <span>Estimated Tax</span>
                  <span className="font-mono text-content-muted">৳0.00</span>
                </div>

                <div className="pt-3 border-t border-bg-border flex justify-between items-baseline text-content-primary">
                  <span className="font-head font-extrabold text-base">Grand Total</span>
                  <span className="font-mono font-extrabold text-2xl text-primary-400">
                    ৳{grandTotalDisplay}
                  </span>
                </div>
              </div>

              {/* Submit Order Button */}
              <Button
                type="button"
                variant="primary"
                size="lg"
                loading={placeOrderMutation.isPending || isLoadingPreview}
                disabled={!selectedAddressId || checkoutItems.length === 0}
                onClick={() => placeOrderMutation.mutate()}
                className="w-full rounded-full py-4 text-sm font-extrabold shadow-glow uppercase tracking-wider"
              >
                Place Order (Cash on Delivery)
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-content-muted text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Genuine Pharma Assurance & Doorstep Delivery</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE NEW ADDRESS MODAL INLINE ── */}
      <AnimatePresence>
        {isAddAddressModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddAddressModalOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-bg-card border border-bg-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-card z-10 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-bg-border pb-4">
                <h3 className="font-head font-bold text-lg text-content-primary flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-400" /> Add New Delivery Address
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddAddressModalOpen(false)}
                  className="p-1 rounded-full text-content-muted hover:text-content-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createAddressMutation.mutate(newAddress);
                }}
                className="space-y-4"
              >
                {/* Label Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-content-secondary uppercase">Address Label</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['home', 'office', 'pharmacy', 'other'] as const).map((lbl) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setNewAddress((prev) => ({ ...prev, label: lbl }))}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all flex items-center justify-center gap-1 ${
                          newAddress.label === lbl
                            ? 'bg-primary-600/20 border-primary-500 text-primary-400'
                            : 'bg-bg-surface border-bg-border text-content-secondary'
                        }`}
                      >
                        {LABEL_ICONS[lbl]} {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Receiver Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-content-secondary">Receiver Name</label>
                    <input
                      type="text"
                      placeholder="Full Name"
                      required
                      value={newAddress.receiver_name}
                      onChange={(e) => setNewAddress({ ...newAddress, receiver_name: e.target.value })}
                      className="w-full rounded-xl bg-bg-surface border border-bg-border p-2.5 text-xs text-content-primary focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-content-secondary">Receiver Phone</label>
                    <input
                      type="tel"
                      placeholder="01700000000"
                      required
                      value={newAddress.receiver_phone}
                      onChange={(e) => setNewAddress({ ...newAddress, receiver_phone: e.target.value })}
                      className="w-full rounded-xl bg-bg-surface border border-bg-border p-2.5 text-xs text-content-primary focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Full Address */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-content-secondary">Full Street Address</label>
                  <textarea
                    rows={2}
                    placeholder="House/Holding #, Flat #, Road #, Block #..."
                    required
                    value={newAddress.full_address}
                    onChange={(e) => setNewAddress({ ...newAddress, full_address: e.target.value })}
                    className="w-full rounded-xl bg-bg-surface border border-bg-border p-2.5 text-xs text-content-primary focus:outline-none focus:border-primary-500"
                  />
                </div>

                {/* Area & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-content-secondary">Area / Thana</label>
                    <input
                      type="text"
                      placeholder="e.g. Dhanmondi"
                      required
                      value={newAddress.area}
                      onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                      className="w-full rounded-xl bg-bg-surface border border-bg-border p-2.5 text-xs text-content-primary focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-content-secondary">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Dhaka"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full rounded-xl bg-bg-surface border border-bg-border p-2.5 text-xs text-content-primary focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-bg-border">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddAddressModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={createAddressMutation.isPending}
                    className="rounded-full px-6 font-bold shadow-glow"
                  >
                    Save Address
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
