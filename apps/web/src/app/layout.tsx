// ═══════════════════════════════════════════════════════════════
// Root Layout
// Initializes React Query, global CSS variables, header, and footer
// ═══════════════════════════════════════════════════════════════

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { QueryProvider } from '@/providers/QueryProvider';
import { Header } from '@/components/layout/Header/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'NexaStore',
    template: '%s | NexaStore',
  },
  description:
    'NexaStore — Your premium destination for quality products at great prices.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://emporia-web-rouge.vercel.app'
  ),
  openGraph: {
    type: 'website',
    siteName: 'NexaStore',
    title: 'NexaStore',
    description:
      'Your premium destination for quality products at great prices.',
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <QueryProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <main style={{ flex: '1' }}>{children}</main>
            <Footer />
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
