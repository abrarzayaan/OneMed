import api from '@/api/axios';
import type {
  AdminVariantItem,
  BulkDiscountRulePayload,
  VariantMetaFlags,
} from '../types/admin.types';

export interface CategoryPayload {
  name: string;
  parent?: number | null;
  sort_order?: number;
  status?: 'active' | 'hidden';
  metadata?: {
    show_on_homepage?: boolean;
    seo_title?: string;
    seo_description?: string;
  };
}

export interface ProductPayload {
  name: string;
  category: number;
  brand?: number | null;
  is_prescription_required?: boolean;
  status?: 'active' | 'hidden';
  short_description?: Record<string, unknown> | string;
  long_description?: Record<string, unknown> | string;
  meta?: {
    tags?: string[];
    seo_title?: string;
    seo_description?: string;
    returnable?: boolean;
    warranty_days?: number;
  };
}

export interface VariantPayload {
  product: number;
  variant_name: string;
  sku: string;
  barcode?: string;
  price: number;
  sale_price?: number | null;
  cost_price?: number | null;
  min_order_qty?: number;
  max_order_qty?: number | null;
  status?: 'active' | 'hidden';
  short_description?: {
    dosage?: string;
    storage?: string;
    warnings?: string;
    side_effects?: string;
  };
  long_description?: {
    about?: string;
    highlights?: string[];
    indications?: string;
  };
  meta?: VariantMetaFlags;
}

export const INITIAL_MOCK_VARIANTS: AdminVariantItem[] = [
  {
    id: 12,
    sku: 'NAPA-EXT-500',
    product_id: 1,
    product_name: 'Napa Extra 500mg',
    variant_name: '10 Tablets Strip',
    category_name: 'Prescription Medicines',
    brand_name: 'Beximco Pharmaceuticals',
    price: 35,
    sale_price: 30,
    cost_price: 25,
    min_order_qty: 1,
    max_order_qty: 10,
    status: 'active',
    meta: {
      pack_size: '10 Pcs Blister Pack',
      is_hot_deal: true,
      is_best_selling: true,
      is_featured: true,
    },
  },
  {
    id: 45,
    sku: 'SERGEL-20MG-BOX',
    product_id: 2,
    product_name: 'Sergel 20mg Omeprazole',
    variant_name: '20 Capsules Box',
    category_name: 'Gastric & Digestive Care',
    brand_name: 'Healthcare Pharmaceuticals',
    price: 140,
    sale_price: 120,
    cost_price: 100,
    min_order_qty: 1,
    max_order_qty: 5,
    status: 'active',
    meta: {
      pack_size: '20 Capsules Box',
      is_hot_deal: true,
      is_featured: false,
    },
  },
  {
    id: 18,
    sku: 'SECLO-20MG-STRIP',
    product_id: 3,
    product_name: 'Seclo 20mg',
    variant_name: '10 Capsules Pack',
    category_name: 'Gastric & Digestive Care',
    brand_name: 'Square Pharmaceuticals',
    price: 60,
    sale_price: null,
    cost_price: 45,
    min_order_qty: 1,
    max_order_qty: 10,
    status: 'active',
    meta: {
      pack_size: '10 Pcs Pack',
      is_hot_deal: false,
      is_featured: true,
    },
  },
  {
    id: 30,
    sku: 'REX-SYRUP-100ML',
    product_id: 4,
    product_name: 'Rex Cough Syrup',
    variant_name: '100ml Bottle',
    category_name: 'Cold & Allergy',
    brand_name: 'ACI Pharmaceuticals',
    price: 180,
    sale_price: 160,
    cost_price: 130,
    min_order_qty: 1,
    max_order_qty: 3,
    status: 'active',
    meta: {
      pack_size: '100ml Bottle',
      is_hot_deal: false,
      is_featured: false,
    },
  },
  {
    id: 55,
    sku: 'FINIX-20-BOX',
    product_id: 5,
    product_name: 'Finix 20mg Rabeprazole',
    variant_name: '20 Tablets Box',
    category_name: 'Gastric & Digestive Care',
    brand_name: 'Incepta Pharmaceuticals',
    price: 160,
    sale_price: 140,
    cost_price: 110,
    min_order_qty: 1,
    max_order_qty: 5,
    status: 'active',
    meta: {
      pack_size: '20 Pcs Box',
      is_hot_deal: true,
      is_featured: true,
    },
  },
  {
    id: 60,
    sku: 'MAXPRO-40-PACK',
    product_id: 6,
    product_name: 'Maxpro 40mg Esomeprazole',
    variant_name: '14 Tablets Pack',
    category_name: 'Gastric & Digestive Care',
    brand_name: 'Renata Limited',
    price: 154,
    sale_price: null,
    cost_price: 120,
    min_order_qty: 1,
    max_order_qty: 5,
    status: 'active',
    meta: {
      pack_size: '14 Pcs Pack',
      is_hot_deal: false,
      is_featured: false,
    },
  },
];

