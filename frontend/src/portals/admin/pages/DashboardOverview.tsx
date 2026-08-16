import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  FileText,
  DollarSign,
  ArrowUpRight,
  Clock,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Layers,
  BarChart3,
  PieChart as PieChartIcon,
  Award,
  Building2,
  Calendar,
  Filter,
  Package,
} from 'lucide-react';
import { adminAnalyticsApi } from '../api/adminAnalytics.api';
import type {
  AnalyticsSummary,
  RevenueChartPoint,
  CategoryBreakdownItem,
  TopProductItem,
  VendorPerformanceItem,
} from '../api/adminAnalytics.api';

export const DashboardOverview: React.FC = () => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [chartData, setChartData] = useState<RevenueChartPoint[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdownItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  const [vendors, setVendors] = useState<VendorPerformanceItem[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<RevenueChartPoint | null>(null);

  useEffect(() => {
    adminAnalyticsApi.getSummary().then(setSummary);
    adminAnalyticsApi.getCategoryBreakdown().then(setCategories);
    adminAnalyticsApi.getTopSellingProducts().then(setTopProducts);
    adminAnalyticsApi.getVendorPerformance().then(setVendors);
  }, []);

  useEffect(() => {
    adminAnalyticsApi.getRevenueChartData(timeframe).then(setChartData);
  }, [timeframe]);

  // Max value for revenue scaling
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);
  const maxOrders = Math.max(...chartData.map((d) => d.orders), 1);

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-900/80 via-primary-800/60 to-bg-card border border-primary-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30 text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-primary-400" />
              <span>Section 04 — Executive Sales & Analytics Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-head font-bold text-content-primary tracking-tight">
              Welcome back, Super Admin 👋
            </h1>
            <p className="text-sm text-content-secondary">
              Real-time multi-vendor e-commerce monitoring, revenue trends, category breakdown, and vendor performance analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/admin/orders')}
              className="px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-xs shadow-glow transition-all flex items-center space-x-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Pending Orders ({summary?.active_orders_count || 42})</span>
            </button>
            <button
              onClick={() => navigate('/admin/prescriptions')}
              className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold text-xs transition-all flex items-center space-x-2"
            >
              <FileText className="w-4 h-4 text-rose-400" />
              <span>Rx Queue ({summary?.pending_rx_count || 5})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Analytics Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Stat 1: Total Revenue */}
        <div className="p-5 rounded-2xl bg-bg-card border border-bg-border shadow-card hover:border-primary-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-content-muted">Total Monthly Revenue</span>
            <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-head font-bold text-content-primary font-mono">
              ৳ {summary?.total_revenue.toLocaleString() || '1,485,200'}
            </div>
            <div className="flex items-center space-x-1.5 mt-1 text-xs text-emerald-400 font-medium">
              <ArrowUpRight className="w-4 h-4" />
              <span>+{summary?.revenue_growth_pct || 18.4}% vs last period</span>
            </div>
          </div>
        </div>

        {/* Stat 2: Active Orders */}
        <div className="p-5 rounded-2xl bg-bg-card border border-bg-border shadow-card hover:border-accent-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-content-muted">Active Fulfillment Orders</span>
            <div className="p-2.5 rounded-xl bg-accent-500/10 text-accent-400 border border-accent-500/20 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-head font-bold text-content-primary font-mono">
              {summary?.active_orders_count || 42} Active
            </div>
            <div className="flex items-center space-x-1.5 mt-1 text-xs text-emerald-400 font-medium">
              <ArrowUpRight className="w-4 h-4" />
              <span>{summary?.dispatch_ready_count || 18} orders ready for dispatch</span>
            </div>
          </div>
        </div>

        {/* Stat 3: Registered Customers */}
        <div className="p-5 rounded-2xl bg-bg-card border border-bg-border shadow-card hover:border-emerald-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-content-muted">Total Active Customers</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-head font-bold text-content-primary font-mono">
              {summary?.total_customers.toLocaleString() || '24,580'}
            </div>
            <div className="flex items-center space-x-1.5 mt-1 text-xs text-emerald-400 font-medium">
              <ArrowUpRight className="w-4 h-4" />
              <span>+{summary?.new_customers_today || 142} new today</span>
            </div>
          </div>
        </div>

        {/* Stat 4: Pending Rx Approvals */}
        <div className="p-5 rounded-2xl bg-bg-card border border-bg-border shadow-card hover:border-rose-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-content-muted">Prescription Review Queue</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-head font-bold text-content-primary font-mono">
              {summary?.pending_rx_count || 5} Pending
            </div>
            <div className="flex items-center space-x-1.5 mt-1 text-xs text-amber-400 font-medium">
              <Clock className="w-4 h-4" />
              <span>Avg review time: {summary?.avg_rx_review_mins || 4}m</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Charts & Category Sales Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Sales & Revenue Curve Chart (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-bg-card border border-bg-border shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-primary-400" />
                <h2 className="text-base font-head font-bold text-content-primary">
                  Sales & Revenue Performance Trends
                </h2>
              </div>
              <p className="text-xs text-content-muted">Real-time revenue graph with order volume timeline</p>
            </div>

            {/* Timeframe Filter Buttons */}
            <div className="flex items-center space-x-1 bg-bg-surface p-1 rounded-xl border border-bg-border">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold capitalize transition-all ${
                    timeframe === tf
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-content-muted hover:text-content-primary'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive SVG Chart Container */}
          <div className="relative h-64 w-full bg-bg-base/40 rounded-2xl border border-bg-border p-4 flex flex-col justify-between">
            {/* Hover Tooltip display */}
            {hoveredPoint && (
              <div className="absolute top-3 right-4 bg-bg-surface border border-primary-500/40 px-3 py-1.5 rounded-xl shadow-lg text-xs z-20 font-mono animate-in fade-in duration-150">
                <div className="text-primary-400 font-bold">{hoveredPoint.label}</div>
                <div className="text-content-primary">Revenue: ৳{hoveredPoint.revenue.toLocaleString()}</div>
                <div className="text-content-muted">Orders: {hoveredPoint.orders}</div>
              </div>
            )}

            {/* SVG Bars & Area Fill Curve */}
            <div className="relative flex-1 flex items-end justify-between gap-2 pt-6 pb-2 px-2">
              {chartData.map((pt, idx) => {
                const heightPct = (pt.revenue / maxRevenue) * 100;
                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                  >
                    {/* Revenue Bar with gradient */}
                    <div
                      style={{ height: `${Math.max(8, heightPct)}%` }}
                      className="w-full max-w-[36px] bg-gradient-to-t from-primary-600/40 via-primary-500/80 to-primary-400 rounded-t-lg group-hover:from-primary-500 group-hover:to-accent-400 transition-all duration-300 relative"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-white font-mono whitespace-nowrap transition-opacity">
                        ৳{pt.revenue >= 100000 ? `${(pt.revenue / 1000).toFixed(0)}k` : pt.revenue}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Axis Label X */}
            <div className="flex justify-between border-t border-bg-border pt-2 text-[11px] font-mono text-content-muted">
              {chartData.map((pt, idx) => (
                <span key={idx} className="flex-1 text-center truncate">
                  {pt.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sales Breakdown by Category Donut Chart (1 Col) */}
        <div className="p-6 rounded-3xl bg-bg-card border border-bg-border shadow-card space-y-4">
          <div className="flex items-center space-x-2">
            <PieChartIcon className="w-5 h-5 text-accent-400" />
            <div>
              <h2 className="text-base font-head font-bold text-content-primary">
                Category Sales Split
              </h2>
              <p className="text-xs text-content-muted">Revenue contribution by product domain</p>
            </div>
          </div>

          {/* SVG Donut Visual */}
          <div className="flex items-center justify-center py-2">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {categories.reduce<{ offset: number; elements: React.ReactNode[] }>(
                  (acc, cat, idx) => {
                    const strokeDasharray = `${cat.percentage} ${100 - cat.percentage}`;
                    const strokeDashoffset = -acc.offset;
                    acc.elements.push(
                      <circle
                        key={idx}
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke={cat.color}
                        strokeWidth="3.8"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500 hover:stroke-width-5 cursor-pointer"
                      />
                    );
                    acc.offset += cat.percentage;
                    return acc;
                  },
                  { offset: 0, elements: [] }
                ).elements}
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xs text-content-muted font-mono">Total Sales</span>
                <span className="text-base font-bold font-mono text-content-primary">100%</span>
              </div>
            </div>
          </div>

          {/* Category Legends list */}
          <div className="space-y-2 pt-2 border-t border-bg-border">
            {categories.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-content-primary truncate">{cat.name}</span>
                </div>
                <div className="font-mono text-content-muted flex items-center space-x-2">
                  <span>৳{(cat.amount / 1000).toFixed(0)}k</span>
                  <span className="font-bold text-content-primary font-mono">{cat.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Top Selling Products & Vendor Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products Table */}
        <div className="p-6 rounded-3xl bg-bg-card border border-bg-border shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-bg-border pb-3">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-base font-head font-bold text-content-primary">
                  Top Selling Products
                </h2>
                <p className="text-xs text-content-muted">Ranked by units sold & total revenue generated</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/catalog')}
              className="text-xs font-semibold text-primary-400 hover:text-primary-300 flex items-center space-x-1"
            >
              <span>Catalog</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-content-muted font-mono uppercase border-b border-bg-border bg-bg-base/40">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Product Variant</th>
                  <th className="py-2.5 px-3">Units Sold</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border">
                {topProducts.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-bg-hover transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">0{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-content-primary">{p.name}</div>
                      <div className="text-[11px] text-content-muted font-mono">{p.variant_name}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                      {p.sales_count.toLocaleString()} pcs
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-content-primary text-right">
                      ৳ {p.total_revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vendor Performance Table */}
        <div className="p-6 rounded-3xl bg-bg-card border border-bg-border shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-bg-border pb-3">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-base font-head font-bold text-content-primary">
                  Pharmacy Vendor Performance
                </h2>
                <p className="text-xs text-content-muted">Order fulfillment volume & payout summaries</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-xs font-semibold text-primary-400 hover:text-primary-300 flex items-center space-x-1"
            >
              <span>Fulfillment</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-content-muted font-mono uppercase border-b border-bg-border bg-bg-base/40">
                <tr>
                  <th className="py-2.5 px-3">Pharmacy Hub</th>
                  <th className="py-2.5 px-3">Fulfilled</th>
                  <th className="py-2.5 px-3">Rating</th>
                  <th className="py-2.5 px-3 text-right">Total Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-bg-hover transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-content-primary">{v.name}</div>
                      <div className="text-[11px] text-content-muted">{v.location}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-primary-400">
                      {v.orders_fulfilled} Orders
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-400 font-bold">
                      ★ {v.rating}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-content-primary text-right">
                      ৳ {v.total_payout.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
