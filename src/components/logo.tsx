'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface Settings {
  storeName: string;
  storeLogo: string | null;
}

export function Logo() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        // Update document title
        if (data.storeName) {
          document.title = `${data.storeName} - Fresh Groceries`;
        }
      })
      .catch(console.error);
  }, []);

  // Display logo image if available, otherwise show text
  if (settings?.storeLogo) {
    return (
      <Link href="/" className="flex items-center shrink-0 w-auto">
        <div className="h-8 md:h-10 w-auto relative">
          <Image 
            src={settings.storeLogo} 
            alt={settings.storeName || 'Store'} 
            width={120} 
            height={40}
            className="h-full w-auto object-contain"
          />
        </div>
      </Link>
    );
  }

  // Get display name (first word or whole name)
  const displayName = settings?.storeName || 'Lumina';
  const firstWord = displayName.split(' ')[0];

  return (
    <Link href="/" className="flex items-center shrink-0 w-auto">
      <div className="font-black tracking-tighter text-[24px] md:text-[36px] cursor-pointer text-black leading-none">
        {firstWord}<span className="text-green-600">.</span>
      </div>
    </Link>
  );
}
