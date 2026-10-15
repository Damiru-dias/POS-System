import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import {
  History,
  Search,
  Printer,
  FileSpreadsheet,
  Receipt,
  User,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export function OrdersView({ onSelectReceipt }) {
  const { orders, formatCurrency } = usePOS();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      o.id.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q) ||
      o.cashier.toLowerCase().includes(q) ||
      o.paymentMethod.toLowerCase().includes(q)
    );
  });

  return (
    <div className="orders-view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Sales History & Transactions</h1>
          <p className="view-sub">
            Review past sales, reprinted receipts, tax breakdown, and payment methods (Sri Lankan Rupee - LKR)
          </p>
        </div>

        <div className="table-search-box">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search invoice #, customer, payment mode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="table-search-input"
          />
        </div>
      </div>

      <div className="data-table-card">
        <div className="table-responsive">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date / Time</th>
                <th>Customer</th>
                <th>Items Qty</th>
                <th>Subtotal</th>
                <th>Tax</th>
                <th>Grand Total</th>
                <th>Advance Offset</th>
                <th>Net Paid</th>
                <th>Payment Tender</th>
                <th>Cashier</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="font-mono text-indigo-600 font-bold">{order.id}</td>
                  <td>{order.date}</td>
                  <td className="font-medium text-gray-800">{order.customer.name}</td>
                  <td>
                    {order.items.reduce((s, i) => s + i.quantity, 0)} items
                  </td>
                  <td>{formatCurrency(order.subtotal)}</td>
                  <td>
                    <div className="font-medium">{formatCurrency(order.tax)}</div>
                    {order.taxRate > 0 && (
                      <div className="text-[10px] text-gray-400 font-mono">
                        ({order.taxName || 'SSCL'} {order.taxRate}%)
                      </div>
                    )}
                  </td>
                  <td className="font-bold">{formatCurrency(order.grandTotal)}</td>
                  <td>
                    {order.advanceUsed > 0 ? (
                      <span className="badge badge-deposit">
                        -{formatCurrency(order.advanceUsed)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="font-mono font-bold text-emerald-600">
                    {formatCurrency(order.payableAfterAdvance || order.grandTotal)}
                  </td>
                  <td>{order.paymentMethod}</td>
                  <td>{order.cashier}</td>
                  <td>
                    <button
                      onClick={() => onSelectReceipt(order)}
                      className="btn-table-action"
                      title="Reprint Receipt"
                    >
                      <Printer size={15} />
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center py-10 text-gray-400">
                    No transactions recorded yet. Complete sales in Cashier POS!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
