import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import {
  Wallet,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  CheckCircle,
  Clock,
  User,
  DollarSign,
  FileText,
  BadgeAlert,
} from 'lucide-react';

export function AdvancesView() {
  const {
    advanceTransactions,
    customers,
    recordAdvanceDeposit,
    addCustomer,
    formatCurrency,
    storeSettings,
  } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'Deposit' | 'Redemption'
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Form states for deposit modal
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [reason, setReason] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Metrics
  const totalHeldAdvance = customers.reduce((sum, c) => sum + (c.advanceBalance || 0), 0);
  const totalDeposited = advanceTransactions
    .filter((tx) => tx.type === 'Deposit' || tx.amount > 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const totalRedeemed = advanceTransactions
    .filter((tx) => tx.type === 'Redemption' || tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  // Filter transactions
  const filteredTxs = advanceTransactions.filter((tx) => {
    const matchesType =
      filterType === 'all' ||
      (filterType === 'Deposit' && (tx.type === 'Deposit' || tx.amount > 0)) ||
      (filterType === 'Redemption' && (tx.type === 'Redemption' || tx.amount < 0));

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      tx.customerName.toLowerCase().includes(q) ||
      tx.id.toLowerCase().includes(q) ||
      (tx.reason && tx.reason.toLowerCase().includes(q));

    return matchesType && matchesSearch;
  });

  const handleDepositSubmit = (e) => {
    e.preventDefault();
    const amountVal = parseFloat(depositAmount);
    if (!amountVal || amountVal <= 0) {
      alert('Please enter a valid advance deposit amount!');
      return;
    }

    let customerIdToUse = selectedCustomerId;

    if (isNewCustomer) {
      if (!newCustName.trim()) {
        alert('Please enter the customer name!');
        return;
      }
      const newCust = addCustomer({
        name: newCustName,
        phone: newCustPhone || '-',
        advanceBalance: 0,
      });
      customerIdToUse = newCust.id;
    }

    if (!customerIdToUse) {
      alert('Please select or specify a customer!');
      return;
    }

    recordAdvanceDeposit({
      customerId: customerIdToUse,
      amount: amountVal,
      paymentMethod,
      reason: reason || 'Customer Advance Deposit',
    });

    // Reset and close
    setShowDepositModal(false);
    setDepositAmount('');
    setReason('');
    setSelectedCustomerId('');
    setIsNewCustomer(false);
    setNewCustName('');
    setNewCustPhone('');
  };

  return (
    <div className="advances-view-container">
      {/* Top Header */}
      <div className="view-header">
        <div>
          <h1 className="view-title">Customer Advance & Booking Ledger</h1>
          <p className="view-sub">
            Track customer deposits, pre-orders, and advance balance redemptions in Sri Lankan Rupees (LKR)
          </p>
        </div>

        <button
          onClick={() => setShowDepositModal(true)}
          className="btn-create-advance"
        >
          <PlusCircle size={18} />
          <span>Collect Advance Deposit</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card highlight">
          <div className="metric-icon-wrap bg-amber-100 text-amber-700">
            <Wallet size={24} />
          </div>
          <div>
            <div className="metric-label">Active Customer Advances Held</div>
            <div className="metric-value">{formatCurrency(totalHeldAdvance)}</div>
            <div className="metric-sub">Current liability awaiting redemption</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap bg-emerald-100 text-emerald-700">
            <ArrowDownLeft size={24} />
          </div>
          <div>
            <div className="metric-label">Total Deposits Collected</div>
            <div className="metric-value">{formatCurrency(totalDeposited)}</div>
            <div className="metric-sub">Lifetime advance receipts</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap bg-indigo-100 text-indigo-700">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <div className="metric-label">Total Advances Redeemed</div>
            <div className="metric-value">{formatCurrency(totalRedeemed)}</div>
            <div className="metric-sub">Offset against sales invoices</div>
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="data-table-card">
        {/* Table Controls */}
        <div className="table-controls-bar">
          <div className="table-search-box">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, Tx ID, or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="table-search-input"
            />
          </div>

          <div className="filter-pill-group">
            <button
              onClick={() => setFilterType('all')}
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
            >
              All Records
            </button>
            <button
              onClick={() => setFilterType('Deposit')}
              className={`filter-btn ${filterType === 'Deposit' ? 'active' : ''}`}
            >
              Deposits (+In)
            </button>
            <button
              onClick={() => setFilterType('Redemption')}
              className={`filter-btn ${filterType === 'Redemption' ? 'active' : ''}`}
            >
              Redemptions (-Out)
            </button>
          </div>
        </div>

        {/* Advance Records Table */}
        <div className="table-responsive">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th>Tx ID</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Amount (LKR)</th>
                <th>Payment Tender</th>
                <th>Purpose / Notes</th>
                <th>Cashier</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxs.map((tx) => {
                const isDeposit = tx.type === 'Deposit' || tx.amount > 0;
                return (
                  <tr key={tx.id}>
                    <td className="font-mono text-indigo-600 font-medium">
                      {tx.id}
                    </td>
                    <td>{tx.date}</td>
                    <td className="font-semibold text-gray-800">
                      {tx.customerName}
                    </td>
                    <td>
                      <span className={`badge ${isDeposit ? 'badge-deposit' : 'badge-redeem'}`}>
                        {isDeposit ? '+ Deposit' : '- Offset'}
                      </span>
                    </td>
                    <td className={`font-mono font-bold ${isDeposit ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {isDeposit ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                    </td>
                    <td>{tx.paymentMethod}</td>
                    <td className="text-gray-600 text-sm">{tx.reason || '-'}</td>
                    <td>{tx.cashier}</td>
                    <td>
                      <span className="badge badge-success">{tx.status || 'Active'}</span>
                    </td>
                  </tr>
                );
              })}

              {filteredTxs.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">
                    No advance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Advance Deposit Modal */}
      {showDepositModal && (
        <div className="modal-backdrop">
          <div className="modal-card advance-deposit-modal">
            <h2 className="modal-title">Collect Advance Deposit</h2>
            <p className="modal-sub">
              Issue an advance payment receipt and credit the customer's POS account (Sri Lankan Rupees)
            </p>

            <form onSubmit={handleDepositSubmit} className="advance-form">
              {/* Customer Selector / Creator */}
              <div className="form-toggle-row">
                <button
                  type="button"
                  onClick={() => setIsNewCustomer(false)}
                  className={`cust-toggle-btn ${!isNewCustomer ? 'active' : ''}`}
                >
                  Existing Customer
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewCustomer(true)}
                  className={`cust-toggle-btn ${isNewCustomer ? 'active' : ''}`}
                >
                  + New Customer
                </button>
              </div>

              {!isNewCustomer ? (
                <div className="form-group">
                  <label>Select Customer</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                    className="form-control"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) — Current Balance: {formatCurrency(c.advanceBalance)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Customer Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Priyantha Dissanayake"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      required
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number (LK)</label>
                    <input
                      type="text"
                      placeholder="e.g. +94 77 123 4567"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="form-control"
                    />
                  </div>
                </div>
              )}

              {/* Amount & Tender */}
              <div className="form-row-2">
                <div className="form-group">
                  <label>Advance Deposit Amount (LKR - Rs.)</label>
                  <input
                    type="number"
                    step="10"
                    min="100"
                    placeholder="e.g. 5000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                    className="form-control font-mono font-bold text-lg"
                  />
                </div>

                <div className="form-group">
                  <label>Payment Tender Received</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="form-control"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit / Debit Card">Credit / Debit Card (POS)</option>
                    <option value="LankaQR / Online">LankaQR / FriMi / Genie / iPay</option>
                    <option value="Bank Transfer">Bank Transfer / Commercial Bank</option>
                  </select>
                </div>
              </div>

              {/* Reason / Reference */}
              <div className="form-group">
                <label>Deposit Purpose / Booking Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Wedding cake advance, catering deposit, bulk preorder"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Collect {depositAmount ? formatCurrency(depositAmount) : 'Rs. 0.00'} & Issue Advance Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
