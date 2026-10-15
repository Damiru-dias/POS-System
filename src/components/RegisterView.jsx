import React, { useState, useRef, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Tag,
  CreditCard,
  User,
  Wallet,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  Percent,
  CheckCircle2,
  AlertTriangle,
  X,
  Package,
  Layers,
  ArrowRight,
  Check,
  Settings2,
} from 'lucide-react';

export function RegisterView({ onOpenPaymentModal, onOpenAdvanceModal }) {
  const {
    products,
    categories,
    cart,
    addToCart,
    removeFromCart,
    updateCartQty,
    updateItemDiscount,
    clearCart,
    selectedCustomer,
    setSelectedCustomer,
    customers,
    subtotal,
    discountAmount,
    taxAmount,
    grandTotal,
    cartDiscount,
    setCartDiscount,
    storeSettings,
    formatCurrency,
    taxConfig,
    updateTaxConfig,
  } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [discountInputModal, setDiscountInputModal] = useState(false);
  const [tempDiscountPercent, setTempDiscountPercent] = useState('');

  // Tax Settings Modal State
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [tempTaxName, setTempTaxName] = useState('');
  const [tempTaxRate, setTempTaxRate] = useState('');
  const [tempTaxEnabled, setTempTaxEnabled] = useState(true);
  
  // Barcode Mode & Suggestions State
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  // Quantity Popup Modal State
  const [quantityModalProduct, setQuantityModalProduct] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  const searchInputRef = useRef(null);
  const searchBoxRef = useRef(null);
  const quantityInputRef = useRef(null);

  // Play crisp POS scanner beep sound
  const playScannerBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, audioCtx.currentTime); // 1.76kHz crisp scanner beep
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch (e) {
      // AudioContext may be restricted by autoplay policy
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut listener for high-speed cashiering
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F4 to open checkout
      if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) onOpenPaymentModal();
      }
      // F2 to focus barcode search
      if (e.key === 'F2') {
        e.preventDefault();
        setBarcodeMode(true);
        searchInputRef.current?.focus();
        setShowSuggestions(true);
      }
      // Esc to clear search or close quantity modal
      if (e.key === 'Escape') {
        if (quantityModalProduct) {
          setQuantityModalProduct(null);
        } else {
          setSearchQuery('');
          setShowSuggestions(false);
          setBarcodeMode(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, onOpenPaymentModal, quantityModalProduct]);

  // When quantity modal opens, auto-focus its input
  useEffect(() => {
    if (quantityModalProduct) {
      setTimeout(() => {
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
      }, 50);
    }
  }, [quantityModalProduct]);

  // Compute live Barcode Suggestions
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const barcodeSuggestions = trimmedQuery
    ? products.filter(
        (p) =>
          p.barcode.toLowerCase().includes(trimmedQuery) ||
          p.sku.toLowerCase().includes(trimmedQuery) ||
          p.name.toLowerCase().includes(trimmedQuery)
      )
    : barcodeMode
    ? products
    : [];

  // Reset active suggestion index when query changes
  useEffect(() => {
    setActiveSuggestionIndex(0);
  }, [searchQuery]);

  // Filter products for the main grid catalog
  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      selectedCategory === 'all' || prod.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      prod.name.toLowerCase().includes(q) ||
      prod.sku.toLowerCase().includes(q) ||
      prod.barcode.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  // Handle clicking the Barcode Icon
  const handleBarcodeIconClick = () => {
    setBarcodeMode(true);
    setShowSuggestions(true);
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  };

  // Open quantity popup for a specific product
  const triggerQuantityPopup = (product) => {
    if (product.stock <= 0) {
      alert(`"${product.name}" is currently OUT OF STOCK!`);
      return;
    }
    playScannerBeep();
    setQuantityModalProduct(product);
    setModalQuantity(1);
    setShowSuggestions(false);
  };

  // Handle key navigation in barcode search input
  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (barcodeSuggestions.length > 0) {
        setActiveSuggestionIndex((prev) =>
          prev < barcodeSuggestions.length - 1 ? prev + 1 : 0
        );
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (barcodeSuggestions.length > 0) {
        setActiveSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : barcodeSuggestions.length - 1
        );
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();

      // Case 1: Exactly 1 suggestion matches the entered digits
      if (barcodeSuggestions.length === 1) {
        triggerQuantityPopup(barcodeSuggestions[0]);
        return;
      }

      // Case 2: User navigated with arrow keys to a highlighted suggestion
      if (
        barcodeSuggestions.length > 1 &&
        activeSuggestionIndex >= 0 &&
        activeSuggestionIndex < barcodeSuggestions.length
      ) {
        triggerQuantityPopup(barcodeSuggestions[activeSuggestionIndex]);
        return;
      }

      // Case 3: Exact barcode match exists
      const exactMatch = products.find(
        (p) =>
          p.barcode.toLowerCase() === trimmedQuery ||
          p.sku.toLowerCase() === trimmedQuery
      );
      if (exactMatch) {
        triggerQuantityPopup(exactMatch);
        return;
      }
    }
  };

  // Confirm and add from Quantity Modal
  const handleConfirmQuantityAdd = (e) => {
    e?.preventDefault();
    if (!quantityModalProduct) return;

    const qty = Math.max(1, parseInt(modalQuantity) || 1);
    if (qty > quantityModalProduct.stock) {
      alert(
        `Quantity (${qty}) exceeds available stock (${quantityModalProduct.stock} units)!`
      );
      return;
    }

    addToCart(quantityModalProduct, qty);
    setQuantityModalProduct(null);
    setSearchQuery('');
    setBarcodeMode(false);
    setShowSuggestions(false);

    // Refocus barcode input for next scan
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="pos-layout">
      {/* LEFT: Product Catalog & Fast Grid */}
      <div className="catalog-section">
        {/* Search & Barcode Header */}
        <div className="catalog-header" ref={searchBoxRef}>
          <div className="search-box-wrapper">
            <div className={`search-box ${barcodeMode ? 'barcode-mode-active' : ''}`}>
              {/* Clickable Barcode Icon */}
              <button
                type="button"
                onClick={handleBarcodeIconClick}
                className={`barcode-toggle-btn ${barcodeMode ? 'active' : ''}`}
                title="Click to enter barcode number or scan (Press F2)"
              >
                <Barcode size={22} className="barcode-svg" />
                <span className="barcode-click-hint">BARCODE</span>
              </button>

              <input
                ref={searchInputRef}
                type="text"
                placeholder={
                  barcodeMode
                    ? 'Enter barcode digits (e.g. 8901001)...'
                    : 'Scan Barcode or Search by Name/SKU (Press F2)...'
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleSearchKeyDown}
                className="search-input"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                  className="clear-search-btn"
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </div>

            {/* LIVE PARALLEL BARCODE SUGGESTIONS DROPDOWN */}
            {showSuggestions && barcodeSuggestions.length > 0 && (
              <div className="barcode-suggestions-dropdown">
                <div className="suggestions-header">
                  <span className="suggestions-title">
                    <Barcode size={14} className="text-indigo-600" />
                    Matching Barcodes ({barcodeSuggestions.length})
                  </span>
                  <span className="suggestions-hint">
                    {barcodeSuggestions.length === 1
                      ? 'Press [Enter] to open Quantity window'
                      : 'Use [↑/↓] & [Enter] to select'}
                  </span>
                </div>

                <div className="suggestions-list">
                  {barcodeSuggestions.map((product, idx) => {
                    const isSelected = idx === activeSuggestionIndex;
                    const isOut = product.stock <= 0;

                    return (
                      <div
                        key={product.id}
                        onClick={() => triggerQuantityPopup(product)}
                        onMouseEnter={() => setActiveSuggestionIndex(idx)}
                        className={`suggestion-item ${isSelected ? 'active' : ''} ${isOut ? 'disabled' : ''}`}
                      >
                        <div className="suggestion-barcode-pill">
                          <Barcode size={13} className="text-indigo-500" />
                          <span className="barcode-text font-mono font-bold">
                            {product.barcode}
                          </span>
                        </div>

                        <div className="suggestion-name-box">
                          <div className="suggestion-name">{product.name}</div>
                          <div className="suggestion-meta">
                            <span>SKU: {product.sku}</span>
                            <span>•</span>
                            <span className="capitalize">{product.category}</span>
                          </div>
                        </div>

                        <div className="suggestion-right-info">
                          <span className="suggestion-price font-mono font-bold">
                            {formatCurrency(product.price)}
                          </span>
                          <span
                            className={`suggestion-stock-tag ${isOut ? 'out' : product.stock <= product.minStock ? 'low' : 'ok'}`}
                          >
                            {isOut ? 'Out of Stock' : `${product.stock} in stock`}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="btn-select-suggestion"
                          title="Select & choose quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="category-scroll">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`category-pill ${isActive ? 'active' : ''}`}
                >
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="products-grid">
          {filteredProducts.map((prod) => {
            const inCart = cart.find((item) => item.product.id === prod.id);
            const isOutOfStock = prod.stock <= 0;
            const isLowStock = prod.stock > 0 && prod.stock <= prod.minStock;

            return (
              <div
                key={prod.id}
                onClick={() => !isOutOfStock && triggerQuantityPopup(prod)}
                className={`product-card ${isOutOfStock ? 'disabled' : ''} ${inCart ? 'selected' : ''}`}
              >
                <div
                  className="product-color-strip"
                  style={{ backgroundColor: prod.color || '#4f46e5' }}
                />

                <div className="product-card-body">
                  <div className="product-meta">
                    <span className="product-sku font-mono">{prod.barcode}</span>
                    {isOutOfStock ? (
                      <span className="stock-tag out">Out of stock</span>
                    ) : isLowStock ? (
                      <span className="stock-tag low">Low: {prod.stock} left</span>
                    ) : (
                      <span className="stock-tag ok">{prod.stock} in stock</span>
                    )}
                  </div>

                  <h3 className="product-name">{prod.name}</h3>

                  <div className="product-footer">
                    <span className="product-price">
                      {formatCurrency(prod.price)}
                    </span>
                    {inCart && (
                      <span className="cart-count-badge">
                        {inCart.quantity} in cart
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="empty-catalog-state">
              <ShoppingBag size={48} className="empty-icon" />
              <h3>No items found</h3>
              <p>Try searching for a different item name, barcode, or change categories.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: High-Speed POS Cart Panel */}
      <div className="cart-section">
        {/* Customer Select Bar & Advance Credit Status */}
        <div className="cart-customer-header">
          <div className="customer-selector-row">
            <User size={18} className="text-gray-400" />
            <select
              value={selectedCustomer ? selectedCustomer.id : ''}
              onChange={(e) => {
                const found = customers.find((c) => c.id === e.target.value);
                setSelectedCustomer(found || null);
              }}
              className="customer-select"
            >
              <option value="">👤 Walk-in Customer (Default)</option>
              {customers.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.name} ({cust.phone}) • Advance: {formatCurrency(cust.advanceBalance)}
                </option>
              ))}
            </select>

            <button
              onClick={onOpenAdvanceModal}
              className="advance-quick-btn"
              title="Collect Advance Deposit or View Customer Advances"
            >
              <Wallet size={15} />
              <span>+ Advance</span>
            </button>
          </div>

          {/* ADVANCE BALANCE NOTICE IF SELECTED CUSTOMER HAS ADVANCE */}
          {selectedCustomer && (
            <div
              className={`customer-advance-alert ${selectedCustomer.advanceBalance > 0 ? 'has-balance' : 'zero-balance'}`}
            >
              <div className="advance-alert-content">
                <span className="advance-alert-title">
                  {selectedCustomer.name} Advance Balance:
                </span>
                <span className="advance-alert-amount">
                  {formatCurrency(selectedCustomer.advanceBalance)}
                </span>
              </div>
              {selectedCustomer.advanceBalance > 0 ? (
                <span className="advance-alert-hint">
                  ✓ Available to deduct from bill during payment
                </span>
              ) : (
                <button
                  onClick={onOpenAdvanceModal}
                  className="advance-deposit-link"
                >
                  Deposit Advance Now
                </button>
              )}
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="cart-items-container">
          {cart.length === 0 ? (
            <div className="empty-cart-state">
              <ShoppingBag size={40} className="text-gray-300" />
              <div className="empty-cart-text">Cart is empty</div>
              <div className="empty-cart-sub">
                Scan barcode, click barcode icon, or tap products on the left
              </div>
            </div>
          ) : (
            <div className="cart-items-list">
              {cart.map((item) => {
                const itemTotal =
                  item.product.price *
                  item.quantity *
                  (1 - (item.discountPercent || 0) / 100);

                return (
                  <div key={item.product.id} className="cart-item-row">
                    <div className="cart-item-info">
                      <div className="cart-item-title">{item.product.name}</div>
                      <div className="cart-item-price-unit">
                        {formatCurrency(item.product.price)} / {item.product.unit}
                        {item.discountPercent > 0 && (
                          <span className="item-disc-badge">
                            -{item.discountPercent}% off
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="qty-controls">
                      <button
                        onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                        className="qty-btn"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                        className="qty-btn"
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* Subtotal & Delete */}
                    <div className="cart-item-actions">
                      <span className="cart-item-total">
                        {formatCurrency(itemTotal)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="delete-item-btn"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Calculation & Totals */}
        <div className="cart-footer">
          {/* Quick Order Discount Trigger */}
          <div className="order-discount-bar">
            <div className="discount-display">
              <Tag size={15} className="text-indigo-500" />
              <span>Discount:</span>
              <button
                onClick={() => setDiscountInputModal(true)}
                className="edit-discount-btn"
              >
                {cartDiscount.value > 0
                  ? `${cartDiscount.value}${cartDiscount.type === 'percent' ? '%' : ' ' + storeSettings.currency.trim()} applied`
                  : 'Add Discount'}
              </button>
            </div>
            {cartDiscount.value > 0 && (
              <button
                onClick={() => setCartDiscount({ type: 'fixed', value: 0 })}
                className="remove-disc-btn"
              >
                Remove
              </button>
            )}
          </div>

          <div className="bill-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="summary-row discount">
                <span>Total Discount</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="summary-row tax-summary-row">
              <div className="tax-label-group">
                <span className="tax-main-label">Tax</span>
                {taxConfig.isEnabled && parseFloat(taxConfig.rate) > 0 ? (
                  <span className="tax-subpart">
                    ({taxConfig.name} • {taxConfig.rate}%)
                  </span>
                ) : (
                  <span className="tax-subpart-disabled">(Exempt • 0%)</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setTempTaxName(taxConfig.name || 'SSCL');
                    setTempTaxRate(taxConfig.rate !== undefined ? taxConfig.rate.toString() : '8');
                    setTempTaxEnabled(taxConfig.isEnabled !== false);
                    setShowTaxModal(true);
                  }}
                  className="tax-settings-btn"
                  title="Configure Tax Name and Percentage Rate"
                >
                  <Settings2 size={13} />
                  <span>Set Tax</span>
                </button>
              </div>
              <span className="font-mono font-semibold">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="summary-row grand-total">
              <span>Total Payable</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="cart-bottom-actions">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="btn-clear-cart"
              title="Clear current cart"
            >
              <RotateCcw size={16} />
              <span>Clear</span>
            </button>

            <button
              onClick={onOpenPaymentModal}
              disabled={cart.length === 0}
              className="btn-checkout"
            >
              <CreditCard size={20} />
              <div className="checkout-btn-text">
                <span className="checkout-title">PAY / CHECKOUT</span>
                <span className="checkout-shortcut">Press F4 • {formatCurrency(grandTotal)}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* QUANTITY POPUP WINDOW MODAL (Triggered on Barcode / Enter) */}
      {quantityModalProduct && (
        <div className="modal-backdrop">
          <div className="modal-card quantity-popup-card">
            <div className="qty-popup-header">
              <div className="qty-prod-badge-strip" style={{ backgroundColor: quantityModalProduct.color || '#4f46e5' }} />
              <div className="flex-1">
                <div className="qty-popup-barcode font-mono text-indigo-600 font-bold flex items-center gap-1">
                  <Barcode size={16} />
                  <span>{quantityModalProduct.barcode}</span>
                  <span className="text-gray-400 font-normal">({quantityModalProduct.sku})</span>
                </div>
                <h2 className="qty-popup-prod-name">{quantityModalProduct.name}</h2>
                <div className="qty-popup-meta">
                  <span className="text-sm font-bold text-gray-800">
                    Unit Price: {formatCurrency(quantityModalProduct.price)}
                  </span>
                  <span className="text-xs text-gray-500">
                    • In Stock: {quantityModalProduct.stock} {quantityModalProduct.unit}s
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuantityModalProduct(null)}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmQuantityAdd} className="qty-popup-body">
              <div className="qty-input-label">Select / Enter Quantity to Add:</div>

              {/* Big Quantity Stepper */}
              <div className="qty-stepper-big">
                <button
                  type="button"
                  onClick={() => setModalQuantity((prev) => Math.max(1, prev - 1))}
                  className="btn-qty-step"
                >
                  <Minus size={22} />
                </button>

                <input
                  ref={quantityInputRef}
                  type="number"
                  min="1"
                  max={quantityModalProduct.stock}
                  value={modalQuantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setModalQuantity(Math.min(quantityModalProduct.stock, Math.max(1, val)));
                  }}
                  className="qty-big-input font-mono font-bold"
                  autoFocus
                />

                <button
                  type="button"
                  onClick={() =>
                    setModalQuantity((prev) =>
                      Math.min(quantityModalProduct.stock, prev + 1)
                    )
                  }
                  disabled={modalQuantity >= quantityModalProduct.stock}
                  className="btn-qty-step"
                >
                  <Plus size={22} />
                </button>
              </div>

              {/* Fast Quantity Presets */}
              <div className="qty-preset-pills">
                {[1, 2, 3, 5, 10, 12].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() =>
                      setModalQuantity(Math.min(quantityModalProduct.stock, num))
                    }
                    className={`qty-preset-btn ${modalQuantity === num ? 'active' : ''}`}
                    disabled={num > quantityModalProduct.stock}
                  >
                    +{num}
                  </button>
                ))}
              </div>

              {/* Total Calculation Preview */}
              <div className="qty-calc-preview">
                <div className="preview-lbl">Total Item Price:</div>
                <div className="preview-amount font-mono font-bold text-indigo-700">
                  {formatCurrency(quantityModalProduct.price * modalQuantity)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="qty-popup-actions">
                <button
                  type="button"
                  onClick={() => setQuantityModalProduct(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel (Esc)
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-2 flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  <span>Add {modalQuantity} to Cart (Enter)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tax Configuration Modal */}
      {showTaxModal && (
        <div className="modal-backdrop">
          <div className="modal-card mini-modal">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Configure Tax</h3>
                <p className="modal-sub">Set tax name and percentage rate</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTaxModal(false)}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const rateVal = parseFloat(tempTaxRate) || 0;
                updateTaxConfig({
                  name: tempTaxName.trim() || 'Tax',
                  rate: rateVal,
                  isEnabled: tempTaxEnabled,
                });
                setShowTaxModal(false);
              }}
              className="advance-form mt-2"
            >
              <div className="form-group">
                <label>Tax Subpart Name</label>
                <input
                  type="text"
                  placeholder="e.g. SSCL, VAT, GST, Service Tax"
                  value={tempTaxName}
                  onChange={(e) => setTempTaxName(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Tax Rate Percentage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g. 8 or 18"
                  value={tempTaxRate}
                  onChange={(e) => setTempTaxRate(e.target.value)}
                  className="form-control font-mono font-bold"
                  required
                />
              </div>

              {/* Quick Presets */}
              <div className="form-group">
                <label className="text-xs text-gray-500">Quick Sri Lanka Presets:</label>
                <div className="flex gap-2">
                  {[
                    { label: '0% (Exempt)', name: 'Exempt', rate: '0' },
                    { label: '2.5% (SSCL)', name: 'SSCL', rate: '2.5' },
                    { label: '8% (Standard)', name: 'SSCL', rate: '8' },
                    { label: '18% (VAT)', name: 'VAT', rate: '18' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTempTaxName(preset.name);
                        setTempTaxRate(preset.rate);
                        setTempTaxEnabled(true);
                      }}
                      className="preset-btn text-xs py-1 px-2"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded">
                <span className="text-xs font-semibold text-gray-700">Apply Tax to Bills:</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={tempTaxEnabled}
                    onChange={(e) => setTempTaxEnabled(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowTaxModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Tax Setting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discount Adjustment Modal */}
      {discountInputModal && (
        <div className="modal-backdrop">
          <div className="modal-card mini-modal">
            <h3 className="modal-title">Apply Bill Discount</h3>
            <p className="modal-desc">Enter flat discount amount or percentage:</p>

            <div className="discount-toggle-group">
              <button
                onClick={() => setCartDiscount((prev) => ({ ...prev, type: 'percent' }))}
                className={`toggle-type-btn ${cartDiscount.type === 'percent' ? 'active' : ''}`}
              >
                Percentage (%)
              </button>
              <button
                onClick={() => setCartDiscount((prev) => ({ ...prev, type: 'fixed' }))}
                className={`toggle-type-btn ${cartDiscount.type === 'fixed' ? 'active' : ''}`}
              >
                Flat Amount ({storeSettings.currency.trim()})
              </button>
            </div>

            <div className="discount-input-field">
              <input
                type="number"
                placeholder={cartDiscount.type === 'percent' ? 'e.g. 10%' : 'e.g. 500'}
                value={tempDiscountPercent}
                onChange={(e) => setTempDiscountPercent(e.target.value)}
                autoFocus
                className="number-input"
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setDiscountInputModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const val = parseFloat(tempDiscountPercent) || 0;
                  setCartDiscount((prev) => ({ ...prev, value: val }));
                  setDiscountInputModal(false);
                  setTempDiscountPercent('');
                }}
                className="btn-primary"
              >
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
