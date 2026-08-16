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

const INVENTORY_STORAGE_KEY = 'onemed_admin_inventory_batches_v1';

const defaultBatches: StockBatch[] = [
  {
    id: 1,
    variant_id: 101,
    variant_name: 'Napa Extend 665mg (10 Tablets)',
    sku: 'NAPA-665-10',
    brand_name: 'Square Pharmaceuticals Ltd.',
    vendor_name: 'Lazz Pharma (Dhanmondi)',
    batch_number: 'BATCH-SQ-2026-A',
    stock_qty: 450,
    reserved_qty: 25,
    damaged_qty: 5,
    reorder_level: 50,
    expiry_date: '2027-05-15',
    mfg_date: '2025-05-15',
    unit_cost_bdt: 14.5,
    status: 'HEALTHY',
  },
  {
    id: 2,
    variant_id: 102,
    variant_name: 'Ace Plus 500mg+65mg (10 Strips)',
    sku: 'ACE-500-10',
    brand_name: 'Square Pharmaceuticals Ltd.',
    vendor_name: 'Tamanna Pharmacy (Gulshan)',
    batch_number: 'BATCH-SQ-2025-X',
    stock_qty: 12,
    reserved_qty: 8,
    damaged_qty: 0,
    reorder_level: 40,
    expiry_date: '2026-09-10',
    mfg_date: '2024-09-10',
    unit_cost_bdt: 24.0,
    status: 'LOW_STOCK',
  },
  {
    id: 3,
    variant_id: 103,
    variant_name: 'Seclo 20mg Capsule (14 Caps)',
    sku: 'SECLO-20-14',
    brand_name: 'Incepta Pharmaceuticals Ltd.',
    vendor_name: 'Lazz Pharma (Uttara)',
    batch_number: 'BATCH-INC-2026-E',
    stock_qty: 180,
    reserved_qty: 15,
    damaged_qty: 2,
    reorder_level: 30,
    expiry_date: '2026-08-25',
    mfg_date: '2024-08-25',
    unit_cost_bdt: 68.0,
    status: 'EXPIRING_SOON',
  },
  {
    id: 4,
    variant_id: 104,
    variant_name: 'Monas 10mg Montelukast (10s)',
    sku: 'MONAS-10-10',
    brand_name: 'Acme Laboratories Ltd.',
    vendor_name: 'Shahbagh Medicine Corner',
    batch_number: 'BATCH-ACM-2024-Z',
    stock_qty: 90,
    reserved_qty: 0,
    damaged_qty: 15,
    reorder_level: 25,
    expiry_date: '2026-06-30',
    mfg_date: '2024-06-30',
    unit_cost_bdt: 120.0,
    status: 'EXPIRED',
  },
  {
    id: 5,
    variant_id: 105,
    variant_name: 'Sergel 20mg Capsule (10s)',
    sku: 'SERGEL-20-10',
    brand_name: 'Healthcare Pharmaceuticals',
    vendor_name: 'Lazz Pharma (Dhanmondi)',
    batch_number: 'BATCH-HPL-2026-C',
    stock_qty: 8,
    reserved_qty: 3,
    damaged_qty: 1,
    reorder_level: 35,
    expiry_date: '2026-09-01',
    mfg_date: '2024-09-01',
    unit_cost_bdt: 55.0,
    status: 'LOW_STOCK',
  },
];

const computeStatus = (batch: Partial<StockBatch>): StockBatch['status'] => {
  if (!batch.expiry_date) return 'HEALTHY';
  const exp = new Date(batch.expiry_date).getTime();
  const now = new Date().getTime();
  const daysToExpiry = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));

  if (daysToExpiry <= 0) return 'EXPIRED';
  if (daysToExpiry <= 60) return 'EXPIRING_SOON';
  if ((batch.stock_qty || 0) <= (batch.reorder_level || 20)) return 'LOW_STOCK';
  return 'HEALTHY';
};

const getStoredInventory = (): StockBatch[] => {
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (raw) {
      const parsed: StockBatch[] = JSON.parse(raw);
      return parsed.map((b) => ({ ...b, status: computeStatus(b) }));
    }
  } catch {}
  return defaultBatches;
};

const saveStoredInventory = (items: StockBatch[]) => {
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

export const adminInventoryApi = {
  getInventoryBatches: async (): Promise<StockBatch[]> => {
    try {
      const res = await api.get('/api/products/inventories/');
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((item: any) => ({
          id: item.id,
          variant_id: item.variant?.id || item.variant || 1,
          variant_name: item.variant?.variant_name || 'Medicine Variant',
          sku: item.variant?.sku || 'SKU-001',
          brand_name: item.variant?.product?.brand?.name || 'Pharma Brand',
          vendor_name: item.vendor?.pharmacy_name || 'Central Warehouse',
          batch_number: item.batch_number || `BATCH-${item.id}`,
          stock_qty: item.stock_qty || 0,
          reserved_qty: item.reserved_qty || 0,
          damaged_qty: item.damaged_qty || 0,
          reorder_level: item.reorder_level || 30,
          expiry_date: item.expiry_date || '2027-01-01',
          mfg_date: item.mfg_date || '2025-01-01',
          unit_cost_bdt: item.unit_cost_bdt || 25,
          status: computeStatus({
            expiry_date: item.expiry_date || '2027-01-01',
            stock_qty: item.stock_qty || 0,
            reorder_level: item.reorder_level || 30,
          }),
        }));
      }
    } catch {}
    return getStoredInventory();
  },

  createBatch: async (payload: Omit<StockBatch, 'id' | 'status'>): Promise<StockBatch> => {
    try {
      const res = await api.post('/api/products/inventories/', payload);
      if (res.data && res.data.id) return res.data;
    } catch {}

    const list = getStoredInventory();
    const newBatch: StockBatch = {
      ...payload,
      id: Date.now(),
      status: computeStatus(payload),
    };
    const updated = [newBatch, ...list];
    saveStoredInventory(updated);
    return newBatch;
  },

  updateBatch: async (id: number, payload: Partial<StockBatch>): Promise<StockBatch> => {
    try {
      const res = await api.patch(`/api/products/inventories/${id}/`, payload);
      if (res.data) return res.data;
    } catch {}

    const list = getStoredInventory();
    const updated = list.map((item) => {
      if (item.id === id) {
        const merged = { ...item, ...payload };
        merged.status = computeStatus(merged);
        return merged;
      }
      return item;
    });
    saveStoredInventory(updated);
    return updated.find((b) => b.id === id)!;
  },

  deleteBatch: async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/api/products/inventories/${id}/`);
    } catch {}
    const list = getStoredInventory();
    const updated = list.filter((item) => item.id !== id);
    saveStoredInventory(updated);
    return true;
  },
};
