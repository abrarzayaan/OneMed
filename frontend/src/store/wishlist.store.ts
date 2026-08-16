import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistState {
  items: number[]; // variant IDs
  toggle:      (variantId: number) => void;
  isWishlisted:(variantId: number) => boolean;
  clear:       () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (variantId) =>
        set((state) => ({
          items: state.items.includes(variantId)
            ? state.items.filter((id) => id !== variantId)
            : [...state.items, variantId],
        })),

      isWishlisted: (variantId) => get().items.includes(variantId),

      clear: () => set({ items: [] }),
    }),
    { name: 'onemed-wishlist' }
  )
);
