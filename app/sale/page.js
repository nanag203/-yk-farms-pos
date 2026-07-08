'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import BottomNav from '@/components/BottomNav';

export default function NewSale() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState({}); // { productId: quantity }
  const [customerId, setCustomerId] = useState('');
  const [newCustomerMode, setNewCustomerMode] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [customerType, setCustomerType] = useState('retail');
  const [amountPaid, setAmountPaid] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // { success, message }

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: prods } = await supabase.from('products').select('*').order('name');
    const { data: custs } = await supabase.from('customers').select('*').order('name');
    setProducts(prods || []);
    setCustomers(custs || []);
  }

  function updateQty(productId, qty) {
    setCart(prev => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[productId];
      } else {
        next[productId] = qty;
      }
      return next;
    });
  }

  const total = products.reduce((sum, p) => {
    const qty = cart[p.id] || 0;
    return sum + qty * Number(p.price);
  }, 0);

  const cartItemCount = Object.keys(cart).length;

  async function handleSubmit() {
    setResult(null);
    if (cartItemCount === 0) {
      setResult({ success: false, message: 'Add at least one product to the sale.' });
      return;
    }

    setSaving(true);
    try {
      let finalCustomerId = customerId || null;

      // create new customer inline if needed
      if (newCustomerMode && newCustomerName.trim()) {
        const { data: newCust, error: custErr } = await supabase
          .from('customers')
          .insert({ name: newCustomerName.trim(), phone: newCustomerPhone.trim() || null, customer_type: customerType })
          .select()
          .single();
        if (custErr) throw custErr;
        finalCustomerId = newCust.id;
      }

      const items = products
        .filter(p => cart[p.id] > 0)
        .map(p => ({ product_id: p.id, quantity: cart[p.id], unit_price: Number(p.price) }));

      const paidAmount = amountPaid === '' ? total : Number(amountPaid);

      const { error: saleErr } = await supabase.rpc('record_sale', {
        p_customer_id: finalCustomerId,
        p_items: items,
        p_amount_paid: paidAmount,
        p_notes: null,
      });
      if (saleErr) throw saleErr;

      setResult({ success: true, message: `Sale recorded — GH₵${total.toFixed(2)}` });
      setCart({});
      setCustomerId('');
      setNewCustomerMode(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setAmountPaid('');
      loadData();
    } catch (e) {
      setResult({ success: false, message: e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-md mx-auto min-h-screen">
      <header className="px-5 pt-8 pb-5 bg-forest text-cream">
        <p className="text-gold text-xs tracking-[0.15em] uppercase font-medium mb-1">Record a Sale</p>
        <h1 className="font-display font-semibold text-xl">What's going out today?</h1>
      </header>

      <div className="px-5 pt-5">
        {/* Products */}
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-wide text-ink/50 font-medium mb-3">Products</h2>
          {products.length === 0 ? (
            <div className="receipt-card p-5 text-center text-sm text-ink/50">
              No products yet. Add some from the Stock tab first.
            </div>
          ) : (
            <div className="space-y-2">
              {products.map(p => (
                <div key={p.id} className="receipt-card p-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-ink/50 font-mono tabular">GH₵{Number(p.price).toFixed(2)} / {p.unit}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQty(p.id, (cart[p.id] || 0) - 1)}
                      className="w-8 h-8 rounded-full bg-forest/10 text-forest font-semibold text-lg flex items-center justify-center active:scale-95 transition-transform"
                      aria-label={`Decrease ${p.name} quantity`}
                    >
                      –
                    </button>
                    <span className="font-mono tabular w-6 text-center">{cart[p.id] || 0}</span>
                    <button
                      onClick={() => updateQty(p.id, (cart[p.id] || 0) + 1)}
                      className="w-8 h-8 rounded-full bg-gold text-forest font-semibold text-lg flex items-center justify-center active:scale-95 transition-transform"
                      aria-label={`Increase ${p.name} quantity`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Customer */}
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-wide text-ink/50 font-medium mb-3">Customer (optional)</h2>
          {!newCustomerMode ? (
            <>
              <select
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                className="w-full receipt-card p-3 text-sm bg-white"
              >
                <option value="">Walk-in / no customer record</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={() => setNewCustomerMode(true)}
                className="text-sm text-forest font-medium mt-2 underline underline-offset-2"
              >
                + Add a new customer
              </button>
            </>
          ) : (
            <div className="receipt-card p-4 space-y-3">
              <input
                type="text"
                placeholder="Customer name"
                value={newCustomerName}
                onChange={e => setNewCustomerName(e.target.value)}
                className="w-full border border-ink/15 rounded-md p-2.5 text-sm"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={newCustomerPhone}
                onChange={e => setNewCustomerPhone(e.target.value)}
                className="w-full border border-ink/15 rounded-md p-2.5 text-sm"
              />
              <div className="flex gap-2">
                {['retail', 'institutional'].map(t => (
                  <button
                    key={t}
                    onClick={() => setCustomerType(t)}
                    className={`flex-1 py-2 rounded-md text-sm font-medium capitalize border ${
                      customerType === t ? 'bg-forest text-cream border-forest' : 'border-ink/15 text-ink/60'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setNewCustomerMode(false); setNewCustomerName(''); }}
                className="text-sm text-clay font-medium"
              >
                Cancel
              </button>
            </div>
          )}
        </section>

        {/* Total + Payment */}
        <section className="receipt-card p-4 mb-6">
          <div className="flex justify-between items-baseline mb-3">
            <span className="text-sm text-ink/60">Total</span>
            <span className="font-mono tabular text-2xl font-semibold text-forest">GH₵{total.toFixed(2)}</span>
          </div>
          <label className="text-xs uppercase tracking-wide text-ink/50 font-medium block mb-1.5">
            Amount paid now
          </label>
          <input
            type="number"
            inputMode="decimal"
            placeholder={total > 0 ? total.toFixed(2) : '0.00'}
            value={amountPaid}
            onChange={e => setAmountPaid(e.target.value)}
            className="w-full border border-ink/15 rounded-md p-2.5 text-sm font-mono"
          />
          <p className="text-xs text-ink/40 mt-1.5">Leave blank if paid in full. Any remainder is added to the customer's debt.</p>
        </section>

        {result && (
          <div className={`receipt-card p-4 mb-4 ${result.success ? 'border-forest' : 'border-clay'}`}>
            <p className={`text-sm font-medium ${result.success ? 'text-forest' : 'text-clay'}`}>
              {result.message}
            </p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving || cartItemCount === 0}
          className="w-full bg-gold text-forest font-semibold py-3.5 rounded-lg mb-6 disabled:opacity-40 active:scale-[0.99] transition-transform"
        >
          {saving ? 'Recording...' : 'Record Sale'}
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
