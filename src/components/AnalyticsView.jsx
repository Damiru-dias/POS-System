import React from 'react';
import { usePOS } from '../context/POSContext';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Wallet,
  PieChart,
  Award,
  CreditCard,
} from 'lucide-react';

export function AnalyticsView() {
  const { orders, customers, advanceTransactions, products, formatCurrency } = usePOS();

  const totalRevenue = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalAdvanceHeld = customers.reduce((sum, c) => sum + (c.advanceBalance || 0), 0);

  // Calculate payment method share
  const paymentBreakdown = orders.reduce((acc, o) => {
    const method = o.paymentMethod || 'Other';
    acc[method] = (acc[method] || 0) + o.grandTotal;
    return acc;
  }, {});

  // Product sales velocity
  const productSalesMap = {};
  orders.forEach((o) => {
    o.items?.forEach((item) => {
      if (!productSalesMap[item.name]) {
        productSalesMap[item.name] = { qty: 0, revenue: 0 };
      }
      productSalesMap[item.name].qty += item.quantity;
      productSalesMap[item.name].revenue += item.total;
    });
  });

  const topProducts = Object.entries(productSalesMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <div className="analytics-view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Executive Sales & Advance Analytics</h1>
          <p className="view-sub">
            Real-time business performance, advance liability tracking, and revenue distribution (Sri Lankan Rupees - LKR)
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="metrics-grid">
        <div className="metric-card highlight">
          <div className="metric-icon-wrap bg-indigo-100 text-indigo-700">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="metric-label">Gross Sales Revenue</div>
            <div className="metric-value">{formatCurrency(totalRevenue)}</div>
            <div className="metric-sub">Across {totalOrders} completed orders</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap bg-amber-100 text-amber-700">
            <Wallet size={24} />
          </div>
          <div>
            <div className="metric-label">Active Customer Advances Held</div>
            <div className="metric-value">{formatCurrency(totalAdvanceHeld)}</div>
            <div className="metric-sub">Prepaid customer credits</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap bg-emerald-100 text-emerald-700">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="metric-label">Average Order Value (AOV)</div>
            <div className="metric-value">{formatCurrency(averageOrderValue)}</div>
            <div className="metric-sub">Per transaction basket size</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap bg-purple-100 text-purple-700">
            <Users size={24} />
          </div>
          <div>
            <div className="metric-label">Active Customer Accounts</div>
            <div className="metric-value">{customers.length}</div>
            <div className="metric-sub">Profiles registered in POS</div>
          </div>
        </div>
      </div>

      {/* Analytics 2-Column Section */}
      <div className="analytics-charts-grid">
        {/* Payment Methods Distribution */}
        <div className="analytics-card">
          <div className="card-header-row">
            <PieChart size={20} className="text-indigo-600" />
            <h3 className="card-title">Payment Settlement Breakdown</h3>
          </div>

          <div className="payment-modes-list">
            {Object.keys(paymentBreakdown).length === 0 ? (
              <p className="text-gray-400 py-6 text-center">No payment data recorded yet.</p>
            ) : (
              Object.entries(paymentBreakdown).map(([method, amount], idx) => {
                const percent = totalRevenue > 0 ? ((amount / totalRevenue) * 100).toFixed(1) : 0;
                return (
                  <div key={idx} className="payment-bar-row">
                    <div className="payment-bar-info">
                      <span className="font-semibold text-gray-800">{method}</span>
                      <span className="font-mono text-gray-600">
                        {formatCurrency(amount)} ({percent}%)
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${percent}%`, backgroundColor: idx % 2 === 0 ? '#4f46e5' : '#10b981' }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="analytics-card">
          <div className="card-header-row">
            <Award size={20} className="text-amber-500" />
            <h3 className="card-title">Top Selling Menu / Products</h3>
          </div>

          <div className="top-products-list">
            {topProducts.length === 0 ? (
              <p className="text-gray-400 py-6 text-center">No products sold yet.</p>
            ) : (
              topProducts.map((p, idx) => (
                <div key={idx} className="top-product-item">
                  <div className="rank-badge">#{idx + 1}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.qty} units sold</div>
                  </div>
                  <div className="font-mono font-bold text-gray-800">
                    {formatCurrency(p.revenue)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
