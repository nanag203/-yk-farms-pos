'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/sale', label: 'New Sale', icon: SaleIcon },
  { href: '/stock', label: 'Stock', icon: StockIcon },
  { href: '/debts', label: 'Debts', icon: DebtIcon },
  { href: '/reports', label: 'Reports', icon: ReportIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-forest border-t border-black/20 z-50">
      <div className="max-w-md mx-auto flex">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                active ? 'text-gold' : 'text-cream/60'
              }`}
            >
              <Icon active={active} />
              <span className="text-[11px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SaleIcon({ active }) {
  // Egg-shaped icon with a plus - core action
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M12 3c3.2 0 5.5 4.8 5.5 9a5.5 5.5 0 1 1-11 0C6.5 7.8 8.8 3 12 3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 10v5M9.5 12.5h5" strokeLinecap="round" />
    </svg>
  );
}

function StockIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 7.5V16l9 4.5 9-4.5V7.5M12 12v8.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DebtIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M4 5h16M4 12h16M4 19h10" strokeLinecap="round" />
      <path d="M16 16.5 19 19l3-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReportIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M4 19V5a1 1 0 0 1 1-1h9l6 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 4v5a1 1 0 0 0 1 1h5M8 13h8M8 16.5h5" strokeLinecap="round" />
    </svg>
  );
}


