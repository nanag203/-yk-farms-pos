'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import BottomNav from '@/components/BottomNav';

export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadDebts();
  }, []);

  async function loadDebts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('debts')
      .select('id, balance, updated_at, customer_id, customers(name, phone, customer_type)')
      .gt('balance', 0)
      .order('balance', { ascending: false });
    if (!error) setDebts(data || []);
    setLoading(false);
  }

  async function handlePayment(debtId, currentBalance) {
    const amount = Number(payAmount[debtId]);
    if (!amount || amount <= 0) return;
    setBusy(true);
    try {
      const newBalance = Math.max(0, currentBalance - amount);
      const { error } = await supabase
        .from('debts')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', debtId);
      if (error) throw error;
      setPayAmount(prev => ({ ...prev, [debtId]: '' }));
      setMessage({ type: 'success', text: `Payment of GH₵${amount.toFixed(2)} recorded` });
      loadDebts();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setBusy(false);
    }
  }

  const totalOwed = debts.reduce((sum, d) => sum + Number(d.balance), 0);

  return (
    <main className="max-w-md mx-auto min-h-screen">
      <header className="px-5 pt-8 pb-5 bg-forest text-cream">
        <p className="text-gold text-xs tracking-[0.15em] uppercase font-medium mb-1">Customer Ledger</p>
        <h1 className="font-display font-semibold text-xl">Who owes what</h1>
      </header>

      <div className="px-5 pt-5">
        <div className="receipt-card p-4 mb-4">
          <p className="text-xs uppercase tracking-wide text-ink/50 font-medium mb-1">Total outstanding</p>
          <p className="font-mono tabular text-2xl font-semibold text-clay">GH₵{totalOwed.toFixed(2)}</p>
        </div>

        {message && (
          <div className={`receipt-card p-3.5 mb-4 ${message.type === 'success' ? 'border-forest' : 'border-clay'}`}>
            <p className={`text-sm font-medium ${message.type === 'success' ? 'text-forest' : 'text-clay'}`}>
              {message.text}
            </p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-24 bg-ink/5 rounded-lg animate-pulse" />)}
          </div>
        ) : debts.length === 0 ? (
          <div className="receipt-card p-6 text-center text-sm text-ink/50">
            No outstanding debts. Every account is settled.
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {debts.map(d => (
              <div key={d.id} className="receipt-card p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-sm">{d.customers?.name || 'Unknown customer'}</p>
                    <p className="text-xs text-ink/40 capitalize">{d.customers?.customer_type}{d.customers?.phone ? ` · ${d.customers.phone}` : ''}</p>
                  </div>
                  <p className="font-mono tabular text-lg font-semibold text-clay">
                    GH₵{Number(d.balance).toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Payment amount"
                    value={payAmount[d.id] || ''}
                    onChange={e => setPayAmount(prev => ({ ...prev, [d.id]: e.target.value }))}
                    className="flex-1 border border-ink/15 rounded-md p-2 text-sm font-mono"
                  />
                  <button
                    onClick={() => handlePayment(d.id, Number(d.balance))}
                    disabled={busy}
                    className="bg-forest text-cream text-sm font-medium px-4 rounded-md disabled:opacity-40"
                  >
                    Record payment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
