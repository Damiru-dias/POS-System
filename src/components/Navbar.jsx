import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import {
  ShoppingBag,
  History,
  Package,
  Users,
  WalletCards,
  BarChart3,
  Vault,
  UserCheck,
  Clock,
  Sparkles,
} from 'lucide-react';

export function Navbar({ onOpenShiftModal }) {
  const {
    activeView,
    setActiveView,
    activeStaff,
    currentShift,
    cart,
    storeSettings,
    formatCurrency,
  } = usePOS();

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'register', label: 'Cashier POS', icon: ShoppingBag, badge: cart.length > 0 ? cart.length : null },
    { id: 'advances', label: 'Customer Advances', icon: WalletCards, highlight: true },
    { id: 'orders', label: 'Sales History', icon: History },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const drawerTotal =
    currentShift.openingCash +
    currentShift.cashSales +
    currentShift.cashAdvance -
    currentShift.payouts;

  return (
    <header className="navbar-container">
      <div className="navbar-brand">
        <div className="brand-logo">
          <Sparkles className="brand-icon" size={20} />
        </div>
        <div>
          <div className="brand-title">{storeSettings.name}</div>
          <div className="brand-tagline">Apex Enterprise POS • Sri Lanka (LKR)</div>
        </div>
      </div>

      <nav className="navbar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`nav-btn ${isActive ? 'active' : ''} ${item.highlight ? 'nav-highlight' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="navbar-actions">
        {/* Cash Drawer Status in LKR */}
        <button
          onClick={onOpenShiftModal}
          className="drawer-pill"
          title="Click to view Cash Drawer / Shift status"
        >
          <Vault size={16} className="text-emerald-500" />
          <div className="drawer-text">
            <span className="drawer-label">Drawer Cash (LKR)</span>
            <span className="drawer-val">{formatCurrency(drawerTotal)}</span>
          </div>
        </button>

        {/* Staff Switcher */}
        <div className="staff-pill">
          <UserCheck size={16} />
          <span>{activeStaff.name}</span>
          <span className="role-tag">{activeStaff.role}</span>
        </div>

        {/* Live Clock */}
        <div className="time-pill">
          <Clock size={15} />
          <span>{currentTime}</span>
        </div>
      </div>
    </header>
  );
}
