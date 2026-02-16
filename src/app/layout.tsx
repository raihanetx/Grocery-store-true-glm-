import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/contexts/cart-context';
import AppHeader from '@/components/layout/header';
import AppFooter from '@/components/layout/footer';
import './globals.css';
import MobileNav from '@/components/layout/mobile-nav';
import DynamicHead from '@/components/DynamicHead';

export const metadata: Metadata = {
  title: 'Fresh Groceries Online',
  description: 'Fresh groceries delivered to your door.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Hind+Siliguri:wght@400;500;600;700&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-[#f4f5f7] pb-[60px] md:pb-0">
        <CartProvider>
            <DynamicHead />
            <div className="flex min-h-screen w-full flex-col">
              <AppHeader />
              <main className="flex-1">{children}</main>
              <AppFooter />
              <MobileNav />
            </div>
            <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}
