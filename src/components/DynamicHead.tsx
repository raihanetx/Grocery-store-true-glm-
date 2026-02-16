'use client';

import { useEffect } from 'react';

interface Settings {
  storeName: string;
  storeFavicon: string | null;
}

export default function DynamicHead() {
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then((data: Settings) => {
        // Update document title
        if (data.storeName) {
          document.title = `${data.storeName} - Fresh Groceries`;
        }
        
        // Update favicon
        if (data.storeFavicon) {
          const existingFavicon = document.querySelector("link[rel='icon']");
          if (existingFavicon) {
            existingFavicon.setAttribute('href', data.storeFavicon);
          } else {
            const newFavicon = document.createElement('link');
            newFavicon.rel = 'icon';
            newFavicon.href = data.storeFavicon;
            document.head.appendChild(newFavicon);
          }
        }
      })
      .catch(console.error);
  }, []);

  return null;
}
