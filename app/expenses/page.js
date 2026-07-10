'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // adjust path if needed

const forestGreen = '#26472d';
const mossGreen = '#698e36';
const cream = '#f5efe4';
const rust = '#8a4a2a';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [productId, setProductId] = useState('');

  useEffect(() => {
    fetchExpenses();
    fetchProducts();
  }, []);

  async function fetchExpenses() {
    setLoading(true);
    const { data, error } = await supabase
      .from('expenses')
      .select('*, products(name)')
      .order('expense_date', { ascending: false });

    if (!error) setExpenses(data || []);
    setLoading(false);
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('id, name');
    setProducts(data || []);
  }

  async function handleAddExpense(e) {
    e.preventDefault();
    if (!category || !amount) return;

    setSubmitting(true);
    const { error } = await supabase.from('expenses').insert({
      category: category.trim(),
      amount: parseFloat(amount),
      description: description.trim() || null,
      product_id: productId || null,
    });
    setSubmitting(false);

    if (!error) {
      setCategory('');
      setAmount('');
      setDescription('');
      setProductId('');
      fetchExpenses();
    } else {
      console.error('Failed to add expense:', error.message);
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div style={{ minHeight: '100vh', background: cream, fontFamily: 'Poppins, sans-serif' }}>
      <header style={{ background: forestGreen, padding: '24px 20px 32px' }}>
        <p style={{ color: '#e8b84b', fontSize: '13px', letterSpacing: '2px', fontWeight: 600, margin: 0 }}>
          EXPENSE TRACKER
        </p>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: '4px 0 0' }}>
          Where the money goes
        </h1>
      </header>

      <div style={{ padding: '0 16px', marginTop: '-16px' }}>
        <div
          style={{
            background: '#fff',
            border: '1px dashed #ccc',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
          }}
        >
          <p style={{ color: '#888', fontSize: '13px', letterSpacing: '1px', margin: 0 }}>
            TOTAL EXPENSES
          </p>
          <p style={{ color: rust, fontSize: '32px', fontWeight: 700, fontFamily: 'monospace', margin: '4px 0 0' }}>
            GH₵{totalExpenses.toFixed(2)}
          </p>
        </div>

        <form
          onSubmit={handleAddExpense}
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
          <p style={{ fontWeight: 600, margin: 0, color: forestGreen }}>Log an expense</p>

          <input
            type="text"
            placeholder="Category (e.g. feed, transport, labor)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={inputStyle}
            required
          />

          <input
            type="number"
            step="0.01"
            placeholder="Amount (GH₵)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
            required
          />

          <input
            type="text"
            placeholder="Note (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={inputStyle}
          />

          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            style={inputStyle}
          >
            <option value="">Link to a product (optional)</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

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
            {submitting ? 'Saving...' : 'Add Expense'}
          </button>
        </form>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#999' }}>Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>No expenses logged yet.</p>
        ) : (
          expenses.map((exp) => (
            <div
              key={exp.id}
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
                <p style={{ margin: 0, fontWeight: 600, color: '#222', textTransform: 'capitalize' }}>
                  {exp.category}
                </p>
                {exp.products?.name && (
                  <p style={{ margin: '2px 0 0', color: mossGreen, fontSize: '13px' }}>
                    {exp.products.name}
                  </p>
                )}
                {exp.description && (
                  <p style={{ margin: '2px 0 0', color: '#888', fontSize: '13px' }}>
                    {exp.description}
                  </p>
                )}
                <p style={{ margin: '4px 0 0', color: '#aaa', fontSize: '12px' }}>
                  {new Date(exp.expense_date).toLocaleDateString('en-GB')}
                </p>
              </div>
              <p style={{ margin: 0, fontFamily: 'monospace', fontWeight: 700, color: rust, fontSize: '18px' }}>
                GH₵{Number(exp.amount).toFixed(2)}
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
