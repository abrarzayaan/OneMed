export interface Subcategory {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  icon: string | null;
  sort_order?: number;
  status?: string;
}

export interface Category {
  id: number;
  parent: number | null;
  name: string;
  slug: string;
  image: string | null;
  icon: string | null;
  sort_order: number;
  status: string;
  children: Subcategory[];
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  status?: string;
}

export interface ProductVariantItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  variant_name: string;
  short_description?: Record<string, any> | string | null;
  sku: string;
  price: string | number;
  sale_price: string | number | null;
  thumbnail: string | null;
  category_id: number | null;
  category_name: string | null;
  brand_id: number | null;
  brand_name: string | null;
  is_prescription_required: boolean;
  meta?: Record<string, any>;
}

export interface ProductVariantImage {
  id: number;
  variant: number;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  status: string;
  created_at?: string;
}

export interface ProductVariantDetail extends ProductVariantItem {
  product: number;
  long_description?: Record<string, any> | string | null;
  barcode: string | null;
  cost_price: string | null;
  min_order_qty: number;
  max_order_qty: number;
  weight: string | null;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
    [key: string]: any;
  };
  status: string;
  meta: Record<string, any>;
  variant_images: ProductVariantImage[];
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

