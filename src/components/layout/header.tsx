'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/cart-context';
import { useEffect, useState } from 'react';

export default function AppHeader() {
  const { getCartItemCount } = useCart();
  const [itemCount, setItemCount] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultSearch = searchParams.get('search') || '';

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const searchQuery = formData.get('search') as string;
      const params = new URLSearchParams(searchParams.toString());
      params.set('search', searchQuery);
      router.push(`/?${params.toString()}`);
  };

  useEffect(() => {
    const updateCount = () => setItemCount(getCartItemCount());
    updateCount();
    const interval = setInterval(updateCount, 1000);
    return () => clearInterval(interval);
  }, [getCartItemCount]);


  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex items-center justify-between px-3 md:px-[2rem] h-[60px] md:h-[90px] sticky top-0 z-50">
        <div className="flex items-center shrink-0 w-auto">
            <Logo />
        </div>

        <form onSubmit={handleSubmit} className="hidden md:flex flex-1 justify-center mx-[2rem] max-w-2xl">
            <div className="flex items-center border border-gray-300 rounded-full px-6 w-full bg-transparent h-12 relative transition-all duration-200 focus-within:border-primary">
                <Input name="search" defaultValue={defaultSearch} placeholder="Search Product" className="w-full h-auto outline-none bg-transparent text-lg text-gray-700 placeholder-gray-400 pr-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                <div className="absolute right-[60px] h-7 w-[1px] bg-gray-300"></div>
                <Button type="submit" variant="ghost" className="absolute right-5 cursor-pointer hover:text-black transition-colors h-auto w-auto p-0 hover:bg-transparent">
                    <i className="ri-search-line text-gray-400 h-6 w-6" />
                </Button>
            </div>
        </form>

        <form onSubmit={handleSubmit} className="md:hidden flex items-center border border-gray-300 rounded-full px-3 bg-white h-[36px] flex-1 mr-4 ml-2 relative">
            <Input name="search" defaultValue={defaultSearch} placeholder="Search..." className="w-full h-auto outline-none bg-transparent text-sm text-gray-700 placeholder-gray-400 pr-6 pb-[1px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
            <div className="absolute right-[30px] h-4 w-[1px] bg-gray-300"></div>
            <Button type="submit" variant="ghost" className="absolute right-2 h-auto w-auto p-0 hover:bg-transparent">
                <i className="ri-search-line text-gray-400 h-4 w-4" />
            </Button>
        </form>

        <div className="flex items-center justify-end h-10 shrink-0 md:w-auto">
             <div className="hidden md:flex items-center h-full">
                <Link href="/#products" className="px-4 cursor-pointer hover:bg-gray-50 rounded-md transition-colors block h-full flex items-center">
                    <i className="ri-store-2-line h-7 w-7 text-gray-500 hover:text-black"/>
                </Link>
                <div className="w-[1px] h-[28px] bg-gray-300"></div>
            </div>
            <div className="hidden md:flex items-center h-full">
                <Link href="/cart" className="px-4 cursor-pointer hover:bg-gray-50 rounded-md transition-colors relative h-full flex items-center">
                    <i className="ri-shopping-bag-3-line h-7 w-7 text-gray-500 hover:text-black"/>
                    {itemCount > 0 && (
                        <span className="absolute top-[28px] right-2 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold border-2 border-white">{itemCount}</span>
                    )}
                </Link>
                <div className="w-[1px] h-[28px] bg-gray-300"></div>
            </div>

            <div className="hidden md:flex items-center h-full">
                <Link href="/orders" className="px-4 cursor-pointer hover:bg-gray-50 rounded-md transition-colors h-full flex items-center">
                    <i className="ri-list-check-2 h-7 w-7 text-gray-500 hover:text-black"/>
                </Link>
                <div className="w-[1px] h-[28px] bg-gray-300"></div>
            </div>

            <div className="hidden md:flex items-center h-full">
                <Link href="/admin" className="px-4 cursor-pointer hover:bg-gray-50 rounded-md transition-colors h-full flex items-center" title="Admin Panel">
                    <i className="ri-settings-3-line h-7 w-7 text-gray-500 hover:text-black"/>
                </Link>
            </div>

            <div className="md:hidden flex items-center h-full gap-4">
                <Link href="/cart" className="cursor-pointer relative">
                    <i className="ri-shopping-bag-3-line h-6 w-6 text-gray-500" />
                    {itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold border border-white">{itemCount}</span>
                    )}
                </Link>
                <Link href="/orders" className="cursor-pointer">
                    <i className="ri-list-check-2 h-6 w-6 text-gray-500"/>
                </Link>
            </div>
        </div>
    </header>
  );
}
