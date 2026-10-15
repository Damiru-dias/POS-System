import React, { useState } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Navbar } from './components/Navbar';
import { RegisterView } from './components/RegisterView';
import { AdvancesView } from './components/AdvancesView';
import { OrdersView } from './components/OrdersView';
import { InventoryView } from './components/InventoryView';
import { CustomersView } from './components/CustomersView';
import { AnalyticsView } from './components/AnalyticsView';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ShiftModal } from './components/ShiftModal';

function MainPOSApp() {
  const { activeView, setActiveView, receiptOrder, setReceiptOrder } = usePOS();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <Navbar onOpenShiftModal={() => setShowShiftModal(true)} />

      {/* Main Screen Content */}
      <main className="main-content">
        {activeView === 'register' && (
          <RegisterView
            onOpenPaymentModal={() => setShowPaymentModal(true)}
            onOpenAdvanceModal={() => setActiveView('advances')}
          />
        )}

        {activeView === 'advances' && <AdvancesView />}

        {activeView === 'orders' && (
          <OrdersView onSelectReceipt={(order) => setReceiptOrder(order)} />
        )}

        {activeView === 'inventory' && <InventoryView />}

        {activeView === 'customers' && (
          <CustomersView onOpenAdvanceModal={() => setActiveView('advances')} />
        )}

        {activeView === 'analytics' && <AnalyticsView />}
      </main>

      {/* Checkout / Payment Modal */}
      {showPaymentModal && (
        <PaymentModal onClose={() => setShowPaymentModal(false)} />
      )}

      {/* Printable Thermal Receipt Modal */}
      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {/* Cash Drawer & Shift Modal */}
      {showShiftModal && (
        <ShiftModal onClose={() => setShowShiftModal(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <POSProvider>
      <MainPOSApp />
    </POSProvider>
  );
}
