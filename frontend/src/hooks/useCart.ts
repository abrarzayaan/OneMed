import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { cartApi } from '@/api/cart.api';
import { profileApi } from '@/api/profile.api';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import type { Cart } from '@/types/cart.types';

export const CART_QUERY_KEY = ['cart'];

export function useCart() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const setItemCount = useCartStore((s) => s.setItemCount);
  const openDrawer = useCartStore((s) => s.openDrawer);

  // Fetch cart data from API
  const query = useQuery<Cart>({
    queryKey: CART_QUERY_KEY,
    queryFn: async () => {
      const res = await cartApi.getCart();
      return res.data;
    },
    enabled: isLoggedIn,
    staleTime: 1000 * 30, // 30s stale time
  });

  // Sync total item count to Zustand store whenever cart data changes
  useEffect(() => {
    if (query.data) {
      setItemCount(query.data.total_items || 0);
    } else if (!isLoggedIn) {
      setItemCount(0);
    }
  }, [query.data, isLoggedIn, setItemCount]);

  // Add Item Mutation (with Address Validation)
  const addItemMutation = useMutation({
    mutationFn: async ({ variantId, quantity = 1 }: { variantId: number; quantity?: number }) => {
      if (!isLoggedIn) {
        throw new Error('AUTH_REQUIRED');
      }

      // Check if user has at least one saved address
      try {
        const addressRes = await profileApi.getAddresses();
        const addrData = addressRes.data;
        const addressList = Array.isArray(addrData) ? addrData : (addrData?.results || []);
        const activeAddresses = addressList.filter((a: any) => a.status !== 'hidden');
        if (activeAddresses.length === 0) {
          throw new Error('NO_ADDRESS_REQUIRED');
        }
      } catch (err: any) {
        if (err.message === 'NO_ADDRESS_REQUIRED') {
          throw err;
        }
        // If address query fails for network/other reasons, allow cart flow or handle gracefully
      }

      const res = await cartApi.addItem(variantId, quantity);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(CART_QUERY_KEY, data);
      setItemCount(data.total_items || 0);
      toast.success('Item added to cart!');
      openDrawer();
    },
    onError: (err: any) => {
      if (err.message === 'AUTH_REQUIRED') {
        toast.error('Please login to add items to cart');
        navigate('/login');
        return;
      }
      if (err.message === 'NO_ADDRESS_REQUIRED') {
        toast.error('Please add a shipping address before adding items to cart 📍', { duration: 4000 });
        navigate('/account/addresses');
        return;
      }
      const msg =
        err.response?.data?.quantity ||
        err.response?.data?.product_variant_id ||
        err.response?.data?.detail ||
        err.message ||
        'Failed to add item to cart';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  // Update Item Quantity Mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ variantId, quantity }: { variantId: number; quantity: number }) => {
      const res = await cartApi.updateItem(variantId, quantity);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(CART_QUERY_KEY, data);
      setItemCount(data.total_items || 0);
      toast.success('Cart updated');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.quantity || err.response?.data?.detail || 'Failed to update item';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  // Remove Item Mutation
  const removeItemMutation = useMutation({
    mutationFn: async (variantId: number) => {
      const res = await cartApi.removeItem(variantId);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(CART_QUERY_KEY, data);
      setItemCount(data.total_items || 0);
      toast.success('Item removed from cart');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to remove item';
      toast.error(msg);
    },
  });

  // Clear Cart Mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const res = await cartApi.clearCart();
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      setItemCount(0);
      toast.success('Cart cleared');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to clear cart';
      toast.error(msg);
    },
  });

  return {
    cart: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    addItem: addItemMutation.mutate,
    isAdding: addItemMutation.isPending,
    updateItem: updateItemMutation.mutate,
    isUpdating: updateItemMutation.isPending,
    updatingVariantId: updateItemMutation.variables?.variantId,
    removeItem: removeItemMutation.mutate,
    isRemoving: removeItemMutation.isPending,
    removingVariantId: removeItemMutation.variables,
    clearCart: clearCartMutation.mutate,
    isClearing: clearCartMutation.isPending,
  };
}
