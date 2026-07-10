'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import Image from 'next/image'
import { createClient } from '@/lib/supabaseClient'
import { brand } from '@/lib/brand'

function getDateRange(preset) {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  if (preset === 'day') {
    start.setHours(0, 0, 0, 0)
  } else if (preset === 'week') {
    const day = start.getDay()
    start.setDate(start.getDate() - day)
    start.setHours(0, 0, 0, 0)
  } else if (preset === 'month') {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
  } else if (preset === 'year') {
    start.setMonth(0, 1)
    start.setHours(0, 0, 0, 0)
  }

  return { start, end }
}

export default function ReportsPage() {
  const [preset, setPreset] = useState('day')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastExport, setLastExport] = useState(null)

  async function handleExport() {
    setError('')
    setLoading(true)

    try {
      let start, end
      if (preset === 'custom') {
        if (!customStart || !customEnd) {
          setError('Pick both a start and end date.')
          setLoading(false)
          return
        }
        start = new Date(customStart)
        start.setHours(0, 0, 0, 0)
        end = new Date(customEnd)
        end.setHours(23, 59, 59, 999)
      } else {
        ;({ start, end } = getDateRange(preset))
      }

      const supabase = createClient()

      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          id,
          sale_date,
          total_amount,
          amount_paid,
          payment_status,
          notes,
          customers ( name, phone, customer_type ),
          sale_items (
            quantity,
            unit_price,
            subtotal,
            products ( name, unit )
          )
        `)
        .gte('sale_date', start.toISOString())
        .lte('sale_date', end.toISOString())
        .order('sale_date', { ascending: true })

      if (salesError) throw salesError

      if (!sales || sales.length === 0) {
        setError('No sales found in that range.')
        setLoading(false)
        return
      }

      const rows = []
      for (const sale of sales) {
        const customerName = sale.customers?.name || 'Walk-in'
        const customerType = sale.customers?.customer_type || ''
        const items = sale.sale_items || []

        if (items.length === 0) {
          rows.push({
            'Sale Date': new Date(sale.sale_date).toLocaleString(),
            'Customer': customerName,
            'Customer Type': customerType,
            'Product': '',
            'Quantity': '',
            'Unit Price': '',
            'Line Subtotal': '',
            'Sale Total': sale.total_amount,
            'Amount Paid': sale.amount_paid,
            'Payment Status': sale.payment_status,
            'Notes': sale.notes || '',
          })
        } else {
          for (const item of items) {
            rows.push({
              'Sale Date': new Date(sale.sale_date).toLocaleString(),
              'Customer': customerName,
              'Customer Type': customerType,
              'Product': item.products?.name || '',
              'Quantity': item.quantity,
              'Unit Price': item.unit_price,
              'Line Subtotal': item.subtotal,
              'Sale Total': sale.total_amount,
              'Amount Paid': sale.amount_paid,
              'Payment Status': sale.payment_status,
              'Notes': sale.notes || '',
            })
          }
        }
      }

      const totalSales = sales.length
      const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0)
      const totalPaid = sales.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0)
      const totalOutstanding = totalRevenue - totalPaid

      const summaryRows = [
        { Metric: 'Date Range', Value: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}` },
        { Metric: 'Total Sales', Value: totalSales },
        { Metric: 'Total Revenue', Value: totalRevenue.toFixed(2) },
        { Metric: 'Total Paid', Value: totalPaid.toFixed(2) },
        { Metric: 'Total Outstanding', Value: totalOutstanding.toFixed(2) },
      ]

      const workbook = XLSX.utils.book_new()
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows)
      const detailSheet = XLSX.utils.json_to_sheet(rows)

      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
      XLSX.utils.book_append_sheet(workbook, detailSheet, 'Sales Detail')

      const filename = `YK-Farms-Sales-${start.toISOString().slice(0, 10)}_to_${end.toISOString().slice(0, 10)}.xlsx`
      XLSX.writeFile(workbook, filename)

      setLastExport({ filename, totalSales, totalRevenue })
    } catch (err) {
      console.error(err)
      setError('Something went wrong pulling the data. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      maxWidth: '480px', margin: '0 auto', padding: '1.5rem',
      fontFamily: "'Poppins', sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Image
          src="/yk-icon.png"
          alt="YK Farms"
          width={40}
          height={40}
          style={{ height: '40px', width: 'auto', borderRadius: '8px' }}
        />
        <h1 style={{ fontSize: '1.3rem', color: brand.forestGreen, fontWeight: 700, margin: 0 }}>
          Export Sales Report
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {['day', 'week', 'month', 'year', 'custom'].map((p) => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: '999px',
              border: preset === p ? `2px solid ${brand.forestGreen}` : '1px solid #ccc',
              background: preset === p ? '#eaf0e5' : 'white',
              color: preset === p ? brand.forestGreen : '#444',
              fontWeight: preset === p ? 600 : 400,
              fontFamily: 'inherit',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <label style={{ flex: 1 }}>
            <span style={{ fontSize: '0.8rem', color: '#555' }}>From</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '8px' }}
            />
          </label>
          <label style={{ flex: 1 }}>
            <span style={{ fontSize: '0.8rem', color: '#555' }}>To</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '8px' }}
            />
          </label>
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={loading}
        style={{
          width: '100%', padding: '0.8rem', background: brand.forestGreen,
          color: 'white', border: 'none', borderRadius: '8px',
          fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', marginBottom: '1rem',
        }}
      >
        {loading ? 'Preparing file...' : 'Download Excel Report'}
      </button>

      {error && <p style={{ color: '#b91c1c', fontSize: '0.9rem' }}>{error}</p>}

      {lastExport && (
        <div style={{
          background: brand.cream, padding: '1rem', borderRadius: '8px',
          fontSize: '0.9rem', borderLeft: `3px solid ${brand.mossGreen}`,
        }}>
          <p style={{ color: brand.charcoal }}><strong>Downloaded:</strong> {lastExport.filename}</p>
          <p style={{ color: brand.charcoal }}>{lastExport.totalSales} sales · GHS {lastExport.totalRevenue.toFixed(2)} total</p>
        </div>
      )}
    </div>
  )
}
