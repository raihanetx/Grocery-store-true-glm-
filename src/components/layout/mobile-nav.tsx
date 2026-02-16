'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function MobileNav() {
    const pathname = usePathname();

    const navItems = [
        { href: '/', icon: <i className="ri-home-line h-[22px] w-[22px] mb-[1px] leading-none"/>, label: 'Home' },
        { href: '/#products', icon: <i className="ri-store-2-line h-[22px] w-[22px] mb-[1px] leading-none"/>, label: 'Shop' },
        { href: '/orders', icon: <i className="ri-list-check-2 h-[22px] w-[22px] mb-[1px] leading-none"/>, label: 'Orders' },
        { href: '/admin', icon: <i className="ri-settings-3-line h-[22px] w-[22px] mb-[1px] leading-none"/>, label: 'Admin' },
    ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-1px_4px_rgba(0,0,0,0.08)] h-[60px] flex justify-around items-center md:hidden z-40">
        {navItems.map((item, index) => (
             <Link key={item.href} href={item.href} className={cn(
                "flex flex-col items-center justify-center flex-1 h-full relative cursor-pointer transition-colors", 
                index < navItems.length -1 && "after:content-[''] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-[25px] after:w-[1px] after:bg-gray-300",
                (pathname === item.href || (item.href === '/#products' && pathname === '/')) ? 'text-primary' : 'text-gray-500 hover:text-primary'
             )}>
                {item.icon}
                <span className="text-[10px] font-medium leading-none mt-1">{item.label}</span>
            </Link>
        ))}
    </div>
  );
}
