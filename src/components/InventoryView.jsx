import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  Tag,
  Barcode,
} from 'lucide-react';

export function InventoryView() {
  const { products, categories, addProduct, updateProduct, deleteProduct, formatCurrency, storeSettings } = usePOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'low' | 'out'
  const [editProductModal, setEditProductModal] = useState(null); // product object or 'new'

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'beverages',
    price: '',
    cost: '',
    stock: '',
    minStock: 5,
    unit: 'pcs',
  });

  const openNewModal = () => {
    setFormData({
      name: '',
      sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      barcode: '890' + Math.floor(1000 + Math.random() * 9000),
      category: 'beverages',
      price: '',
      cost: '',
      stock: '20',
      minStock: 5,
      unit: 'pcs',
    });
    setEditProductModal('new');
  };

  const openEditModal = (p) => {
    setFormData({
      ...p,
      price: p.price.toString(),
      cost: p.cost.toString(),
      stock: p.stock.toString(),
      minStock: p.minStock.toString(),
    });
    setEditProductModal(p);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    const productPayload = {
      name: formData.name,
      sku: formData.sku,
      barcode: formData.barcode,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      cost: parseFloat(formData.cost) || 0,
      stock: parseInt(formData.stock) || 0,
      minStock: parseInt(formData.minStock) || 5,
      unit: formData.unit || 'pcs',
      color: '#4f46e5',
    };

    if (editProductModal === 'new') {
      addProduct(productPayload);
    } else {
      updateProduct({ ...productPayload, id: editProductModal.id });
    }

    setEditProductModal(null);
  };

  // Filter
  const filteredProducts = products.filter((p) => {
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'low' && p.stock > 0 && p.stock <= p.minStock) ||
      (stockFilter === 'out' && p.stock <= 0);

    const q = searchQuery.toLowerCase().trim();
    const matchesQ =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q);

    return matchesCat && matchesStock && matchesQ;
  });

  return (
    <div className="inventory-view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Inventory & Stock Catalog</h1>
          <p className="view-sub">
            Monitor real-time stock levels, profit margins, cost of goods, and barcodes (Sri Lankan Rupees - LKR)
          </p>
        </div>

        <button onClick={openNewModal} className="btn-primary">
          <Plus size={18} />
          <span>Add New Product</span>
        </button>
      </div>

      <div className="data-table-card">
        {/* Table Filters */}
        <div className="table-controls-bar">
          <div className="table-search-box">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="table-search-input"
            />
          </div>

          <div className="filter-pill-group">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="table-select-filter"
            >
              <option value="all">All Categories</option>
              {categories.filter(c => c.id !== 'all').map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="table-select-filter"
            >
              <option value="all">All Stock Statuses</option>
              <option value="low">Low Stock Alerts</option>
              <option value="out">Out of Stock Only</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="table-responsive">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th>Product Details</th>
                <th>SKU / Barcode</th>
                <th>Category</th>
                <th>Cost Price (LKR)</th>
                <th>Selling Price (LKR)</th>
                <th>Margin</th>
                <th>Stock Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const margin = p.price > 0 ? (((p.price - p.cost) / p.price) * 100).toFixed(0) : 0;
                const isOut = p.stock <= 0;
                const isLow = p.stock > 0 && p.stock <= p.minStock;

                return (
                  <tr key={p.id}>
                    <td>
                      <div className="font-semibold text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">Unit: {p.unit}</div>
                    </td>
                    <td>
                      <div className="font-mono text-xs text-gray-700">{p.sku}</div>
                      <div className="font-mono text-xs text-indigo-500">{p.barcode}</div>
                    </td>
                    <td>
                      <span className="capitalize text-sm text-gray-600">{p.category}</span>
                    </td>
                    <td className="font-mono text-gray-600">{formatCurrency(p.cost)}</td>
                    <td className="font-mono font-bold text-gray-900">{formatCurrency(p.price)}</td>
                    <td>
                      <span className="badge badge-success">{margin}%</span>
                    </td>
                    <td>
                      <div className="stock-quick-stepper">
                        <span className="font-mono font-bold">{p.stock}</span>
                        <button
                          onClick={() => updateProduct({ ...p, stock: p.stock + 10 })}
                          className="btn-quick-stock"
                          title="Quick add +10 stock"
                        >
                          +10
                        </button>
                      </div>
                    </td>
                    <td>
                      {isOut ? (
                        <span className="badge badge-danger">Out of Stock</span>
                      ) : isLow ? (
                        <span className="badge badge-warning">Low ({p.stock})</span>
                      ) : (
                        <span className="badge badge-success">In Stock</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons-group">
                        <button
                          onClick={() => openEditModal(p)}
                          className="btn-icon edit"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${p.name}?`)) deleteProduct(p.id);
                          }}
                          className="btn-icon delete"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">
                    No products matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {editProductModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2 className="modal-title">
              {editProductModal === 'new' ? 'Add New Product' : `Edit Product: ${formData.name}`}
            </h2>

            <form onSubmit={handleSaveProduct} className="advance-form mt-4">
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="form-control"
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>SKU Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                    className="form-control font-mono"
                  />
                </div>
                <div className="form-group">
                  <label>Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    required
                    className="form-control font-mono"
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-control"
                  >
                    {categories.filter(c => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. piece, cup, bottle, packet"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Cost Price ({storeSettings.currency.trim()})</label>
                  <input
                    type="number"
                    step="1"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    required
                    className="form-control font-mono"
                  />
                </div>
                <div className="form-group">
                  <label>Selling Retail Price ({storeSettings.currency.trim()})</label>
                  <input
                    type="number"
                    step="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="form-control font-mono font-bold text-indigo-600"
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Initial Stock Count</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                    className="form-control font-mono"
                  />
                </div>
                <div className="form-group">
                  <label>Low Stock Warning Threshold</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className="form-control font-mono"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditProductModal(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
