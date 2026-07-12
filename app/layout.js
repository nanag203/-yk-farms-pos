import { Zilla_Slab, Work_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import InactivityLogout from '../components/InactivityLogout';

const slab = Zilla_Slab({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-slab',
});
const sans = Work_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-mono',
});

export const metadata = {
  title: 'YK Farms POS',
  description: 'Growing Quality, Feeding the Future',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'YK Farms POS',
  },
  icons: {
    icon: '/IMG_2335.jpeg',
    apple: '/IMG_2335.jpeg',
  },
};

export const viewport = {
  themeColor: '#26472d',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${slab.variable} ${sans.variable} ${mono.variable} font-body bg-cream text-ink`}>
        <InactivityLogout />
        {children}
      </body>
    </html>
  );
}