let localVariantsStore: AdminVariantItem[] = [...INITIAL_MOCK_VARIANTS];
let localCategoriesStore: { id: number; name: string }[] = [
  { id: 1, name: 'Prescription Medicines' },
  { id: 2, name: 'Gastric & Digestive Care' },
  { id: 3, name: 'Cold & Allergy' },
  { id: 4, name: 'Personal Care & Hygiene' },
];
let localBrandsStore: { id: number; name: string }[] = [
  { id: 1, name: 'Beximco Pharmaceuticals Ltd.' },
  { id: 2, name: 'Square Pharmaceuticals Ltd.' },
  { id: 3, name: 'Incepta Pharmaceuticals' },
];
let localProductsStore: { id: number; name: string; category_name: string }[] = [
  { id: 1, name: 'Napa Extra 500mg', category_name: 'Prescription Medicines' },
  { id: 2, name: 'Sergel 20mg Omeprazole', category_name: 'Gastric & Digestive Care' },
  { id: 3, name: 'Seclo 20mg', category_name: 'Gastric & Digestive Care' },
  { id: 4, name: 'Rex Cough Syrup', category_name: 'Cold & Allergy' },
  { id: 5, name: 'Finix 20mg Rabeprazole', category_name: 'Gastric & Digestive Care' },
  { id: 6, name: 'Maxpro 40mg Esomeprazole', category_name: 'Gastric & Digestive Care' },
];

