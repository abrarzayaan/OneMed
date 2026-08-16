export function formatCurrency(amount: number | string, currency = 'BDT'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '৳0.00';
  return `৳${num.toFixed(2)}`;
}

export function formatDiscount(original: number, sale: number): string {
  const pct = ((original - sale) / original) * 100;
  return `${Math.round(pct)}% off`;
}
