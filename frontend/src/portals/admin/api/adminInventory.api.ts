import api from '../../../api/axios';

export interface StockBatch {
  id: number;
  variant_id: number;
  variant_name: string;
  sku: string;
  brand_name: string;
  vendor_name: string;
  batch_number: string;
  stock_qty: number;
  reserved_qty: number;
  damaged_qty: number;
  reorder_level: number;
  expiry_date: string;
  mfg_date: string;
  unit_cost_bdt: number;
  status: 'HEALTHY' | 'LOW_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';
}

const computeStatus = (batch: {
  stock_qty?: number;
  reorder_level?: number;
  status?: string;
}): StockBatch['status'] => {
  if (batch.status === 'out_of_stock') return 'EXPIRED';
  if (batch.status === 'low_stock' || (batch.stock_qty || 0) <= (batch.reorder_level || 20)) {
    return 'LOW_STOCK';
  }
  return 'HEALTHY';
};

const transformInventoryItem = (item: any): StockBatch => {
  return {
    id: item.id,
    variant_id: item.variant?.id || item.variant || item.id,
    variant_name: item.variant_name || item.product_name || 'Standard Variant',
    sku: item.sku || (item.variant && item.variant.sku) || `SKU-${item.id}`,
    brand_name: item.brand_name || 'General Brand',
    vendor_name: item.vendor_name || 'Central Pharmacy Hub',
    batch_number: item.batch_number || `BATCH-${item.id.toString().padStart(4, '0')}`,
    stock_qty: Number(item.stock_qty) || 0,
    reserved_qty: Number(item.reserved_qty) || 0,
    damaged_qty: Number(item.damaged_qty) || 0,
    reorder_level: Number(item.reorder_level) || 20,
    expiry_date: item.expiry_date || '2027-12-31',
    mfg_date: item.mfg_date || '2025-01-01',
    unit_cost_bdt: Number(item.unit_cost_bdt) || 0,
    status: computeStatus({
      stock_qty: Number(item.stock_qty) || 0,
      reorder_level: Number(item.reorder_level) || 20,
      status: item.status,
    }),
  };
};

export const adminInventoryApi = {
  getInventoryBatches: async (): Promise<StockBatch[]> => {
    try {
      const res = await api.get('/products/inventories/');
      const data = res.data;
      const list = Array.isArray(data) ? data : data && Array.isArray(data.results) ? data.results : [];
      return list.map(transformInventoryItem);
    } catch (err) {
      console.error('Failed to fetch inventories from backend:', err);
      return [];
    }
  },

  createBatch: async (payload: {
    variant_id?: number;
    stock_qty: number;
    reserved_qty?: number;
    damaged_qty?: number;
    reorder_level?: number;
    vendor_id?: number;
  }): Promise<StockBatch | null> => {
    try {
      const res = await api.post('/products/inventories/', {
        variant: payload.variant_id || 1,
        vendor: payload.vendor_id,
        stock_qty: payload.stock_qty,
        reserved_qty: payload.reserved_qty || 0,
        damaged_qty: payload.damaged_qty || 0,
        reorder_level: payload.reorder_level || 20,
      });
      if (res.data) {
        return transformInventoryItem(res.data);
      }
    } catch (err) {
      console.error('Failed to create inventory batch in backend:', err);
    }
    return null;
  },

  updateBatch: async (id: number, payload: Partial<StockBatch>): Promise<StockBatch | null> => {
    try {
      const res = await api.patch(`/products/inventories/${id}/`, {
        stock_qty: payload.stock_qty,
        reserved_qty: payload.reserved_qty,
        damaged_qty: payload.damaged_qty,
        reorder_level: payload.reorder_level,
      });
      if (res.data) {
        return transformInventoryItem(res.data);
      }
    } catch (err) {
      console.error(`Failed to update inventory ${id} in backend:`, err);
    }
    return null;
  },

  deleteBatch: async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/products/inventories/${id}/`);
      return true;
    } catch (err) {
      console.error(`Failed to delete inventory ${id} in backend:`, err);
      return false;
    }
  },
};