export interface BrandItem {
  id: number;
  name: string;
  slug?: string;
  logo?: string | null;
  status: 'active' | 'hidden' | string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryItem {
  id: number;
  name: string;
  slug?: string;
  parent?: number | null;
  image?: string | null;
  icon?: string | null;
  sort_order?: number;
  status: 'active' | 'hidden' | string;
  metadata?: Record<string, any>;
  children?: CategoryItem[];
  created_at?: string;
  updated_at?: string;
}

export interface ProductItem {
  id: number;
  name: string;
  slug?: string;
  category: number;
  category_name?: string;
  brand?: number | null;
  brand_name?: string;
  vendor?: number | null;
  vendor_username?: string;
  short_description?: string;
  long_description?: string;
  sku?: string;
  barcode?: string;
  thumbnail?: string | null;
  product_type?: string;
  is_prescription_required?: boolean;
  status: 'active' | 'hidden' | string;
  approval_status?: 'pending' | 'approved' | 'rejected' | string;
  meta?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface ProductImageItem {
  id: number;
  variant: number;
  variant_name?: string;
  image_url: string;
  is_primary: boolean;
  sort_order?: number;
  status: 'active' | 'hidden' | string;
  created_at?: string;
}

export interface InventoryItem {
  id: number;
  vendor?: number | null;
  vendor_name?: string;
  variant: number;
  variant_name?: string;
  product_name?: string;
  stock_qty: number;
  reserved_qty: number;
  damaged_qty: number;
  reorder_level: number;
  available_stock?: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'blocked' | string;
  updated_at?: string;
}

export const adminCatalogApi = {
  // ── BRAND CRUD ──────────────────────────────────────────
  getBrands: async (): Promise<{ id: number; name: string }[]> => {
    try {
      const res = await api.get('/products/brands/', { params: { page_size: 1000 } });
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return localBrandsStore;
    } catch {
      return localBrandsStore;
    }
  },

  getBrandsDetailed: async (): Promise<BrandItem[]> => {
    try {
      const res = await api.get('/products/brands/', { params: { page_size: 1000 } });
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return localBrandsStore.map(b => ({ id: b.id, name: b.name, status: 'active', metadata: {} }));
    } catch {
      return localBrandsStore.map(b => ({ id: b.id, name: b.name, status: 'active', metadata: {} }));
    }
  },

  createBrand: async (payload: { name: string; status?: string; metadata?: Record<string, any> }): Promise<BrandItem> => {
    try {
      const res = await api.post('/products/brands/', payload);
      if (res.data?.id && res.data?.name) {
        localBrandsStore.push({ id: res.data.id, name: res.data.name });
      }
      return res.data;
    } catch {
      const newBrand: BrandItem = { id: Date.now(), name: payload.name, status: payload.status || 'active', metadata: payload.metadata || {} };
      localBrandsStore.push({ id: newBrand.id, name: newBrand.name });
      return newBrand;
    }
  },

  updateBrand: async (id: number, payload: Partial<{ name: string; status: string; metadata: Record<string, any> }>): Promise<BrandItem> => {
    try {
      const res = await api.patch(`/products/brands/${id}/`, payload);
      return res.data;
    } catch {
      localBrandsStore = localBrandsStore.map(b => b.id === id ? { ...b, name: payload.name || b.name } : b);
      return { id, name: payload.name || 'Brand', status: payload.status || 'active', metadata: payload.metadata || {} };
    }
  },

  deleteBrand: async (id: number): Promise<void> => {
    try {
      await api.delete(`/products/brands/${id}/`);
    } catch {
      localBrandsStore = localBrandsStore.filter(b => b.id !== id);
    }
  },

  // ── CATEGORY CRUD ──────────────────────────────────────────
  getCategories: async (): Promise<{ id: number; name: string }[]> => {
    try {
      const res = await api.get('/products/categories/', { params: { page_size: 1000 } });
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return localCategoriesStore;
    } catch {
      return localCategoriesStore;
    }
  },

  getCategoriesDetailed: async (): Promise<CategoryItem[]> => {
    try {
      const res = await api.get('/products/categories/', { params: { page_size: 1000 } });
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return localCategoriesStore.map(c => ({ id: c.id, name: c.name, status: 'active', metadata: {} }));
    } catch {
      return localCategoriesStore.map(c => ({ id: c.id, name: c.name, status: 'active', metadata: {} }));
    }
  },

  createCategory: async (payload: CategoryPayload): Promise<CategoryItem> => {
    try {
      const res = await api.post('/products/categories/', payload);
      if (res.data?.id && res.data?.name) {
        localCategoriesStore.push({ id: res.data.id, name: res.data.name });
      }
      return res.data;
    } catch {
      const newCat: CategoryItem = { id: Date.now(), name: payload.name, status: payload.status || 'active', metadata: payload.metadata || {} };
      localCategoriesStore.push({ id: newCat.id, name: newCat.name });
      return newCat;
    }
  },

  updateCategory: async (id: number, payload: Partial<CategoryPayload>): Promise<CategoryItem> => {
    try {
      const res = await api.patch(`/products/categories/${id}/`, payload);
      return res.data;
    } catch {
      localCategoriesStore = localCategoriesStore.map(c => c.id === id ? { ...c, name: payload.name || c.name } : c);
      return { id, name: payload.name || 'Category', status: payload.status || 'active', metadata: payload.metadata || {} };
    }
  },

  deleteCategory: async (id: number): Promise<void> => {
    try {
      await api.delete(`/products/categories/${id}/`);
    } catch {
      localCategoriesStore = localCategoriesStore.filter(c => c.id !== id);
    }
  },

  // ── PRODUCT CRUD ──────────────────────────────────────────
  getProducts: async (): Promise<{ id: number; name: string; category_name: string }[]> => {
    try {
      const res = await api.get('/products/products/', { params: { page_size: 1000 } });
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return localProductsStore;
    } catch {
      return localProductsStore;
    }
  },

  getProductsDetailed: async (): Promise<ProductItem[]> => {
    try {
      const res = await api.get('/products/products/', { params: { page_size: 1000 } });
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return localProductsStore.map(p => ({
        id: p.id,
        name: p.name,
        category: 1,
        category_name: p.category_name,
        status: 'active',
        meta: {},
      }));
    } catch {
      return localProductsStore.map(p => ({
        id: p.id,
        name: p.name,
        category: 1,
        category_name: p.category_name,
        status: 'active',
        meta: {},
      }));
    }
  },

  createProduct: async (payload: ProductPayload): Promise<ProductItem> => {
    try {
      const res = await api.post('/products/products/', payload);
      if (res.data?.id && res.data?.name) {
        localProductsStore.push({
          id: res.data.id,
          name: res.data.name,
          category_name: res.data.category_name || 'General',
        });
      }
      return res.data;
    } catch {
      const newProd: ProductItem = {
        id: Date.now(),
        name: payload.name,
        category: payload.category,
        category_name: 'General',
        status: payload.status || 'active',
        meta: payload.meta || {},
      };
      localProductsStore.push({ id: newProd.id, name: newProd.name, category_name: newProd.category_name || 'General' });
      return newProd;
    }
  },

  updateProduct: async (id: number, payload: Partial<ProductPayload>): Promise<ProductItem> => {
    try {
      const res = await api.patch(`/products/products/${id}/`, payload);
      return res.data;
    } catch {
      localProductsStore = localProductsStore.map(p => p.id === id ? { ...p, name: payload.name || p.name } : p);
      return {
        id,
        name: payload.name || 'Product',
        category: payload.category || 1,
        status: payload.status || 'active',
        meta: payload.meta || {},
      };
    }
  },

  deleteProduct: async (id: number): Promise<void> => {
    try {
      await api.delete(`/products/products/${id}/`);
    } catch {
      localProductsStore = localProductsStore.filter(p => p.id !== id);
    }
  },

  // ── VARIANT CRUD ──────────────────────────────────────────
  getVariants: async (searchQuery?: string, categoryFilter?: string): Promise<AdminVariantItem[]> => {
    try {
      const params: Record<string, any> = { page_size: 1000 };
      if (searchQuery) params.search = searchQuery;
      if (categoryFilter && categoryFilter !== 'ALL') params.category = categoryFilter;

      const res = await api.get('/products/variants/', { params });
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return localVariantsStore;
    } catch {
      let result = [...localVariantsStore];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(
          (v) =>
            v.product_name.toLowerCase().includes(q) ||
            v.sku.toLowerCase().includes(q) ||
            v.variant_name.toLowerCase().includes(q)
        );
      }
      if (categoryFilter && categoryFilter !== 'ALL') {
        result = result.filter((v) => v.category_name === categoryFilter);
      }
      return result;
    }
  },

