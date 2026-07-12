'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import BottomNav from '@/components/BottomNav';

export default function Stock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restockQty, setRestockQty] = useState({});
  const [addingNew, setAddingNew] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', unit: 'crate', price: '', current_stock: '', low_stock_alert: '10' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts(data || []);
    setLoading(false);
  }

  async function handleRestock(productId) {
    const qty = Number(restockQty[productId]);
    if (!qty || qty <= 0) return;
    setBusy(true);
    try {
      const product = products.find(p => p.id === productId);
      const { error: updateErr } = await supabase
        .from('products')
        .update({ current_stock: product.current_stock + qty })
        .eq('id', productId);
      if (updateErr) throw updateErr;

      await supabase.from('stock_movements').insert({
        product_id: productId,
        movement_type: 'in',
        quantity: qty,
        reason: 'New delivery',
      });

      setRestockQty(prev => ({ ...prev, [productId]: '' }));
      setMessage({ type: 'success', text: `Added ${qty} ${product.unit}(s) to ${product.name}` });
      loadProducts();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleAddProduct() {
    if (!newProduct.name.trim() || !newProduct.price) {
      setMessage({ type: 'error', text: 'Product name and price are required.' });
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from('products').insert({
        name: newProduct.name.trim(),
        unit: newProduct.unit,
        price: Number(newProduct.price),
        current_stock: Number(newProduct.current_stock) || 0,
        low_stock_alert: Number(newProduct.low_stock_alert) || 10,
      });
      if (error) throw error;
      setNewProduct({ name: '', unit: 'crate', price: '', current_stock: '', low_stock_alert: '10' });
      setAddingNew(false);
      setMessage({ type: 'success', text: 'Product added.' });
      loadProducts();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteProduct(product) {
    setBusy(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', product.id);
      if (error) throw error;
      setConfirmDeleteId(null);
      setMessage({ type: 'success', text: `${product.name} removed.` });
      loadProducts();
    } catch (e) {
      // Most likely cause: this product has existing sales/stock history linked to it
      setMessage({
        type: 'error',
        text: `Couldn't delete ${product.name} — it has sales or stock history attached to it.`,
      });
      setConfirmDeleteId(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-md mx-auto min-h-screen">
      <header className="px-5 pt-8 pb-5 bg-forest text-cream">
        <p className="text-gold text-xs tracking-[0.15em] uppercase font-medium mb-1">Inventory</p>
        <h1 className="font-display font-semibold text-xl">What's in stock</h1>
      </header>

      <div className="px-5 pt-5">
        {message && (
          <div className={`receipt-card p-3.5 mb-4 ${message.type === 'success' ? 'border-forest' : 'border-clay'}`}>
            <p className={`text-sm font-medium ${message.type === 'success' ? 'text-forest' : 'text-clay'}`}>
              {message.text}
            </p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-ink/5 rounded-lg animate-pulse" />)}
          </div>
        ) : products.length === 0 && !addingNew ? (
          <div className="receipt-card p-6 text-center text-sm text-ink/50 mb-4">
            No products yet. Add your first one below.
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {products.map(p => {
              const low = p.current_stock <= p.low_stock_alert;
              const confirming = confirmDeleteId === p.id;
              return (
                <div key={p.id} className="receipt-card p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-ink/50 font-mono tabular">GH₵{Number(p.price).toFixed(2)} / {p.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono tabular text-lg font-semibold ${low ? 'text-clay' : 'text-forest'}`}>
                        {p.current_stock}
                      </p>
                      <p className="text-[11px] text-ink/40">{p.unit}s left</p>
                    </div>
                  </div>

                  {!confirming ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="Qty received"
                        value={restockQty[p.id] || ''}
                        onChange={e => setRestockQty(prev => ({ ...prev, [p.id]: e.target.value }))}
                        className="flex-1 border border-ink/15 rounded-md p-2 text-sm font-mono"
                      />
                      <button
                        onClick={() => handleRestock(p.id)}
                        disabled={busy}
                        className="bg-forest text-cream text-sm font-medium px-4 rounded-md disabled:opacity-40"
                      >
                        Add stock
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(p.id)}
                        disabled={busy}
                        aria-label={`Delete ${p.name}`}
                        className="border border-clay/40 text-clay text-sm font-medium px-3 rounded-md disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-clay/10 rounded-md p-2.5">
                      <p className="flex-1 text-xs text-clay font-medium">
                        Remove {p.name} permanently?
                      </p>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={busy}
                        className="border border-ink/15 text-ink/60 text-xs font-medium px-3 py-1.5 rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p)}
                        disabled={busy}
                        className="bg-clay text-cream text-xs font-semibold px-3 py-1.5 rounded-md disabled:opacity-40"
                      >
                        {busy ? 'Deleting...' : 'Confirm delete'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!addingNew ? (
          <button
            onClick={() => setAddingNew(true)}
            className="w-full border border-forest text-forest font-medium py-3 rounded-lg mb-6"
          >
            + Add a new product
          </button>
        ) : (
          <div className="receipt-card p-4 mb-6 space-y-3">
            <p className="text-xs uppercase tracking-wide text-ink/50 font-medium">New product</p>
            <input
              type="text"
              placeholder="Product name (e.g. Large Eggs)"
              value={newProduct.name}
              onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-ink/15 rounded-md p-2.5 text-sm"
            />
            <div className="flex gap-2">
              <select
                value={newProduct.unit}
                onChange={e => setNewProduct(prev => ({ ...prev, unit: e.target.value }))}
                className="flex-1 border border-ink/15 rounded-md p-2.5 text-sm bg-white"
              >
                <option value="crate">Crate</option>
                <option value="piece">Piece</option>
              </select>
              <input
                type="number"
                inputMode="decimal"
                placeholder="Price"
                value={newProduct.price}
                onChange={e => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                className="flex-1 border border-ink/15 rounded-md p-2.5 text-sm font-mono"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                placeholder="Starting stock"
                value={newProduct.current_stock}
                onChange={e => setNewProduct(prev => ({ ...prev, current_stock: e.target.value }))}
                className="flex-1 border border-ink/15 rounded-md p-2.5 text-sm font-mono"
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="Low stock alert"
                value={newProduct.low_stock_alert}
                onChange={e => setNewProduct(prev => ({ ...prev, low_stock_alert: e.target.value }))}
                className="flex-1 border border-ink/15 rounded-md p-2.5 text-sm font-mono"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setAddingNew(false)}
                className="flex-1 border border-ink/15 text-ink/60 font-medium py-2.5 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                disabled={busy}
                className="flex-1 bg-gold text-forest font-semibold py-2.5 rounded-md disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
