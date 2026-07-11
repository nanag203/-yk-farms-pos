'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const forestGreen = '#26472d';
const mossGreen = '#52796f';
const cream = '#f7f3e8';
const gold = '#e8b84b';
const rust = '#b5542f';

function formatGHS(n) {
  return `GH₵${Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getRange(period) {
  const now = new Date();
  const start = new Date(now);
  if (period === 'day') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    const day = start.getDay();
    const diff = (day === 0 ? 6 : day - 1);
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  return { start, end: now };
}

const periodLabels = {
  day: "Today",
  week: "This Week",
  month: "This Month",
};

export default function SummaryPage() {
  const [period, setPeriod] = useState('day');
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  async function fetchData() {
    setLoading(true);
    const { start, end } = getRange(period);

    const [salesRes, expensesRes] = await Promise.all([
      supabase
        .from('sales')
        .select('id, total_amount, amount_paid, payment_status, sale_date, sale_items(quantity)')
        .gte('sale_date', start.toISOString())
        .lte('sale_date', end.toISOString()),
      supabase
        .from('expenses')
        .select('id, amount, expense_date')
        .gte('expense_date', start.toISOString())
        .lte('expense_date', end.toISOString()),
    ]);

    setSales(salesRes.data || []);
    setExpenses(expensesRes.data || []);
    setLoading(false);
  }

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const salesCount = sales.length;
  const avgSale = salesCount ? totalRevenue / salesCount : 0;
  const itemsSold = sales.reduce(
    (sum, s) => sum + (s.sale_items || []).reduce((isum, i) => isum + Number(i.quantity || 0), 0),
    0
  );
  const outstanding = sales.reduce((sum, s) => sum + Math.max(0, Number(s.total_amount) - Number(s.amount_paid)), 0);
  const netForPeriod = totalRevenue - totalExpenses;

  return (
    <div style={{ minHeight: '100vh', background: cream, paddingBottom: '90px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ background: forestGreen, padding: '20px 16px 16px' }}>
        <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: 0 }}>Summary</h1>
        <p style={{ color: '#cfe0d3', fontSize: '13px', margin: '4px 0 0' }}>{periodLabels[period]}</p>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {['day', 'week', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                flex: 1,
                padding: '10px 4px',
                borderRadius: '10px',
                border: 'none',
                background: period === p ? forestGreen : '#fff',
                color: period === p ? gold : '#3d4a41',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: '13px',
                textTransform: 'capitalize',
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#6b7a72', fontSize: '14px', marginTop: '32px' }}>
          Loading summary...
        </p>
      ) : (
        <div style={{ padding: '0 16px' }}>
          <div
            style={{
              background: '#fdfbf5',
              border: `2px dashed ${gold}`,
              borderRadius: '16px',
              padding: '18px',
              marginBottom: '12px',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#6b7a72' }}>
              Net Total ({periodLabels[period]})
            </p>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: '30px',
                fontWeight: 700,
                color: netForPeriod >= 0 ? forestGreen : rust,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatGHS(netForPeriod)}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <StatCard label="Revenue" value={formatGHS(totalRevenue)} color={forestGreen} />
            <StatCard label="Expenses" value={formatGHS(totalExpenses)} color={rust} />
            <StatCard label="Sales Made" value={salesCount} color={mossGreen} />
            <StatCard label="Avg Sale" value={formatGHS(avgSale)} color={mossGreen} />
            <StatCard label="Items Sold" value={itemsSold} color={mossGreen} />
            <StatCard label="Outstanding" value={formatGHS(outstanding)} color={outstanding > 0 ? rust : mossGreen} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div
      style={{
        background: '#fdfbf5',
        border: '1px solid #ece4d2',
        borderRadius: '14px',
        padding: '14px',
      }}
    >
      <p style={{ margin: 0, fontSize: '11.5px', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#6b7a72' }}>
        {label}
      </p>
      <p style={{ margin: '6px 0 0', fontSize: '18px', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
    </div>
  );
}
