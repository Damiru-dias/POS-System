import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import {
  Vault,
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
} from 'lucide-react';

export function ShiftModal({ onClose }) {
  const {
    currentShift,
    recordPayout,
    closeCurrentShift,
    openNewShift,
    activeStaff,
    formatCurrency,
    storeSettings,
  } = usePOS();

  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutReason, setPayoutReason] = useState('');
  const [showPayoutForm, setShowPayoutForm] = useState(false);

  // Closing drawer reconciliation
  const [countedCash, setCountedCash] = useState('');
  const [isClosingShift, setIsClosingShift] = useState(false);
  const [newOpeningCash, setNewOpeningCash] = useState('15000.00');

  const expectedCash =
    currentShift.openingCash +
    currentShift.cashSales +
    currentShift.cashAdvance -
    currentShift.payouts;

  const countedFloat = parseFloat(countedCash) || 0;
  const cashDiscrepancy = countedCash !== '' ? countedFloat - expectedCash : 0;

  const handlePayoutSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(payoutAmount);
    if (!val || val <= 0) return;

    recordPayout(val, payoutReason || 'Petty cash expense');
    setPayoutAmount('');
    setPayoutReason('');
    setShowPayoutForm(false);
  };

  const handleCloseShift = () => {
    closeCurrentShift();
    setIsClosingShift(false);
  };

  const handleOpenShift = () => {
    openNewShift(newOpeningCash);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card shift-modal-card">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Vault className="text-emerald-600" size={24} />
            <div>
              <h2 className="modal-title">Cash Drawer & Shift Reconciliation</h2>
              <p className="modal-sub">
                Shift #{currentShift.id} • Cashier: {currentShift.openedBy} • Sri Lankan Rupee (LKR)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        {currentShift.isOpen ? (
          <div className="shift-content">
            {/* Drawer Math Grid */}
            <div className="drawer-breakdown-grid">
              <div className="drawer-box">
                <span className="drawer-box-lbl">Opening Float</span>
                <span className="drawer-box-val">{formatCurrency(currentShift.openingCash)}</span>
              </div>
              <div className="drawer-box">
                <span className="drawer-box-lbl">+ Cash Sales</span>
                <span className="drawer-box-val text-emerald-600">+{formatCurrency(currentShift.cashSales)}</span>
              </div>
              <div className="drawer-box">
                <span className="drawer-box-lbl">+ Cash Advances</span>
                <span className="drawer-box-val text-emerald-600">+{formatCurrency(currentShift.cashAdvance)}</span>
              </div>
              <div className="drawer-box">
                <span className="drawer-box-lbl">- Payouts / Drops</span>
                <span className="drawer-box-val text-rose-600">-{formatCurrency(currentShift.payouts)}</span>
              </div>
            </div>

            <div className="expected-cash-banner">
              <div className="expected-title">Expected Cash in Till:</div>
              <div className="expected-amount">{formatCurrency(expectedCash)}</div>
            </div>

            {/* Shift Actions */}
            {!showPayoutForm && !isClosingShift && (
              <div className="shift-actions-row">
                <button
                  onClick={() => setShowPayoutForm(true)}
                  className="btn-payout-drawer"
                >
                  <ArrowUpCircle size={16} />
                  <span>Record Cash Payout</span>
                </button>
                <button
                  onClick={() => setIsClosingShift(true)}
                  className="btn-close-drawer"
                >
                  <span>Close Register Shift</span>
                </button>
              </div>
            )}

            {/* Payout Form */}
            {showPayoutForm && (
              <form onSubmit={handlePayoutSubmit} className="payout-subform">
                <h4>Record Drawer Payout / Cash Drop ({storeSettings.currency.trim()})</h4>
                <div className="form-row-2">
                  <input
                    type="number"
                    step="10"
                    placeholder="Amount (LKR)"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    required
                    className="form-control"
                  />
                  <input
                    type="text"
                    placeholder="Reason (e.g. Milk delivery, packaging supplies)"
                    value={payoutReason}
                    onChange={(e) => setPayoutReason(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="flex gap-2 justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setShowPayoutForm(false)}
                    className="btn-secondary py-1 text-sm"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary py-1 text-sm">
                    Confirm Payout
                  </button>
                </div>
              </form>
            )}

            {/* Closing Reconciliation */}
            {isClosingShift && (
              <div className="closing-subform">
                <h4>Count & Reconcile Physical Cash (LKR)</h4>
                <p className="text-xs text-gray-500 mb-2">
                  Count Rupee banknotes (Rs. 5000, 1000, 500, 100, coins) in till:
                </p>
                <div className="form-group">
                  <input
                    type="number"
                    step="10"
                    placeholder="Counted cash amount (Rs.)"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    className="form-control text-lg font-mono font-bold"
                    autoFocus
                  />
                </div>

                {countedCash !== '' && (
                  <div className={`discrepancy-card ${cashDiscrepancy === 0 ? 'perfect' : cashDiscrepancy > 0 ? 'over' : 'short'}`}>
                    <div>
                      {cashDiscrepancy === 0 ? '✓ Balanced! Zero discrepancy' : cashDiscrepancy > 0 ? 'Cash Overage:' : 'Cash Shortage:'}
                    </div>
                    <div className="font-mono font-bold">
                      {cashDiscrepancy > 0 ? `+${formatCurrency(cashDiscrepancy)}` : `-${formatCurrency(Math.abs(cashDiscrepancy))}`}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => setIsClosingShift(false)}
                    className="btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseShift}
                    className="btn-danger"
                  >
                    Confirm & Close Shift
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* When Shift is closed */
          <div className="shift-closed-state">
            <AlertCircle size={44} className="text-amber-500 mb-2" />
            <h3>Shift is Currently Closed</h3>
            <p className="text-sm text-gray-500 mb-4">
              Open a new shift register with an opening cash float (LKR) to begin taking transactions.
            </p>

            <div className="form-group text-left max-w-xs mx-auto">
              <label>Opening Cash Float ({storeSettings.currency.trim()})</label>
              <input
                type="number"
                step="100"
                value={newOpeningCash}
                onChange={(e) => setNewOpeningCash(e.target.value)}
                className="form-control font-mono font-bold text-center text-lg"
              />
            </div>

            <button onClick={handleOpenShift} className="btn-primary mt-4 w-full">
              Open New Shift ({formatCurrency(newOpeningCash)})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