  createVariant: async (payload: VariantPayload): Promise<AdminVariantItem> => {
    try {
      const res = await api.post('/products/variants/', payload);
      const data = res.data;
      if (data && data.id) {
        const mappedItem: AdminVariantItem = {
          id: data.id,
          sku: data.sku || `SKU-${data.id}`,
          barcode: data.barcode || payload.barcode,
          product_id: data.product || payload.product,
          product_name: data.product_name || 'New Product',
          variant_name: data.variant_name || payload.variant_name,
          category_name: data.category_name || 'General',
          brand_name: data.brand_name || 'Generic Brand',
          price: Number(data.price) || payload.price,
          sale_price: data.sale_price !== null && data.sale_price !== undefined ? Number(data.sale_price) : null,
          cost_price: data.cost_price !== null && data.cost_price !== undefined ? Number(data.cost_price) : (payload.cost_price ?? null),
          min_order_qty: data.min_order_qty || payload.min_order_qty || 1,
          max_order_qty: data.max_order_qty !== null && data.max_order_qty !== undefined ? Number(data.max_order_qty) : (payload.max_order_qty ?? null),
          status: data.status || 'active',
          meta: data.meta || payload.meta || {},
        };
        localVariantsStore.unshift(mappedItem);
        return mappedItem;
      }
      throw new Error('Invalid response structure');
    } catch {
      const matchedProd = localProductsStore.find((p) => p.id === payload.product);
      const newVariant: AdminVariantItem = {
        id: Date.now(),
        sku: payload.sku,
        barcode: payload.barcode,
        product_id: payload.product,
        product_name: matchedProd ? matchedProd.name : 'Custom Product',
        variant_name: payload.variant_name,
        category_name: matchedProd ? matchedProd.category_name : 'General',
        price: payload.price,
        sale_price: payload.sale_price || null,
        cost_price: payload.cost_price ?? null,
        min_order_qty: payload.min_order_qty || 1,
        max_order_qty: payload.max_order_qty ?? null,
        status: payload.status || 'active',
        meta: payload.meta || {},
      };
      localVariantsStore.unshift(newVariant);
      return newVariant;
    }
  },

