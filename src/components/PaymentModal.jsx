import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  Layers,
  Wallet,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export function PaymentModal({ onClose }) {
  const {
    grandTotal,
    selectedCustomer,
    completeOrder,
    storeSettings,
    formatCurrency,
  } = usePOS();

  // Advance Redemption State
  const maxAdvanceUsable = selectedCustomer
    ? Math.min(selectedCustomer.advanceBalance, grandTotal)
    : 0;

  const [useAdvance, setUseAdvance] = useState(maxAdvanceUsable > 0);
  const [advanceAmountToUse, setAdvanceAmountToUse] = useState(maxAdvanceUsable);

  // If useAdvance is enabled, remaining net payable:
  const effectiveAdvanceUsed = useAdvance ? parseFloat(advanceAmountToUse || 0) : 0;
  const netPayable = Math.max(0, grandTotal - effectiveAdvanceUsed);

  // Payment method: 'cash' | 'card' | 'qr' | 'split'
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Cash denomination & change states — CLEAR (empty) by default on every new popup
  const [cashGiven, setCashGiven] = useState('');
  const [notes, setNotes] = useState('');

  // Split state
  const [splitCash, setSplitCash] = useState('');
  const [splitCard, setSplitCard] = useState('');

  const cashGivenFloat = parseFloat(cashGiven) || 0;
  const changeDue = Math.max(0, cashGivenFloat - netPayable);

  // Quick cash buttons for Sri Lankan Rupee banknotes
  const quickCashPresets = [
    { label: 'Exact', amount: netPayable },
    { label: 'Rs. 500', amount: 500 },
    { label: 'Rs. 1,000', amount: 1000 },
    { label: 'Rs. 2,000', amount: 2000 },
    { label: 'Rs. 5,000', amount: 5000 },
    { label: 'Rs. 10,000', amount: 10000 },
  ];

  const handleCheckoutSubmit = () => {
    if (netPayable > 0 && paymentMethod === 'cash') {
      if (!cashGiven || cashGivenFloat <= 0) {
        alert(`Please enter the cash tendered by the customer, or click "Exact" (${formatCurrency(netPayable)})!`);
        return;
      }
      if (cashGivenFloat < netPayable) {
        alert(`Insufficient cash tendered! Minimum required: ${formatCurrency(netPayable)}`);
        return;
      }
    }

    let finalMethodLabel = 'Cash';
    let splitBreakdown = null;

    if (netPayable === 0 && effectiveAdvanceUsed > 0) {
      finalMethodLabel = 'Customer Advance Balance';
    } else if (paymentMethod === 'card') {
      finalMethodLabel = effectiveAdvanceUsed > 0 ? 'Card + Advance' : 'Credit / Debit Card';
    } else if (paymentMethod === 'qr') {
      finalMethodLabel = effectiveAdvanceUsed > 0 ? 'LankaQR + Advance' : 'LankaQR / Online';
    } else if (paymentMethod === 'split') {
      finalMethodLabel = 'Split (Cash + Card)';
      splitBreakdown = {
        Cash: parseFloat(splitCash) || 0,
        Card: parseFloat(splitCard) || 0,
      };
    } else {
      finalMethodLabel = effectiveAdvanceUsed > 0 ? 'Cash + Advance' : 'Cash';
    }

    completeOrder({
      paymentMethod: finalMethodLabel,
      paidAmount: paymentMethod === 'cash' ? cashGivenFloat : netPayable,
      changeAmount: paymentMethod === 'cash' ? changeDue : 0,
      advanceUsed: effectiveAdvanceUsed,
      splitBreakdown,
      notes,
    });

    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card payment-modal-card">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Complete Checkout & Settlement</h2>
            <p className="modal-sub">
              Select payment tender and apply customer advance credits (Sri Lankan Rupee - LKR)
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        {/* Bill Breakdown Top Bar */}
        <div className="payment-summary-strip">
          <div className="summary-col">
            <span className="summary-strip-lbl">Invoice Total</span>
            <span className="summary-strip-val">{formatCurrency(grandTotal)}</span>
          </div>
          {effectiveAdvanceUsed > 0 && (
            <div className="summary-col advance-applied">
              <span className="summary-strip-lbl">Advance Offset</span>
              <span className="summary-strip-val">-{formatCurrency(effectiveAdvanceUsed)}</span>
            </div>
          )}
          <div className="summary-col net-col">
            <span className="summary-strip-lbl">Net Due Now</span>
            <span className="summary-strip-val highlight">{formatCurrency(netPayable)}</span>
          </div>
        </div>

        {/* SECTION 1: CUSTOMER ADVANCE REDEMPTION */}
        {selectedCustomer && selectedCustomer.advanceBalance > 0 && (
          <div className="advance-redemption-panel">
            <div className="advance-panel-header">
              <div className="advance-icon-wrap">
                <Wallet size={20} className="text-amber-600" />
              </div>
              <div className="advance-panel-details">
                <div className="advance-panel-title">
                  {selectedCustomer.name}'s Advance Account
                </div>
                <div className="advance-balance-note">
                  Available Balance: <strong>{formatCurrency(selectedCustomer.advanceBalance)}</strong>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={useAdvance}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUseAdvance(checked);
                    setAdvanceAmountToUse(checked ? maxAdvanceUsable : 0);
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {useAdvance && (
              <div className="advance-slider-box">
                <div className="advance-amount-input-row">
                  <span>Redeem Amount:</span>
                  <div className="advance-input-container">
                    <span className="text-xs text-amber-700 mr-1">{storeSettings.currency.trim()}</span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max={maxAdvanceUsable}
                      value={advanceAmountToUse}
                      onChange={(e) => {
                        const val = Math.min(
                          maxAdvanceUsable,
                          Math.max(0, parseFloat(e.target.value) || 0)
                        );
                        setAdvanceAmountToUse(val);
                      }}
                      className="advance-number-input"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdvanceAmountToUse(maxAdvanceUsable)}
                    className="btn-use-max"
                  >
                    Use Max ({formatCurrency(maxAdvanceUsable)})
                  </button>
                </div>
                <div className="advance-remaining-hint">
                  Remaining Advance after this bill:{' '}
                  {formatCurrency(selectedCustomer.advanceBalance - effectiveAdvanceUsed)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: TENDER PAYMENT METHODS (IF NET PAYABLE > 0) */}
        {netPayable > 0 ? (
          <div className="tender-section">
            <div className="tender-tabs">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`tender-tab ${paymentMethod === 'cash' ? 'active' : ''}`}
              >
                <Banknote size={18} />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`tender-tab ${paymentMethod === 'card' ? 'active' : ''}`}
              >
                <CreditCard size={18} />
                <span>Card (POS)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('qr')}
                className={`tender-tab ${paymentMethod === 'qr' ? 'active' : ''}`}
              >
                <QrCode size={18} />
                <span>LankaQR</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('split')}
                className={`tender-tab ${paymentMethod === 'split' ? 'active' : ''}`}
              >
                <Layers size={18} />
                <span>Split Tender</span>
              </button>
            </div>

            {/* TAB CONTENT: CASH */}
            {paymentMethod === 'cash' && (
              <div className="tender-content-card">
                <div className="cash-input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="input-label">Cash Tendered by Customer (LKR)</label>
                    {cashGiven && (
                      <button
                        type="button"
                        onClick={() => setCashGiven('')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#e11d48',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        ✕ Clear Input
                      </button>
                    )}
                  </div>
                  <div className="cash-input-wrap">
                    <span className="currency-symbol text-base font-bold mr-2 text-indigo-600">
                      {storeSettings.currency.trim()}
                    </span>
                    <input
                      type="number"
                      step="10"
                      placeholder="0.00"
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      className="cash-input-field"
                      autoFocus
                    />
                    {cashGiven && (
                      <button
                        type="button"
                        onClick={() => setCashGiven('')}
                        className="clear-search-btn"
                        title="Clear cash amount"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Cash Presets */}
                <div className="quick-presets">
                  {quickCashPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCashGiven(preset.amount.toFixed(2))}
                      className="preset-btn"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Change Calculation Box */}
                <div
                  className={`change-due-box ${
                    cashGiven === ''
                      ? 'neutral'
                      : cashGivenFloat >= netPayable
                      ? 'positive'
                      : 'insufficient'
                  }`}
                >
                  <div className="change-label">Change to Return:</div>
                  <div className="change-amount">
                    {cashGiven === ''
                      ? `${storeSettings.currency}0.00`
                      : cashGivenFloat >= netPayable
                      ? formatCurrency(changeDue)
                      : `Needs ${formatCurrency(netPayable - cashGivenFloat)} more`}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: CARD */}
            {paymentMethod === 'card' && (
              <div className="tender-content-card card-view">
                <div className="card-mock-terminal">
                  <CreditCard size={40} className="text-indigo-600 animate-pulse" />
                  <h4>Waiting for Card Tap / Insert</h4>
                  <p>Accepts Visa, Mastercard, and LankaPay cards on wireless EFTPOS terminal.</p>
                  <div className="terminal-amount">{formatCurrency(netPayable)}</div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: QR */}
            {paymentMethod === 'qr' && (
              <div className="tender-content-card qr-view">
                <div className="qr-box">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=LANKAQR_PAYMENT_APEX_POS"
                    alt="Payment QR"
                    className="qr-image"
                  />
                  <h4>LankaQR Digital Payment</h4>
                  <p>Scan with any Sri Lankan Banking App (FriMi, Genie, Q+, Flash, iPay, Solo)</p>
                  <div className="qr-amount">{formatCurrency(netPayable)}</div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SPLIT */}
            {paymentMethod === 'split' && (
              <div className="tender-content-card split-view">
                <div className="split-row">
                  <label>Cash Portion (Rs.):</label>
                  <input
                    type="number"
                    value={splitCash}
                    onChange={(e) => setSplitCash(e.target.value)}
                    className="split-input"
                  />
                </div>
                <div className="split-row">
                  <label>Card Portion (Rs.):</label>
                  <input
                    type="number"
                    value={splitCard}
                    onChange={(e) => setSplitCard(e.target.value)}
                    className="split-input"
                  />
                </div>
                <div className="split-total-check">
                  Total Split: {formatCurrency(parseFloat(splitCash || 0) + parseFloat(splitCard || 0))} / {formatCurrency(netPayable)}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* When advance covers 100% of the bill */
          <div className="full-advance-settled-box">
            <CheckCircle2 size={44} className="text-emerald-500" />
            <h3>100% Settled by Customer Advance!</h3>
            <p>
              The customer's advance balance covers the entire bill of {formatCurrency(grandTotal)}.
              No cash or card transaction required.
            </p>
          </div>
        )}

        {/* Notes row */}
        <div className="order-notes-input">
          <input
            type="text"
            placeholder="Order / Delivery notes (Optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="notes-field"
          />
        </div>

        {/* Footer Actions */}
        <div className="payment-modal-footer">
          <button type="button" onClick={onClose} className="btn-cancel">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCheckoutSubmit}
            className="btn-complete-sale"
          >
            <ShieldCheck size={20} />
            <span>Complete Sale & Print Receipt</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
