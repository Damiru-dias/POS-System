import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import {
  Users,
  Search,
  Plus,
  Wallet,
  Phone,
  Mail,
  Award,
  ShoppingCart,
} from 'lucide-react';

export function CustomersView({ onOpenAdvanceModal }) {
  const { customers, addCustomer, setSelectedCustomer, setActiveView, formatCurrency, storeSettings } = usePOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCust, setNewCust] = useState({
    name: '',
    phone: '',
    email: '',
    advanceBalance: '0',
    notes: '',
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newCust.name.trim()) return;

    addCustomer({
      name: newCust.name,
      phone: newCust.phone || '-',
      email: newCust.email || '-',
      advanceBalance: parseFloat(newCust.advanceBalance) || 0,
      notes: newCust.notes || '',
    });

    setShowAddModal(false);
    setNewCust({ name: '', phone: '', email: '', advanceBalance: '0', notes: '' });
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="customers-view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Customer Relationship & Credit Accounts</h1>
          <p className="view-sub">
            Manage customer directories, prepaid advance deposits, and purchase history (Sri Lankan Rupees - LKR)
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={18} />
          <span>New Customer Profile</span>
        </button>
      </div>

      <div className="data-table-card">
        <div className="table-controls-bar">
          <div className="table-search-box">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone number, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="table-search-input"
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Contact Details (LK)</th>
                <th>Advance Balance</th>
                <th>Total Spent</th>
                <th>Loyalty Points</th>
                <th>Customer Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((cust) => (
                <tr key={cust.id}>
                  <td>
                    <div className="font-bold text-gray-900">{cust.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{cust.id}</div>
                  </td>
                  <td>
                    <div className="text-sm text-gray-700 flex items-center gap-1">
                      <Phone size={13} className="text-gray-400" />
                      {cust.phone}
                    </div>
                    {cust.email && cust.email !== '-' && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail size={12} className="text-gray-400" />
                        {cust.email}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="advance-cell-wrapper">
                      <span className={`font-mono font-bold text-base ${cust.advanceBalance > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {formatCurrency(cust.advanceBalance)}
                      </span>
                      {cust.advanceBalance > 0 && (
                        <span className="badge badge-deposit text-xs">Active Credit</span>
                      )}
                    </div>
                  </td>
                  <td className="font-mono font-medium">{formatCurrency(cust.totalSpent)}</td>
                  <td>
                    <span className="loyalty-pill">
                      <Award size={13} className="text-amber-500" />
                      {cust.loyaltyPoints} pts
                    </span>
                  </td>
                  <td className="text-sm text-gray-600">{cust.notes || '-'}</td>
                  <td>
                    <div className="action-buttons-group">
                      <button
                        onClick={() => {
                          setSelectedCustomer(cust);
                          setActiveView('register');
                        }}
                        className="btn-table-action"
                        title="Select customer for POS checkout"
                      >
                        <ShoppingCart size={14} />
                        <span>Select</span>
                      </button>
                      <button
                        onClick={onOpenAdvanceModal}
                        className="btn-table-action advance-action"
                        title="Add advance balance"
                      >
                        <Wallet size={14} />
                        <span>+ Advance</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No customers found matching search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2 className="modal-title">Create Customer Profile</h2>
            <form onSubmit={handleAddSubmit} className="advance-form mt-4">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  required
                  className="form-control"
                  placeholder="e.g. Kasun Jayawardena"
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Phone Number (LK)</label>
                  <input
                    type="text"
                    value={newCust.phone}
                    onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                    className="form-control"
                    placeholder="e.g. +94 77 123 4567"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={newCust.email}
                    onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                    className="form-control"
                    placeholder="e.g. kasun@example.lk"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Initial Advance Balance ({storeSettings.currency.trim()})</label>
                <input
                  type="number"
                  step="100"
                  value={newCust.advanceBalance}
                  onChange={(e) => setNewCust({ ...newCust, advanceBalance: e.target.value })}
                  className="form-control font-mono"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Preferences / Order Notes</label>
                <input
                  type="text"
                  value={newCust.notes}
                  onChange={(e) => setNewCust({ ...newCust, notes: e.target.value })}
                  className="form-control"
                  placeholder="Customer preference or booking note"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
