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
    
  ),
  sale: (
    <>
      
    </>
  ),
  stock: (
    <>
      
    </>
  ),
  debts: (
    <>
      
      
    </>
  ),
  reports: (
    <>
      
      
    </>
  ),
  expenses: (
    <>
      
      
    </>
  ),
  profit: (
    <>
      
      
    </>
  ),
  more: (
    <>
      
      
      
    </>
  ),
  close: ,
};

function Icon({ name, size = 20 }) {
  return (
    
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
];

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href) => pathname === href;

  return (
    <>
      {moreOpen && (
        
              
            

            {moreLinks.map((item) => {
              const active = isActive(item.href);
              return (
                
              );
            })}
          
        
      )}

      
    </>
  );
}
