import React from 'react';
import { usePOS } from '../context/POSContext';
import { Printer, CheckCircle, X, ArrowLeft, Download } from 'lucide-react';

export function ReceiptModal({ order, onClose }) {
  const { storeSettings, customers, formatCurrency } = usePOS();

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  // Check if customer has remaining advance balance
  const customerRecord = order.customer.id
    ? customers.find((c) => c.id === order.customer.id)
    : null;

  return (
    <div className="modal-backdrop receipt-backdrop">
      <div className="receipt-modal-container">
        {/* Top Control Bar (Hidden during print) */}
        <div className="receipt-actions-header no-print">
          <div className="receipt-success-badge">
            <CheckCircle size={20} className="text-emerald-500" />
            <span>Transaction Completed Successfully</span>
          </div>

          <div className="receipt-btn-group">
            <button onClick={handlePrint} className="btn-print-receipt">
              <Printer size={18} />
              <span>Print Receipt</span>
            </button>
            <button onClick={onClose} className="btn-close-receipt">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* AUTHENTIC 80MM THERMAL RECEIPT SLIP */}
        <div className="thermal-receipt-paper" id="printable-receipt">
          {/* Header */}
          <div className="receipt-center-text">
            <h2 className="receipt-store-title">{storeSettings.name}</h2>
            <p className="receipt-tagline">{storeSettings.tagline}</p>
            <p className="receipt-meta">{storeSettings.address}</p>
            <p className="receipt-meta">{storeSettings.city}</p>
            <p className="receipt-meta">Tel: {storeSettings.phone}</p>
          </div>

          <div className="receipt-divider-dashed" />

          {/* Invoice Info */}
          <div className="receipt-info-grid">
            <div>
              <strong>Invoice #:</strong> {order.id}
            </div>
            <div>
              <strong>Date:</strong> {order.date}
            </div>
            <div>
              <strong>Cashier:</strong> {order.cashier}
            </div>
            <div>
              <strong>Customer:</strong> {order.customer.name}
            </div>
            {order.customer.phone && order.customer.phone !== '-' && (
              <div>
                <strong>Phone:</strong> {order.customer.phone}
              </div>
            )}
          </div>

          <div className="receipt-divider-dashed" />

          {/* Items Table */}
          <table className="receipt-items-table">
            <thead>
              <tr>
                <th className="text-left">Item</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Price</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="text-left item-name-cell">
                    {item.name}
                    {item.discountPercent > 0 && (
                      <span className="receipt-disc-note"> (-{item.discountPercent}%)</span>
                    )}
                  </td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">{formatCurrency(item.price)}</td>
                  <td className="text-right">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="receipt-divider-dashed" />

          {/* Totals */}
          <div className="receipt-totals-block">
            <div className="receipt-calc-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>

            {order.cartDiscount > 0 && (
              <div className="receipt-calc-row discount-row">
                <span>Discount Applied:</span>
                <span>-{formatCurrency(order.cartDiscount)}</span>
              </div>
            )}

            <div className="receipt-calc-row">
              <span>Tax {order.taxRate > 0 ? `(${order.taxName || 'SSCL'} ${order.taxRate}%)` : '(0%)'}:</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>

            <div className="receipt-calc-row grand-total-row">
              <span>TOTAL INVOICE:</span>
              <span>{formatCurrency(order.grandTotal)}</span>
            </div>

            {/* ADVANCE SETTLEMENT HIGHLIGHT */}
            {order.advanceUsed > 0 && (
              <div className="receipt-advance-block">
                <div className="receipt-calc-row advance-highlight-row">
                  <span>Customer Advance Offset:</span>
                  <span>-{formatCurrency(order.advanceUsed)}</span>
                </div>
                <div className="receipt-calc-row net-balance-row">
                  <span>Net Payable Amount:</span>
                  <span>{formatCurrency(order.payableAfterAdvance)}</span>
                </div>
              </div>
            )}

            <div className="receipt-calc-row payment-mode-row">
              <span>Payment Mode:</span>
              <span>{order.paymentMethod}</span>
            </div>

            {order.paidAmount > 0 && (
              <div className="receipt-calc-row">
                <span>Amount Tendered:</span>
                <span>{formatCurrency(order.paidAmount)}</span>
              </div>
            )}

            {order.changeAmount > 0 && (
              <div className="receipt-calc-row">
                <span>Change Returned:</span>
                <span>{formatCurrency(order.changeAmount)}</span>
              </div>
            )}

            {customerRecord && (
              <div className="receipt-advance-balance-note">
                <span>Remaining Advance Balance:</span>
                <span>{formatCurrency(customerRecord.advanceBalance)}</span>
              </div>
            )}
          </div>

          <div className="receipt-divider-dashed" />

          {/* Barcode & Footer */}
          <div className="receipt-footer-center">
            <div className="receipt-barcode-box">
              <div className="barcode-bars" />
              <div className="barcode-number">*{order.id.replace('INV-', '')}*</div>
            </div>
            <p className="receipt-thank-you">{storeSettings.receiptFooter}</p>
            <p className="receipt-software-tag">Powered by ApexPOS • Colombo, Sri Lanka</p>
          </div>
        </div>

        {/* Bottom Actions (No print) */}
        <div className="receipt-footer-actions no-print">
          <button onClick={onClose} className="btn-new-sale">
            Start Next Sale
          </button>
        </div>
      </div>
    </div>
  );
}
