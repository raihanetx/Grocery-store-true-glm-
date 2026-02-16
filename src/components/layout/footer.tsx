'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface Settings {
  storeName: string;
  storeLogo: string | null;
  facebook: string | null;
  messenger: string | null;
  whatsapp: string | null;
  phone: string | null;
}

export default function AppFooter() {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(console.error);
  }, []);

  const displayName = settings?.storeName || 'Lumina';
  const firstWord = displayName.split(' ')[0];

  const getWhatsAppLink = () => {
    if (!settings?.whatsapp) return '#';
    const number = settings.whatsapp.replace(/\D/g, '');
    return `https://wa.me/${number}`;
  };

  const getPhoneLink = () => {
    if (!settings?.phone) return '#';
    return `tel:${settings.phone.replace(/\s/g, '')}`;
  };

  const getMessengerLink = () => {
    if (!settings?.messenger) return '#';
    if (settings.messenger.startsWith('http')) return settings.messenger;
    return `https://m.me/${settings.messenger}`;
  };

  return (
    <footer className="relative bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-14 pt-8 pb-20 lg:py-8 lg:pb-12">
        
        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col items-center text-center gap-6">
          <Link href="/" className="inline-block">
            {settings?.storeLogo ? (
              <div className="h-8 w-auto relative">
                <Image 
                  src={settings.storeLogo} 
                  alt={displayName} 
                  width={120} 
                  height={32}
                  className="h-full w-auto object-contain"
                />
              </div>
            ) : (
              <h2 className="text-2xl font-black tracking-tighter text-gray-900">
                {firstWord}<span className="text-green-600">.</span>
              </h2>
            )}
          </Link>
          
          <p className="text-sm text-gray-600 max-w-xs">
            Your one-stop destination for fresh groceries.
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-sm">
            <Link href="/about" className="text-gray-600 hover:text-green-600 transition-colors">About Us</Link>
            <span className="text-gray-300">•</span>
            <Link href="/privacy" className="text-gray-600 hover:text-green-600 transition-colors">Privacy Policy</Link>
            <span className="text-gray-300">•</span>
            <Link href="/terms" className="text-gray-600 hover:text-green-600 transition-colors">Terms</Link>
          </div>
          
          <div className="flex gap-3">
            {settings?.facebook && (
              <a href={settings.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-green-600 hover:text-green-600 transition-all">
                <i className="ri-facebook-fill text-xl"></i>
              </a>
            )}
            {settings?.messenger && (
              <a href={getMessengerLink()} target="_blank" rel="noopener noreferrer" aria-label="Messenger" className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-green-600 hover:text-green-600 transition-all">
                <i className="ri-messenger-fill text-xl"></i>
              </a>
            )}
            {settings?.whatsapp && (
              <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-green-600 hover:text-green-600 transition-all">
                <i className="ri-whatsapp-fill text-xl"></i>
              </a>
            )}
            {settings?.phone && (
              <a href={getPhoneLink()} aria-label="Phone" className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-green-600 hover:text-green-600 transition-all">
                <i className="ri-phone-fill text-xl"></i>
              </a>
            )}
          </div>
          
          <p className="text-xs text-gray-600 mt-4">
            © {currentYear} <span className="font-semibold text-gray-900">{displayName}</span> All rights reserved.
          </p>
        </div>
        
        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="flex items-start justify-between gap-12 pb-12 border-b border-gray-200">
            <div className="w-80 flex-shrink-0">
              <Link href="/" className="inline-block mb-4">
                {settings?.storeLogo ? (
                  <div className="h-10 w-auto relative">
                    <Image 
                      src={settings.storeLogo} 
                      alt={displayName} 
                      width={150} 
                      height={40}
                      className="h-full w-auto object-contain"
                    />
                  </div>
                ) : (
                  <h2 className="text-2xl font-black tracking-tighter text-gray-900">
                    {firstWord}<span className="text-primary">.</span>
                  </h2>
                )}
              </Link>
              <p className="text-base text-gray-600 leading-relaxed">
                Your one-stop destination for fresh groceries. We believe in quality, freshness, and customer satisfaction above all else.
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-12 flex-1">
              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Explore</h4>
                <ul className="list-none flex flex-col gap-3 p-0">
                  <li><Link href="/#products" className="text-sm text-gray-600 hover:text-green-600 transition-colors">All Products</Link></li>
                  <li><Link href="/about" className="text-sm text-gray-600 hover:text-green-600 transition-colors">About Us</Link></li>
                  <li><Link href="/privacy" className="text-sm text-gray-600 hover:text-green-600 transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-sm text-gray-600 hover:text-green-600 transition-colors">Terms & Conditions</Link></li>
                </ul>
              </div>
              
              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Policies</h4>
                <ul className="list-none flex flex-col gap-3 p-0">
                  <li><Link href="/privacy" className="text-sm text-gray-600 hover:text-green-600 transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-sm text-gray-600 hover:text-green-600 transition-colors">Terms of Service</Link></li>
                  <li><Link href="/refund" className="text-sm text-gray-600 hover:text-green-600 transition-colors">Refund Policy</Link></li>
                </ul>
              </div>
              
              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Contact Us</h4>
                <ul className="list-none flex flex-col gap-3 p-0">
                  {settings?.phone && (
                    <li><a href={getPhoneLink()} className="text-sm text-gray-600 hover:text-green-600 transition-colors flex items-center gap-2"><i className="ri-phone-line"/>{settings.phone}</a></li>
                  )}
                  {settings?.whatsapp && (
                    <li><a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-green-600 transition-colors flex items-center gap-2"><i className="ri-whatsapp-line"/>WhatsApp</a></li>
                  )}
                </ul>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mt-4 mb-3">Follow Us</p>
                  <div className="flex flex-wrap gap-3">
                    {settings?.facebook && (
                      <a href={settings.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-green-600 hover:text-green-600 transition-all">
                        <i className="ri-facebook-fill text-xl"></i>
                      </a>
                    )}
                    {settings?.messenger && (
                      <a href={getMessengerLink()} target="_blank" rel="noopener noreferrer" aria-label="Messenger" className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-green-600 hover:text-green-600 transition-all">
                        <i className="ri-messenger-fill text-xl"></i>
                      </a>
                    )}
                    {settings?.whatsapp && (
                      <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-green-600 hover:text-green-600 transition-all">
                        <i className="ri-whatsapp-fill text-xl"></i>
                      </a>
                    )}
                    {settings?.phone && (
                      <a href={getPhoneLink()} aria-label="Phone" className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-green-600 hover:text-green-600 transition-all">
                        <i className="ri-phone-fill text-xl"></i>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-8 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              © {currentYear} <span className="font-semibold text-gray-900">{displayName}</span> All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-gray-600 hover:text-green-600 transition-colors">Privacy</Link>
              <Link href="/terms" className="text-gray-600 hover:text-green-600 transition-colors">Terms</Link>
              <Link href="/about" className="text-gray-600 hover:text-green-600 transition-colors">About</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
