'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // adjust path if needed

const forestGreen = '#26472d';
const mossGreen = '#698e36';
const cream = '#f5efe4';
const rust = '#8a4a2a';

export default function ProfitPage() {
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState(0);
  const [cogs, setCogs] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [breakdown, setBreakdown] = useState([]);

  useEffect(() => {
    fetchProfitData();
  }, []);

  async function fetchProfitData() {
    setLoading(true);

    const { data: sales } = await supabase.from('sales').select('total_amount');
    const totalRevenue = (sales || []).reduce((sum, s) => sum + Number(s.total_amount), 0);

    const { data: saleItems } = await supabase
      .from('sale_items')
      .select('quantity, unit_price, products(name, cost_price)');

    let totalCogs = 0;
    const productBreakdown = {};

    (saleItems || []).forEach((item) => {
      const cost = Number(item.products?.cost_price || 0) * Number(item.quantity);
      const rev = Number(item.unit_price) * Number(item.quantity);
      totalCogs += cost;

      const name = item.products?.name || 'Unknown';
      if (!productBreakdown[name]) {
        productBreakdown[name] = { name, revenue: 0, cost: 0 };
      }
      productBreakdown[name].revenue += rev;
      productBreakdown[name].cost += cost;
    });

    const { data: expenses } = await supabase.from('expenses').select('amount');
    const totalExp = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);

    setRevenue(totalRevenue);
    setCogs(totalCogs);
    setTotalExpenses(totalExp);
    setBreakdown(Object.values(productBreakdown));
    setLoading(false);
  }

  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - totalExpenses;
  const missingCostPrices = breakdown.some((b) => b.cost === 0 && b.revenue > 0);

  return (
    <div style={{ minHeight: '100vh', background: cream, fontFamily: 'Poppins, sans-serif' }}>
      <header style={{ background: forestGreen, padding: '24px 20px 32px' }}>
        <p style={{ color: '#e8b84b', fontSize: '13px', letterSpacing: '2px', fontWeight: 600, margin: 0 }}>
          PROFIT TRACKER
        </p>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: '4px 0 0' }}>
          What's actually left
        </h1>
      </header>

      <div style={{ padding: '0 16px', marginTop: '-16px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>Crunching the numbers...</p>
        ) : (
          <>
            {missingCostPrices && (
              <div
                style={{
                  background: '#fff8e1',
                  border: '1px solid #e8b84b',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: '#8a6d1a',
                }}
              >
                Some products don't have a cost price set yet, so profit on those items shows as 100% margin. Add a cost_price on each product for accurate numbers.
              </div>
            )}

            <div
              style={{
                background: forestGreen,
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
              }}
            >
              <p style={{ color: '#cfd9c8', fontSize: '13px', letterSpacing: '1px', margin: 0 }}>
                NET PROFIT
              </p>
              <p
                style={{
                  color: netProfit >= 0 ? '#fff' : '#ffb4a2',
                  fontSize: '36px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  margin: '4px 0 0',
                }}
              >
                GH₵{netProfit.toFixed(2)}
              </p>
              <p style={{ color: '#cfd9c8', fontSize: '12px', margin: '4px 0 0' }}>
                Revenue − Cost of Goods − Expenses
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <SummaryCard label="REVENUE" value={revenue} color={mossGreen} />
              <SummaryCard label="COST OF GOODS" value={cogs} color={rust} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <SummaryCard label="EXPENSES" value={totalExpenses} color={rust} full />
            </div>

            <div
              style={{
                background: '#fff',
                border: '1px dashed #ccc',
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <p style={{ fontWeight: 600, color: forestGreen, margin: '0 0 12px' }}>
                Profit by product
              </p>
              {breakdown.length === 0 ? (
                <p style={{ color: '#999', fontSize: '14px' }}>No sales recorded yet.</p>
              ) : (
                breakdown.map((b) => (
                  <div
                    key={b.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <span style={{ color: '#333' }}>{b.name}</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: forestGreen }}>
                      GH₵{(b.revenue - b.cost).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, full }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px dashed #ccc',
        borderRadius: '12px',
        padding: '16px',
        flex: full ? undefined : 1,
        width: full ? '100%' : undefined,
        boxSizing: 'border-box',
      }}
    >
      <p style={{ color: '#888', fontSize: '12px', letterSpacing: '1px', margin: 0 }}>{label}</p>
      <p style={{ color, fontSize: '22px', fontWeight: 700, fontFamily: 'monospace', margin: '4px 0 0' }}>
        GH₵{value.toFixed(2)}
      </p>
    </div>
  );
}
