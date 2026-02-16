'use client';

import { useState, useEffect } from 'react';

interface Settings {
  whatsapp: string | null;
  phone: string | null;
  messenger: string | null;
}

export default function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    whatsapp: null,
    phone: null,
    messenger: null
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(console.error);
  }, []);

  const getWhatsAppLink = () => {
    if (!settings.whatsapp) return '#';
    const number = settings.whatsapp.replace(/\D/g, '');
    return `https://wa.me/${number}`;
  };

  const getPhoneLink = () => {
    if (!settings.phone) return '#';
    return `tel:${settings.phone.replace(/\s/g, '')}`;
  };

  const getMessengerLink = () => {
    if (!settings.messenger) return '#';
    if (settings.messenger.startsWith('http')) {
      return settings.messenger;
    }
    return `https://m.me/${settings.messenger}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded contact options */}
      {isOpen && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* WhatsApp */}
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-600 transition-all hover:scale-110"
            title="WhatsApp"
          >
            <i className="ri-whatsapp-fill text-2xl" />
          </a>
          
          {/* Phone Call */}
          <a
            href={getPhoneLink()}
            className="w-12 h-12 bg-gray-700 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-all hover:scale-110"
            title="Call Now"
          >
            <i className="ri-phone-fill text-2xl" />
          </a>
          
          {/* Messenger */}
          <a
            href={getMessengerLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-all hover:scale-110"
            title="Messenger"
          >
            <i className="ri-messenger-fill text-2xl" />
          </a>
        </div>
      )}

      {/* Main Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen 
            ? 'bg-gray-600 rotate-0' 
            : 'bg-green-600 hover:bg-green-700'
        }`}
        aria-label="Help"
      >
        <i className={`ri-${isOpen ? 'close' : 'customer-service-2'}-fill text-white text-2xl transition-transform duration-300`} />
      </button>
    </div>
  );
}
