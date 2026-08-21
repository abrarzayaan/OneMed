import api from '../../../api/axios';

export interface AnalyticsSummary {
  total_revenue: number;
  revenue_growth_pct: number;
  active_orders_count: number;
  dispatch_ready_count: number;
  total_customers: number;
  new_customers_today: number;
  pending_rx_count: number;
  avg_rx_review_mins: number;
}

export interface RevenueChartPoint {
  label: string;
  revenue: number;
  orders: number;
}

export interface CategoryBreakdownItem {
  name: string;
  percentage: number;
  amount: number;
  color: string;
}

export interface TopProductItem {
  id: number;
  name: string;
  variant_name: string;
  category: string;
  sales_count: number;
  total_revenue: number;
}

export interface VendorPerformanceItem {
  id: number;
  name: string;
  location: string;
  orders_fulfilled: number;
  total_payout: number;
  rating: number;
  status: 'active' | 'busy' | 'offline';
}

export const adminAnalyticsApi = {
  getSummary: async (): Promise<AnalyticsSummary> => {
    try {
      const res = await api.get('/admin/orders/analytics/overview/');
      const data = res.data || {};
      return {
        total_revenue: typeof data.total_revenue_bdt === 'number' ? data.total_revenue_bdt : Number(data.total_revenue_bdt) || 0,
        revenue_growth_pct: typeof data.revenue_growth_pct === 'number' ? data.revenue_growth_pct : 0,
        active_orders_count: typeof data.active_orders_count === 'number' ? data.active_orders_count : 0,
        dispatch_ready_count: typeof data.dispatch_ready_count === 'number' ? data.dispatch_ready_count : 0,
        total_customers: typeof data.total_customers === 'number' ? data.total_customers : 0,
        new_customers_today: typeof data.new_customers_today === 'number' ? data.new_customers_today : 0,
        pending_rx_count: typeof data.pending_rx_count === 'number' ? data.pending_rx_count : 0,
        avg_rx_review_mins: typeof data.avg_rx_review_mins === 'number' ? data.avg_rx_review_mins : 0,
      };
    } catch (err) {
      console.error('Error fetching admin summary analytics:', err);
      return {
        total_revenue: 0,
        revenue_growth_pct: 0,
        active_orders_count: 0,
        dispatch_ready_count: 0,
        total_customers: 0,
        new_customers_today: 0,
        pending_rx_count: 0,
        avg_rx_review_mins: 0,
      };
    }
  },

  getRevenueChartData: async (timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<RevenueChartPoint[]> => {
    try {
      const res = await api.get('/admin/orders/analytics/chart/', {
        params: { timeframe },
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((item: any) => ({
          label: item.label || '',
          revenue: Number(item.revenue) || 0,
          orders: Number(item.orders) || 0,
        }));
      }
    } catch (err) {
      console.error('Error fetching admin revenue chart analytics:', err);
    }

    // Default empty buckets for clean visualization when no data
    if (timeframe === 'daily') {
      return ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'].map((lbl) => ({
        label: lbl,
        revenue: 0,
        orders: 0,
      }));
    }
    if (timeframe === 'weekly') {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((lbl) => ({
        label: lbl,
        revenue: 0,
        orders: 0,
      }));
    }
    if (timeframe === 'monthly') {
      return ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((lbl) => ({
        label: lbl,
        revenue: 0,
        orders: 0,
      }));
    }
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((lbl) => ({
      label: lbl,
      revenue: 0,
      orders: 0,
    }));
  },

  getCategoryBreakdown: async (): Promise<CategoryBreakdownItem[]> => {
    try {
      const res = await api.get('/admin/orders/analytics/overview/');
      const items = res.data?.category_sales_breakdown || [];
      if (Array.isArray(items) && items.length > 0) {
        return items.map((it: any) => ({
          name: it.name || 'Uncategorized',
          percentage: typeof it.percentage === 'number' ? it.percentage : Number(it.percentage) || 0,
          amount: typeof it.amount === 'number' ? it.amount : Number(it.amount) || 0,
          color: it.color || '#6366f1',
        }));
      }
    } catch (err) {
      console.error('Error fetching category sales breakdown:', err);
    }

    return [];
  },

  getTopSellingProducts: async (): Promise<TopProductItem[]> => {
    try {
      const res = await api.get('/admin/orders/analytics/overview/');
      const items = res.data?.top_selling_products || [];
      if (Array.isArray(items) && items.length > 0) {
        return items.map((p: any) => ({
          id: p.id || 0,
          name: p.name || 'Product',
          variant_name: p.variant_name || '',
          category: p.category || 'General',
          sales_count: Number(p.sales_count) || 0,
          total_revenue: Number(p.total_revenue) || 0,
        }));
      }
    } catch (err) {
      console.error('Error fetching top selling products:', err);
    }

    return [];
  },

  getVendorPerformance: async (): Promise<VendorPerformanceItem[]> => {
    try {
      const res = await api.get('/admin/orders/analytics/overview/');
      const items = res.data?.top_vendors_ranking || [];
      if (Array.isArray(items) && items.length > 0) {
        return items.map((v: any) => ({
          id: v.id || 0,
          name: v.name || 'Vendor',
          location: v.location || 'Local Hub',
          orders_fulfilled: Number(v.orders_fulfilled) || 0,
          total_payout: Number(v.total_payout) || 0,
          rating: typeof v.rating === 'number' ? v.rating : 4.9,
          status: 'active',
        }));
      }
    } catch (err) {
      console.error('Error fetching vendor performance:', err);
    }

    return [];
  },
};
