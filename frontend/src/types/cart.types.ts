export interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  variant_id: number;
  variant_name: string;
  sku: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  is_prescription_required?: boolean;
}

export interface Cart {
  id: number;
  consumer_profile: number | null;
  items: CartItem[];
  total_items: number;
  total_price: string;
  created_at: string;
  updated_at: string;
}
