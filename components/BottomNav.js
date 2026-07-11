'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const forestGreen = '#26472d';
const mossGreen = '#52796f';
const cream = '#f7f3e8';
const gold = '#e8b84b';
const inactiveIcon = '#aebfa8';

const icons = {
  home: (
    <path d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h3v-5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20h3a1 1 0 0 0 1-1v-9" />
  ),
  sale: (
    <>
      <path d="M12 6v12M6 12h12" />
    </>
  ),
  stock: (
    <>
      <path d="M21 8 12 3 3 8m18 0-9 5m9-5v8l-9 5m0-13L3 8m9 5v8m-9-5V8l9 5" />
    </>
  ),
  debts: (
    <>
      <path d="M8 4h8a1 1 0 0 1 1 1v15l-3-2-2 2-2-2-2 2-3-2V5a1 1 0 0 1 1-1Z" />
      <path d="M9 9h6M9 12h6M9 15h4" />
    </>
  ),
  reports: (
    <>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5M9 13h6M9 16h6" />
    </>
  ),
  expenses: (
    <>
      <path d="M6 3h9l3 3v15l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1V4a1 1 0 0 1 1-1Z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  profit: (
    <>
      <path d="M3 17 9 11l4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 3" />
    </>
  ),
  summary: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M4 20h16" />
    </>
  ),
};

function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
}

const mainTabs = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/sale', label: 'New Sale', icon: 'sale' },
  { href: '/stock', label: 'Stock', icon: 'stock' },
  { href: '/debts', label: 'Debts', icon: 'debts' },
  { href: '/reports', label: 'Reports', icon: 'reports' },
];

const moreLinks = [
  { href: '/expenses', label: 'Expenses', icon: 'expenses' },
  { href: '/profit', label: 'Profit', icon: 'profit' },
  { href: '/history', label: 'Transaction History', icon: 'history' },
  { href: '/summary', label: 'Summary', icon: 'summary' },
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
            background: 'rgba(20,30,24,0.45)',
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
              background: cream,
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '10px 16px 32px',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '4px',
                borderRadius: '2px',
                background: '#d8d0bd',
                margin: '4px auto 16px',
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/IMG_2335.jpeg" alt="YK Farms" style={{ height: '22px', width: 'auto' }} />
                <p style={{ fontWeight: 600, color: forestGreen, margin: 0, fontFamily: 'Poppins, sans-serif', fontSize: '15px' }}>
                  More
                </p>
              </div>
              <button
                onClick={() => setMoreOpen(false)}
                aria-label="Close"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '6px',
                  color: forestGreen,
                  cursor: 'pointer',
                }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {moreLinks.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 10px',
                    textDecoration: 'none',
                    color: active ? forestGreen : '#3d4a41',
                    background: active ? 'rgba(38,71,45,0.06)' : 'transparent',
                    borderRadius: '10px',
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 500,
                    fontSize: '15px',
                    transition: 'background 150ms ease',
                  }}
                >
                  <span style={{ color: active ? gold : mossGreen, display: 'flex' }}>
                    <Icon name={item.icon} />
                  </span>
                  {item.label}
                </Link>
              );
            })}
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
          padding: '8px 4px 10px',
          zIndex: 30,
          boxShadow: '0 -2px 12px rgba(0,0,0,0.15)',
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
                gap: '3px',
                textDecoration: 'none',
                color: active ? gold : inactiveIcon,
                fontSize: '10.5px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 500,
                minWidth: '44px',
                padding: '2px 0',
                transition: 'color 150ms ease',
              }}
            >
              <span
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: active ? gold : 'transparent',
                  marginBottom: '1px',
                }}
              />
              <Icon name={item.icon} />
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
            gap: '3px',
            background: 'none',
            border: 'none',
            color: moreOpen ? gold : inactiveIcon,
            fontSize: '10.5px',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 500,
            minWidth: '44px',
            padding: '2px 0',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: moreOpen ? gold : 'transparent',
              marginBottom: '1px',
            }}
          />
          <Icon name="more" />
          More
        </button>
      </nav>
    </>
  );
}