  updateVariantFull: async (id: number, payload: Partial<VariantPayload>): Promise<AdminVariantItem> => {
    try {
      const res = await api.patch(`/products/variants/${id}/`, payload);
      return res.data;
    } catch {
      localVariantsStore = localVariantsStore.map((v) => {
        if (v.id === id) {
          return {
            ...v,
            variant_name: payload.variant_name || v.variant_name,
            sku: payload.sku || v.sku,
            barcode: payload.barcode !== undefined ? payload.barcode : v.barcode,
            price: payload.price ?? v.price,
            sale_price: payload.sale_price !== undefined ? payload.sale_price : v.sale_price,
            cost_price: payload.cost_price !== undefined ? payload.cost_price : v.cost_price,
            min_order_qty: payload.min_order_qty !== undefined ? payload.min_order_qty : v.min_order_qty,
            max_order_qty: payload.max_order_qty !== undefined ? payload.max_order_qty : v.max_order_qty,
            status: payload.status || v.status,
            meta: payload.meta ? { ...v.meta, ...payload.meta } : v.meta,
          };
        }
        return v;
      });
      return localVariantsStore.find((v) => v.id === id)!;
    }
  },

  deleteVariant: async (id: number): Promise<void> => {
    try {
      await api.delete(`/products/variants/${id}/`);
    } catch {
      localVariantsStore = localVariantsStore.filter(v => v.id !== id);
    }
  },

  updateVariantPricing: async (
    variantId: number,
    price: number,
    salePrice: number | null,
    meta?: VariantMetaFlags
  ): Promise<AdminVariantItem> => {
    try {
      const payload: Record<string, unknown> = { price, sale_price: salePrice };
      if (meta) payload.meta = meta;

      const res = await api.patch(`/products/variants/${variantId}/`, payload);
      return res.data;
    } catch {
      localVariantsStore = localVariantsStore.map((v) => {
        if (v.id === variantId) {
          return {
            ...v,
            price,
            sale_price: salePrice,
            meta: meta ? { ...v.meta, ...meta } : v.meta,
          };
        }
        return v;
      });
      return localVariantsStore.find((v) => v.id === variantId)!;
    }
  },

  applyBulkDiscountRule: async (payload: BulkDiscountRulePayload): Promise<AdminVariantItem[]> => {
    try {
      const res = await api.post('/admin/products/variants/bulk-discount/', payload);
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return localVariantsStore;
    } catch {
      localVariantsStore = localVariantsStore.map((v) => {
        if (payload.variant_ids.includes(v.id)) {
          let calculatedSalePrice = v.price;
          if (payload.discount_type === 'flat') {
            calculatedSalePrice = Math.max(0, v.price - payload.discount_value);
          } else if (payload.discount_type === 'percentage') {
            const discountAmount = (v.price * payload.discount_value) / 100;
            calculatedSalePrice = Math.max(0, Math.round(v.price - discountAmount));
          }

          const updatedMeta: VariantMetaFlags = { ...v.meta };
          if (payload.is_hot_deal !== undefined) updatedMeta.is_hot_deal = payload.is_hot_deal;
          if (payload.is_featured !== undefined) updatedMeta.is_featured = payload.is_featured;

          return {
            ...v,
            sale_price: calculatedSalePrice,
            meta: updatedMeta,
          };
        }
        return v;
      });

      return localVariantsStore;
    }
  },

