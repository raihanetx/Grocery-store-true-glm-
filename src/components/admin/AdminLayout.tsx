'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const navItems = [
  { href: '/admin', label: 'Categories', icon: 'ri-folder-line' },
  { href: '/admin/products', label: 'Products', icon: 'ri-shopping-bag-line' },
  { href: '/admin/coupons', label: 'Coupons', icon: 'ri-coupon-3-line' },
  { href: '/admin/orders', label: 'Orders', icon: 'ri-inbox-line' },
  { href: '/admin/analytics', label: 'Analytics', icon: 'ri-bar-chart-line' },
  { href: '/admin/tracking', label: 'Tracking', icon: 'ri-user-follow-line' },
  { href: '/admin/reviews', label: 'Reviews', icon: 'ri-star-line' },
  { href: '/admin/settings', label: 'Settings', icon: 'ri-settings-3-line' },
];

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-sm transform transition-transform duration-200 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <Link href="/admin" className="text-xl font-bold">
            <span className="text-green-600">Lumina</span> Admin
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <i className={`${item.icon} text-lg`} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* View Store Link */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <i className="ri-external-link-line text-lg" />
            View Store
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <i className="ri-menu-line text-xl" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">{title}</h1>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
