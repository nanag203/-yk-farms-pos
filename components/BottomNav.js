'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const forestGreen = '#26472d';
const gold = '#e8b84b';

const mainTabs = [
  { href: '/', label: 'Home', emoji: '🏠' },
  { href: '/new-sale', label: 'New Sale', emoji: '➕' },
  { href: '/stock', label: 'Stock', emoji: '📦' },
  { href: '/debts', label: 'Debts', emoji: '📋' },
  { href: '/reports', label: 'Reports', emoji: '📄' },
];

const moreLinks = [
  { href: '/expenses', label: 'Expenses', emoji: '🧾' },
  { href: '/profit', label: 'Profit', emoji: '📈' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href) => pathname === href;

  return (
    <>
      {moreOpen && (
        <div
          onClick={() => setMoreOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 40,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#fff',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              padding: '20px 16px 32px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/IMG_2335.jpeg" alt="YK Farms" style={{ height: '24px', width: 'auto' }} />
                <p style={{ fontWeight: 600, color: forestGreen, margin: 0, fontFamily: 'Poppins, sans-serif' }}>
                  More
                </p>
              </div>
              <button
                onClick={() => setMoreOpen(false)}
                style={{ background: 'none', border: 'none', padding: '4px', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            {moreLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 8px',
                  textDecoration: 'none',
                  color: isActive(item.href) ? gold : '#333',
                  borderBottom: '1px solid #f0f0f0',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 500,
                  fontSize: '15px',
                }}
              >
                <span style={{ fontSize: '18px' }}>{item.emoji}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: forestGreen,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '10px 4px',
          zIndex: 30,
        }}
      >
        {mainTabs.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                textDecoration: 'none',
                color: active ? gold : '#e8e8e0',
                fontSize: '11px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 500,
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.emoji}</span>
              {item.label}
            </Link>
          );
        })}

        <button
          onClick={() => setMoreOpen(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            background: 'none',
            border: 'none',
            color: moreOpen ? gold : '#e8e8e0',
            fontSize: '11px',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: '18px' }}>⋯</span>
          More
        </button>
      </nav>
    </>
  );
}
