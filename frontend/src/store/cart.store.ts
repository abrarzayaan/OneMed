import { create } from 'zustand';

interface CartState {
  itemCount: number;
  isDrawerOpen: boolean;
  setItemCount: (count: number) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  increment: () => void;
  decrement: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
  itemCount: 0,
  isDrawerOpen: false,
  setItemCount: (count) => set({ itemCount: count }),
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((s) => ({ isDrawerOpen: !s.isDrawerOpen })),
  increment: () => set((s) => ({ itemCount: s.itemCount + 1 })),
  decrement: () => set((s) => ({ itemCount: Math.max(0, s.itemCount - 1) })),
}));
