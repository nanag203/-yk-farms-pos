'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import BottomNav from '@/components/BottomNav';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [todaySales, setTodaySales] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [lowStock, setLowStock] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data: sales, error: salesErr } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('sale_date', startOfDay.toISOString());
      if (salesErr) throw salesErr;

      const total = (sales || []).reduce((sum, s) => sum + Number(s.total_amount), 0);
      setTodaySales(total);
      setTodayCount((sales || []).length);

      const { data: debts, error: debtErr } = await supabase
        .from('debts')
        .select('balance');
      if (debtErr) throw debtErr;
      setTotalDebt((debts || []).reduce((sum, d) => sum + Number(d.balance), 0));

      const { data: products, error: prodErr } = await supabase
        .from('products')
        .select('name, current_stock, low_stock_alert');
      if (prodErr) throw prodErr;
      setLowStock((products || []).filter(p => p.current_stock <= p.low_stock_alert));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto min-h-screen">
      <header className="px-5 pt-8 pb-6 bg-forest text-cream">
        <p className="text-gold text-xs tracking-[0.15em] uppercase font-medium mb-1">Yeboah Kudom Farms</p>
        <h1 className="font-display font-semibold text-2xl leading-tight">Growing Quality,<br />Feeding the Future</h1>
      </header>

      <div className="px-5 -mt-4">
        {error && (
          <div className="receipt-card p-4 mb-4 border-clay bg-clay/5">
            <p className="text-sm text-clay font-medium">Couldn't load dashboard: {error}</p>
          </div>
        )}

        <div className="receipt-card p-5 mb-4">
          <p className="text-xs uppercase tracking-wide text-ink/50 font-medium mb-2">Today's Sales</p>
          {loading ? (
            <div className="h-9 w-32 bg-ink/5 rounded animate-pulse" />
          ) : (
            <>
              <p className="font-mono tabular text-3xl font-semibold text-forest">
                GH₵{todaySales.toFixed(2)}
              </p>
              <p className="text-sm text-ink/50 mt-1">{todayCount} sale{todayCount !== 1 ? 's' : ''} recorded</p>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="receipt-card p-4">
            <p className="text-xs uppercase tracking-wide text-ink/50 font-medium mb-2">Total Owed</p>
            {loading ? (
              <div className="h-6 w-20 bg-ink/5 rounded animate-pulse" />
            ) : (
              <p className="font-mono tabular text-lg font-semibold text-clay">
                GH₵{totalDebt.toFixed(2)}
              </p>
            )}
          </div>
          <div className="receipt-card p-4">
            <p className="text-xs uppercase tracking-wide text-ink/50 font-medium mb-2">Low Stock</p>
            {loading ? (
              <div className="h-6 w-10 bg-ink/5 rounded animate-pulse" />
            ) : (
              <p className="font-mono tabular text-lg font-semibold text-forest">
                {lowStock.length} item{lowStock.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {!loading && lowStock.length > 0 && (
          <div className="receipt-card p-4 mb-4 border-gold/40">
            <p className="text-xs uppercase tracking-wide text-gold-dark font-semibold mb-2">Needs restocking</p>
            <ul className="space-y-1">
              {lowStock.map((p, i) => (
                <li key={i} className="text-sm flex justify-between">
                  <span>{p.name}</span>
                  <span className="font-mono tabular text-clay">{p.current_stock} left</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!loading && !error && todayCount === 0 && (
          <div className="receipt-card p-6 text-center text-ink/50 mb-4">
            <p className="text-sm">No sales yet today. Tap "New Sale" below to record your first one.</p>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
