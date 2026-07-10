'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // adjust path if needed

const forestGreen = '#26472d';
const mossGreen = '#698e36';
const cream = '#f5efe4';
const rust = '#8a4a2a';

export default function PurchasesPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [supplierId, setSupplierId] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [costPrice, setCostPrice] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: sup }, { data: prod }, { data: purch }] = await Promise.all([
      supabase.from('suppliers').select('*').order('name'),
      supabase.from('products').select('id, name'),
      supabase
        .from('purchases')
        .select('*, suppliers(name), products(name)')
        .order('purchase_date', { ascending: false }),
    ]);
    setSuppliers(sup || []);
    setProducts(prod || []);
    setPurchases(purch || []);
    setLoading(false);
  }

  async function handleAddPurchase(e) {
    e.preventDefault();
    if (!productId || !quantity || !costPrice) return;
    if (!supplierId && !newSupplierName) return;

    setSubmitting(true);

    let finalSupplierId = supplierId;

    if (!finalSupplierId && newSupplierName.trim()) {
      const { data: newSup, error: supError } = await supabase
        .from('suppliers')
        .insert({ name: newSupplierName.trim() })
        .select()
        .single();

      if (supError) {
        console.error('Failed to create supplier:', supError.message);
        setSubmitting(false);
        return;
      }
      finalSupplierId = newSup.id;
    }

    const { error } = await supabase.from('purchases').insert({
      supplier_id: finalSupplierId,
      product_id: productId,
      quantity: parseInt(quantity, 10),
      cost_price: parseFloat(costPrice),
    });

    setSubmitting(false);

    if (!error) {
      setSupplierId('');
      setNewSupplierName('');
      setProductId('');
      setQuantity('');
      setCostPrice('');
      fetchAll();
    } else {
      console.error('Failed to log purchase:', error.message);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: cream, fontFamily: 'Poppins, sans-serif', paddingBottom: '80px' }}>
      <header style={{ background: forestGreen, padding: '24px 20px 32px' }}>
        <p style={{ color: '#e8b84b', fontSize: '13px', letterSpacing: '2px', fontWeight: 600, margin: 0 }}>
          PURCHASES
        </p>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: '4px 0 0' }}>
          What you bought, from whom
        </h1>
      </header>

      <div style={{ padding: '0 16px', marginTop: '-16px' }}>
        <form
          onSubmit={handleAddPurchase}
          style={{
            background: '#fff',
            border: '1px dashed #ccc',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <p style={{ fontWeight: 600, margin: 0, color: forestGreen }}>Log a purchase</p>

          <select
            value={supplierId}
            onChange={(e) => {
              setSupplierId(e.target.value);
              if (e.target.value) setNewSupplierName('');
            }}
            style={inputStyle}
          >
            <option value="">Select existing farmer...</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Or type a new farmer's name"
            value={newSupplierName}
            onChange={(e) => {
              setNewSupplierName(e.target.value);
              if (e.target.value) setSupplierId('');
            }}
            style={inputStyle}
            disabled={!!supplierId}
          />

          <select value={productId} onChange={(e) => setProductId(e.target.value)} style={inputStyle} required>
            <option value="">Select product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Quantity (crates)"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={inputStyle}
            required
          />

          <input
            type="number"
            step="0.01"
            placeholder="Cost price per crate (GH₵)"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            style={inputStyle}
            required
          />

          <button
            type="submit"
            disabled={submitting}
            style={{
              background: forestGreen,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '14px',
              fontWeight: 600,
              fontFamily: 'Poppins, sans-serif',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? 'Saving...' : 'Log Purchase'}
          </button>
        </form>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#999' }}>Loading purchases...</p>
        ) : purchases.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>No purchases logged yet.</p>
        ) : (
          purchases.map((p) => (
            <div
              key={p.id}
              style={{
                background: '#fff',
                border: '1px dashed #ccc',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: '#222' }}>{p.suppliers?.name || 'Unknown farmer'}</p>
                <p style={{ margin: '2px 0 0', color: mossGreen, fontSize: '13px' }}>
                  {p.products?.name} × {p.quantity}
                </p>
                <p style={{ margin: '4px 0 0', color: '#aaa', fontSize: '12px' }}>
                  {new Date(p.purchase_date).toLocaleDateString('en-GB')}
                </p>
              </div>
              <p style={{ margin: 0, fontFamily: 'monospace', fontWeight: 700, color: rust, fontSize: '16px' }}>
                GH₵{Number(p.cost_price).toFixed(2)}/crate
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '12px',
  fontSize: '14px',
  fontFamily: 'Poppins, sans-serif',
  width: '100%',
  boxSizing: 'border-box',
};
