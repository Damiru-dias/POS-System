import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_CUSTOMERS,
  INITIAL_ADVANCE_TRANSACTIONS,
  INITIAL_STAFF,
  STORE_SETTINGS,
} from '../data/mockData';

const POSContext = createContext();

export function POSProvider({ children }) {
  // Load from localStorage or mock (with LKR namespace)
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('apex_pos_lkr_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('apex_pos_lkr_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [advanceTransactions, setAdvanceTransactions] = useState(() => {
    const saved = localStorage.getItem('apex_pos_lkr_advances');
    return saved ? JSON.parse(saved) : INITIAL_ADVANCE_TRANSACTIONS;
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('apex_pos_lkr_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cartDiscount, setCartDiscount] = useState({ type: 'fixed', value: 0 }); // type: 'fixed' | 'percent'
  const [activeStaff, setActiveStaff] = useState(INITIAL_STAFF[0]);
  const [activeView, setActiveView] = useState('register'); // 'register' | 'orders' | 'inventory' | 'advances' | 'customers' | 'analytics'
  const [receiptOrder, setReceiptOrder] = useState(null); // When set, opens receipt modal

  const [currentShift, setCurrentShift] = useState(() => {
    const saved = localStorage.getItem('apex_pos_lkr_shift');
    return saved
      ? JSON.parse(saved)
      : {
          id: 'SHIFT-' + Date.now().toString().slice(-4),
          openedAt: new Date().toISOString(),
          openedBy: INITIAL_STAFF[0].name,
          openingCash: 15000.0, // Rs. 15,000 float
          cashSales: 0.0,
          cashAdvance: 0.0,
          payouts: 0.0,
          isOpen: true,
        };
  });

  const [taxConfig, setTaxConfig] = useState(() => {
    const saved = localStorage.getItem('apex_pos_lkr_tax_config');
    return saved
      ? JSON.parse(saved)
      : {
          name: STORE_SETTINGS.taxName || 'SSCL',
          rate: STORE_SETTINGS.taxRate || 8.0,
          isEnabled: true,
        };
  });

  // Sync states to localStorage
  useEffect(() => {
    localStorage.setItem('apex_pos_lkr_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('apex_pos_lkr_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('apex_pos_lkr_advances', JSON.stringify(advanceTransactions));
  }, [advanceTransactions]);

  useEffect(() => {
    localStorage.setItem('apex_pos_lkr_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('apex_pos_lkr_shift', JSON.stringify(currentShift));
  }, [currentShift]);

  useEffect(() => {
    localStorage.setItem('apex_pos_lkr_tax_config', JSON.stringify(taxConfig));
  }, [taxConfig]);

  const updateTaxConfig = (newConfig) => {
    setTaxConfig((prev) => ({ ...prev, ...newConfig }));
  };

  // Currency Formatter Helper
  const formatCurrency = (val) => {
    const n = parseFloat(val) || 0;
    return `${STORE_SETTINGS.currency}${n.toLocaleString('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Cart Operations
  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { product, quantity: qty, discountPercent: 0, notes: '' }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQty = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const updateItemDiscount = (productId, discountPercent) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, discountPercent: Math.max(0, Math.min(100, discountPercent)) } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setCartDiscount({ type: 'fixed', value: 0 });
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => {
    const itemTotal = item.product.price * item.quantity;
    const discountAmount = (itemTotal * (item.discountPercent || 0)) / 100;
    return acc + (itemTotal - discountAmount);
  }, 0);

  const discountAmount =
    cartDiscount.type === 'percent'
      ? (subtotal * cartDiscount.value) / 100
      : Math.min(subtotal, cartDiscount.value);

  const effectiveTaxRate = taxConfig.isEnabled ? parseFloat(taxConfig.rate || 0) : 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * effectiveTaxRate) / 100;
  const grandTotal = taxableAmount + taxAmount;

  // Record Advance Deposit from Customer
  const recordAdvanceDeposit = ({ customerId, amount, paymentMethod, reason }) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    const newAdvance = {
      id: `ADV-${Date.now().toString().slice(-4)}`,
      customerId,
      customerName: customer.name,
      amount: parseFloat(amount),
      paymentMethod,
      reason: reason || 'Advance Deposit / Account Credit',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      cashier: activeStaff.name,
      status: 'Active',
      type: 'Deposit',
    };

    setAdvanceTransactions((prev) => [newAdvance, ...prev]);

    // Update customer advance balance
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, advanceBalance: Number((c.advanceBalance + parseFloat(amount)).toFixed(2)) }
          : c
      )
    );

    // Update shift cash if deposited via Cash
    if (paymentMethod === 'Cash' && currentShift.isOpen) {
      setCurrentShift((prev) => ({
        ...prev,
        cashAdvance: Number((prev.cashAdvance + parseFloat(amount)).toFixed(2)),
      }));
    }

    // Refresh selected customer state if matched
    if (selectedCustomer && selectedCustomer.id === customerId) {
      setSelectedCustomer((prev) => ({
        ...prev,
        advanceBalance: Number((prev.advanceBalance + parseFloat(amount)).toFixed(2)),
      }));
    }

    return newAdvance;
  };

  // Checkout and Order Completion
  const completeOrder = ({
    paymentMethod,
    paidAmount = grandTotal,
    changeAmount = 0,
    advanceUsed = 0,
    splitBreakdown = null,
    notes = '',
  }) => {
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const finalAmountAfterAdvance = Math.max(0, grandTotal - advanceUsed);

    const newOrder = {
      id: invoiceNumber,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      cashier: activeStaff.name,
      customer: selectedCustomer
        ? {
            id: selectedCustomer.id,
            name: selectedCustomer.name,
            phone: selectedCustomer.phone,
          }
        : { id: null, name: 'Walk-in Customer', phone: '-' },
      items: cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        price: item.product.price,
        quantity: item.quantity,
        discountPercent: item.discountPercent || 0,
        total: Number(
          (
            item.product.price * item.quantity *
            (1 - (item.discountPercent || 0) / 100)
          ).toFixed(2)
        ),
      })),
      subtotal: Number(subtotal.toFixed(2)),
      cartDiscount: Number(discountAmount.toFixed(2)),
      tax: Number(taxAmount.toFixed(2)),
      taxRate: effectiveTaxRate,
      taxName: taxConfig.name,
      grandTotal: Number(grandTotal.toFixed(2)),
      advanceUsed: Number(advanceUsed.toFixed(2)),
      payableAfterAdvance: Number(finalAmountAfterAdvance.toFixed(2)),
      paidAmount: Number(paidAmount.toFixed(2)),
      changeAmount: Number(changeAmount.toFixed(2)),
      paymentMethod,
      splitBreakdown,
      notes,
      status: 'Completed',
    };

    // 1. Deduct Product Stock
    setProducts((prev) =>
      prev.map((prod) => {
        const cartItem = cart.find((item) => item.product.id === prod.id);
        if (cartItem) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - cartItem.quantity),
          };
        }
        return prod;
      })
    );

    // 2. Adjust Customer Advance & Total Spent if customer exists
    if (selectedCustomer) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === selectedCustomer.id) {
            const newAdvance = Number((c.advanceBalance - advanceUsed).toFixed(2));
            const newTotalSpent = Number((c.totalSpent + grandTotal).toFixed(2));
            const newPoints = c.loyaltyPoints + Math.floor(grandTotal / 100);
            return {
              ...c,
              advanceBalance: Math.max(0, newAdvance),
              totalSpent: newTotalSpent,
              loyaltyPoints: newPoints,
            };
          }
          return c;
        })
      );

      // If advance was deducted, log an Advance Redemption transaction
      if (advanceUsed > 0) {
        const redemptionTx = {
          id: `ADV-RED-${Date.now().toString().slice(-4)}`,
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          amount: -Number(advanceUsed.toFixed(2)),
          paymentMethod: 'Advance Offset',
          reason: `Offset applied to Invoice #${invoiceNumber}`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          cashier: activeStaff.name,
          status: 'Redeemed',
          type: 'Redemption',
        };
        setAdvanceTransactions((prev) => [redemptionTx, ...prev]);
      }
    }

    // 3. Register cash in Shift Drawer
    const cashCollected =
      paymentMethod === 'Cash'
        ? Math.min(paidAmount - changeAmount, finalAmountAfterAdvance)
        : splitBreakdown?.Cash || 0;

    if (cashCollected > 0 && currentShift.isOpen) {
      setCurrentShift((prev) => ({
        ...prev,
        cashSales: Number((prev.cashSales + cashCollected).toFixed(2)),
      }));
    }

    // 4. Save order to orders history
    setOrders((prev) => [newOrder, ...prev]);

    // 5. Clear cart
    clearCart();

    // 6. Set receipt for prompt printing
    setReceiptOrder(newOrder);

    return newOrder;
  };

  // Product CRUD
  const addProduct = (newProd) => {
    const id = 'prod-' + Date.now();
    const prod = { ...newProd, id };
    setProducts((prev) => [prod, ...prev]);
  };

  const updateProduct = (updatedProd) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProd.id ? updatedProd : p))
    );
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Customer creation
  const addCustomer = (customerData) => {
    const newCust = {
      id: 'cust-' + Date.now(),
      ...customerData,
      advanceBalance: parseFloat(customerData.advanceBalance || 0),
      totalSpent: 0,
      loyaltyPoints: 0,
    };
    setCustomers((prev) => [newCust, ...prev]);
    return newCust;
  };

  // Shift Drawer Actions
  const recordPayout = (amount, reason) => {
    setCurrentShift((prev) => ({
      ...prev,
      payouts: Number((prev.payouts + parseFloat(amount)).toFixed(2)),
    }));
  };

  const closeCurrentShift = () => {
    setCurrentShift((prev) => ({
      ...prev,
      isOpen: false,
      closedAt: new Date().toISOString(),
    }));
  };

  const openNewShift = (openingCash) => {
    setCurrentShift({
      id: 'SHIFT-' + Date.now().toString().slice(-4),
      openedAt: new Date().toISOString(),
      openedBy: activeStaff.name,
      openingCash: parseFloat(openingCash) || 15000,
      cashSales: 0,
      cashAdvance: 0,
      payouts: 0,
      isOpen: true,
    });
  };

  return (
    <POSContext.Provider
      value={{
        products,
        categories: INITIAL_CATEGORIES,
        cart,
        selectedCustomer,
        setSelectedCustomer,
        cartDiscount,
        setCartDiscount,
        activeStaff,
        setActiveStaff,
        activeView,
        setActiveView,
        customers,
        addCustomer,
        advanceTransactions,
        recordAdvanceDeposit,
        orders,
        currentShift,
        recordPayout,
        closeCurrentShift,
        openNewShift,
        receiptOrder,
        setReceiptOrder,
        addToCart,
        removeFromCart,
        updateCartQty,
        updateItemDiscount,
        clearCart,
        subtotal,
        discountAmount,
        taxAmount,
        grandTotal,
        completeOrder,
        addProduct,
        updateProduct,
        deleteProduct,
        storeSettings: STORE_SETTINGS,
        formatCurrency,
        taxConfig,
        updateTaxConfig,
        effectiveTaxRate,
      }}
    >
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
}
