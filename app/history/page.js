'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const forestGreen = '#26472d';
const mossGreen = '#52796f';
const cream = '#f7f3e8';
const gold = '#e8b84b';
const rust = '#b5542f';

const statusColors = {
  paid: mossGreen,
  partial: gold,
  debt: rust,
};

function formatGHS(n) {
  return `GH₵${Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TransactionHistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchSales() {
    setLoading(true);
    let query = supabase
      .from('sales')
      .select(`
        id,
        sale_date,
        total_amount,
        amount_paid,
        payment_status,
        notes,
        customers ( name, phone ),
        sale_items (
          id,
          quantity,
          unit_price,
          subtotal,
          products ( name, unit )
        )
      `)
      .order('sale_date', { ascending: false });

    const { data, error } = await query;
    if (!error && data) {
      setSales(data);
    }
    setLoading(false);
  }

  const filtered = sales.filter((s) => {
    if (statusFilter !== 'all' && s.payment_status !== statusFilter) return false;
    if (fromDate && new Date(s.sale_date) < new Date(fromDate)) return false;
    if (toDate && new Date(s.sale_date) > new Date(toDate + 'T23:59:59')) return false;
    return true;
  });

  const totalForFiltered = filtered.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: cream, paddingBottom: '90px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ background: forestGreen, padding: '20px 16px 16px' }}>
        <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: 0 }}>Transaction History</h1>
        <p style={{ color: '#cfe0d3', fontSize: '13px', margin: '4px 0 0' }}>
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} · {formatGHS(totalForFiltered)}
        </p>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid #ddd3ba',
              background: '#fff',
              fontFamily: 'Poppins, sans-serif',
              fontSize: '13px',
              color: '#22302a',
            }}
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid #ddd3ba',
              background: '#fff',
              fontFamily: 'Poppins, sans-serif',
              fontSize: '13px',
              color: '#22302a',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
          {['all', 'paid', 'partial', 'debt'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: '8px',
                border: 'none',
                background: statusFilter === s ? forestGreen : '#fff',
                color: statusFilter === s ? gold : '#3d4a41',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 500,
                fontSize: '12px',
                textTransform: 'capitalize',
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {loading && (
          <p style={{ textAlign: 'center', color: '#6b7a72', fontSize: '14px', marginTop: '32px' }}>
            Loading transactions...
          </p>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7a72', fontSize: '14px' }}>
            No transactions found for this filter.
          </div>
        )}

        {!loading &&
          filtered.map((sale) => {
            const isOpen = expandedId === sale.id;
            const statusColor = statusColors[sale.payment_status] || '#6b7a72';
            return (
              <div
                key={sale.id}
                onClick={() => setExpandedId(isOpen ? null : sale.id)}
                style={{
                  background: '#fdfbf5',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  marginBottom: '10px',
                  border: '1px solid #ece4d2',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '14.5px', color: '#22302a' }}>
                      {sale.customers?.name || 'Walk-in Customer'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7a72' }}>
                      {formatDate(sale.sale_date)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '16px', color: forestGreen, fontVariantNumeric: 'tabular-nums' }}>
                      {formatGHS(sale.total_amount)}
                    </p>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '4px',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        color: '#fff',
                        background: statusColor,
                        textTransform: 'capitalize',
                      }}
                    >
                      {sale.payment_status}
                    </span>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ marginTop: '12px', borderTop: '1px dashed #d8d0bd', paddingTop: '10px' }}>
                    {(sale.sale_items || []).map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                          color: '#3d4a41',
                          padding: '4px 0',
                        }}
                      >
                        <span>
                          {item.products?.name || 'Item'} × {item.quantity}
                        </span>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatGHS(item.subtotal)}</span>
                      </div>
                    ))}
                    {sale.amount_paid < sale.total_amount && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                          color: rust,
                          fontWeight: 600,
                          padding: '6px 0 0',
                          borderTop: '1px solid #ece4d2',
                          marginTop: '6px',
                        }}
                      >
                        <span>Balance owed</span>
                        <span>{formatGHS(sale.total_amount - sale.amount_paid)}</span>
                      </div>
                    )}
                    {sale.notes && (
                      <p style={{ fontSize: '12px', color: '#6b7a72', marginTop: '8px', fontStyle: 'italic' }}>
                        {sale.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