  // ── PRODUCT IMAGES CRUD ──────────────────────────────────────────
  getImages: async (variantId?: number): Promise<ProductImageItem[]> => {
    try {
      const params: Record<string, unknown> = { page_size: 1000 };
      if (variantId) params.variant = variantId;
      const res = await api.get('/products/images/', { params });
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return [];
    } catch {
      return [];
    }
  },

  uploadVariantImage: async (formData: FormData): Promise<ProductImageItem> => {
    try {
      const res = await api.post('/products/images/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch {
      return { id: Date.now(), variant: 1, image_url: '', is_primary: true, status: 'active' };
    }
  },

  updateImage: async (id: number, payload: Partial<{ is_primary: boolean; sort_order: number; status: string }>): Promise<ProductImageItem> => {
    try {
      const res = await api.patch(`/products/images/${id}/`, payload);
      return res.data;
    } catch {
      return { id, variant: 1, image_url: '', is_primary: payload.is_primary ?? false, status: payload.status || 'active' };
    }
  },

  deleteImage: async (id: number): Promise<void> => {
    try {
      await api.delete(`/products/images/${id}/`);
    } catch {
      // fallback handled
    }
  },

  // ── INVENTORY CRUD ──────────────────────────────────────────
  getInventories: async (): Promise<InventoryItem[]> => {
    try {
      const res = await api.get('/products/inventories/', { params: { page_size: 1000 } });
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return [];
    } catch {
      return [];
    }
  },

  createInventory: async (payload: {
    variant: number;
    vendor?: number | null;
    stock_qty: number;
    reserved_qty?: number;
    damaged_qty?: number;
    reorder_level?: number;
  }): Promise<InventoryItem> => {
    try {
      const res = await api.post('/products/inventories/', payload);
      return res.data;
    } catch {
      return { id: Date.now(), ...payload, reserved_qty: payload.reserved_qty || 0, damaged_qty: payload.damaged_qty || 0, reorder_level: payload.reorder_level || 10, status: 'in_stock' };
    }
  },

  updateInventory: async (
    id: number,
    payload: Partial<{
      stock_qty: number;
      reserved_qty: number;
      damaged_qty: number;
      reorder_level: number;
    }>
  ): Promise<InventoryItem> => {
    try {
      const res = await api.patch(`/products/inventories/${id}/`, payload);
      return res.data;
    } catch {
      return {
        id,
        variant: 1,
        stock_qty: payload.stock_qty || 0,
        reserved_qty: payload.reserved_qty || 0,
        damaged_qty: payload.damaged_qty || 0,
        reorder_level: payload.reorder_level || 10,
        status: 'in_stock',
      };
    }
  },

  deleteInventory: async (id: number): Promise<void> => {
    try {
      await api.delete(`/products/inventories/${id}/`);
    } catch {
      // fallback handled
    }
  },

  // ── VENDORS LIST ──────────────────────────────────────────
  getVendors: async (): Promise<{ id: number; name: string; username?: string }[]> => {
    try {
      const res = await api.get('/admin/orders/vendors/');
      const data = res.data;
      const list = Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);
      if (list.length > 0) {
        return list.map((v: any) => ({
          id: v.id,
          name: v.name || v.username || `Vendor Hub #${v.id}`,
          username: v.username || `vendor_${v.id}`,
        }));
      }
      return [
        { id: 1, name: 'Lazz Pharma (Dhanmondi Hub)', username: 'lazz_dhanmondi' },
        { id: 2, name: 'Tamanna Pharmacy (Gulshan Hub)', username: 'tamanna_gulshan' },
        { id: 3, name: 'Aroggo Central Depot', username: 'aroggo_depot' },
        { id: 4, name: 'Popular Medicine Store (Uttara)', username: 'popular_uttara' },
      ];
    } catch {
      return [
        { id: 1, name: 'Lazz Pharma (Dhanmondi Hub)', username: 'lazz_dhanmondi' },
        { id: 2, name: 'Tamanna Pharmacy (Gulshan Hub)', username: 'tamanna_gulshan' },
        { id: 3, name: 'Aroggo Central Depot', username: 'aroggo_depot' },
        { id: 4, name: 'Popular Medicine Store (Uttara)', username: 'popular_uttara' },
      ];
    }
  },
};
