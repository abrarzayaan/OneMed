import api from '../../../api/axios';

export interface VendorSettlementSummary {
  vendor_id: number;
  vendor_name: string;
  type: string;
  phone: string;
  bank_name: string;
  bank_account_no: string;
  bkash_merchant: string;
  gross_sales_bdt: number;
  commission_rate_pct: number;
  platform_commission_bdt: number;
  total_disbursed_bdt: number;
  net_balance_payable_bdt: number;
  fulfilled_order_count: number;
}

export interface PayoutRequest {
  id: number;
  vendor_id: number;
  vendor_name: string;
  requested_amount_bdt: number;
  payment_method: string;
  account_details: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  transaction_trx_id?: string;
  rejection_reason?: string;
  requested_at: string;
  processed_at?: string;
}

export const adminVendorSettlementApi = {
  getVendorSummaries: async (): Promise<VendorSettlementSummary[]> => {
    try {
      const res = await api.get('/admin/orders/vendor-settlements/');
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return list.map((v: any) => ({
        vendor_id: v.vendor_id || v.id || 0,
        vendor_name: v.vendor_name || v.name || 'Vendor',
        type: v.type || 'pharmacy',
        phone: v.phone || 'N/A',
        bank_name: v.bank_name || 'City Bank Bangladesh',
        bank_account_no: v.bank_account_no || 'N/A',
        bkash_merchant: v.bkash_merchant || 'N/A',
        gross_sales_bdt: Number(v.gross_sales_bdt) || 0,
        commission_rate_pct: Number(v.commission_rate_pct) || 10,
        platform_commission_bdt: Number(v.platform_commission_bdt) || 0,
        total_disbursed_bdt: Number(v.total_disbursed_bdt) || 0,
        net_balance_payable_bdt: Number(v.net_balance_payable_bdt) || 0,
        fulfilled_order_count: Number(v.fulfilled_order_count) || 0,
      }));
    } catch (err) {
      console.error('Failed to fetch vendor settlement summaries:', err);
      return [];
    }
  },

  getPayoutRequests: async (): Promise<PayoutRequest[]> => {
    try {
      const res = await api.get('/admin/orders/payout-requests/');
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return list.map((p: any) => ({
        id: p.id || 0,
        vendor_id: p.vendor_id || 0,
        vendor_name: p.vendor_name || 'Vendor',
        requested_amount_bdt: Number(p.requested_amount_bdt) || 0,
        payment_method: p.payment_method || 'Bank Transfer',
        account_details: p.account_details || '',
        status: p.status || 'PENDING',
        transaction_trx_id: p.transaction_trx_id || '',
        rejection_reason: p.rejection_reason || '',
        requested_at: p.requested_at || new Date().toISOString(),
        processed_at: p.processed_at,
      }));
    } catch (err) {
      console.error('Failed to fetch payout requests:', err);
      return [];
    }
  },

  createPayoutRequest: async (payload: {
    vendor_id: number;
    requested_amount_bdt: number;
    payment_method: string;
    account_details: string;
  }): Promise<{ id: number; status: string }> => {
    const res = await api.post('/admin/orders/payout-requests/', payload);
    return res.data;
  },

  approvePayout: async (payoutId: number, transactionTrxId: string): Promise<PayoutRequest> => {
    const res = await api.post(`/admin/orders/payout-requests/${payoutId}/approve/`, {
      transaction_trx_id: transactionTrxId,
    });
    return res.data;
  },

  rejectPayout: async (payoutId: number, rejectionReason: string): Promise<PayoutRequest> => {
    const res = await api.post(`/admin/orders/payout-requests/${payoutId}/reject/`, {
      rejection_reason: rejectionReason,
    });
    return res.data;
  },
};
