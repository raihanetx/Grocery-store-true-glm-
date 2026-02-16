'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import Image from 'next/image';

interface Settings {
  id: string;
  deliveryCharge: number;
  facebook: string | null;
  messenger: string | null;
  whatsapp: string | null;
  phone: string | null;
  storeName: string;
  storeLogo: string | null;
  storeFavicon: string | null;
  aboutUs: string | null;
  privacyPolicy: string | null;
  termsCondition: string | null;
  refundPolicy: string | null;
}

const tabs = [
  { id: 'delivery', label: 'Delivery', icon: 'ri-truck-line' },
  { id: 'social', label: 'Contact & Social', icon: 'ri-share-line' },
  { id: 'store', label: 'Store Info', icon: 'ri-store-2-line' },
  { id: 'policies', label: 'Policies', icon: 'ri-file-text-line' },
] as const;

type TabType = typeof tabs[number]['id'];

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('delivery');
  
  // Upload states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [deliveryCharge, setDeliveryCharge] = useState('60');
  const [facebook, setFacebook] = useState('');
  const [messenger, setMessenger] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('Lumina Grocery');
  const [storeLogo, setStoreLogo] = useState('');
  const [storeFavicon, setStoreFavicon] = useState('');
  const [aboutUs, setAboutUs] = useState('');
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [termsCondition, setTermsCondition] = useState('');
  const [refundPolicy, setRefundPolicy] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data: Settings = await res.json();
        setDeliveryCharge(data.deliveryCharge?.toString() || '60');
        setFacebook(data.facebook || '');
        setMessenger(data.messenger || '');
        setWhatsapp(data.whatsapp || '');
        setPhone(data.phone || '');
        setStoreName(data.storeName || 'Lumina Grocery');
        setStoreLogo(data.storeLogo || '');
        setStoreFavicon(data.storeFavicon || '');
        setAboutUs(data.aboutUs || '');
        setPrivacyPolicy(data.privacyPolicy || '');
        setTermsCondition(data.termsCondition || '');
        setRefundPolicy(data.refundPolicy || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handle image upload
  const handleImageUpload = async (file: File, type: 'logo' | 'favicon') => {
    if (type === 'logo') {
      setUploadingLogo(true);
    } else {
      setUploadingFavicon(true);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'settings');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (type === 'logo') {
          setStoreLogo(data.url);
        } else {
          setStoreFavicon(data.url);
        }
        toast({ title: `✅ ${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully!` });
      } else {
        toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
    } finally {
      if (type === 'logo') {
        setUploadingLogo(false);
      } else {
        setUploadingFavicon(false);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryCharge: parseFloat(deliveryCharge) || 60,
          facebook,
          messenger,
          whatsapp,
          phone,
          storeName,
          storeLogo,
          storeFavicon,
          aboutUs,
          privacyPolicy,
          termsCondition,
          refundPolicy,
        }),
      });

      if (res.ok) {
        toast({ title: '✅ Settings saved successfully!' });
      } else {
        toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const content = loading ? (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
    </div>
  ) : (
    <>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 border-2",
              activeTab === tab.id
                ? "bg-green-600 text-white border-green-600"
                : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
            )}
          >
            <i className={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        {/* Delivery Settings */}
        {activeTab === 'delivery' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <i className="ri-truck-line text-green-600" />
              Delivery Settings
            </h2>
            
            <div className="max-w-xs">
              <label className="block text-sm font-medium mb-1">Delivery Charge (৳)</label>
              <Input
                type="number"
                value={deliveryCharge}
                onChange={e => setDeliveryCharge(e.target.value)}
                placeholder="60"
              />
              <p className="text-xs text-gray-500 mt-1">Standard delivery fee for all orders</p>
            </div>
          </div>
        )}

        {/* Social Media & Contact Settings */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <i className="ri-share-line text-green-600" />
              Contact & Social Media
            </h2>
            <p className="text-sm text-gray-500">These links will appear in the Help widget on your website</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <i className="ri-facebook-fill text-blue-600" />
                  Facebook
                </label>
                <Input
                  type="url"
                  value={facebook}
                  onChange={e => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <i className="ri-messenger-fill text-blue-500" />
                  Messenger
                </label>
                <Input
                  type="text"
                  value={messenger}
                  onChange={e => setMessenger(e.target.value)}
                  placeholder="Your Messenger link or Page ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <i className="ri-whatsapp-fill text-green-600" />
                  WhatsApp
                </label>
                <Input
                  type="tel"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="+880 1XXXXXXXXX"
                />
                <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +880)</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <i className="ri-phone-fill text-emerald-600" />
                  Phone
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+880 1XXXXXXXXX"
                />
                <p className="text-xs text-gray-500 mt-1">Phone number for calls</p>
              </div>
            </div>
          </div>
        )}

        {/* Store Info Settings */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <i className="ri-store-2-line text-green-600" />
              Store Information
            </h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">Store Name</label>
              <Input
                type="text"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                placeholder="Your Store Name"
              />
              <p className="text-xs text-gray-500 mt-1">This name will appear everywhere on your website</p>
            </div>
            
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Store Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                  {storeLogo ? (
                    <Image src={storeLogo} alt="Logo" width={96} height={96} className="object-contain" />
                  ) : (
                    <i className="ri-image-line text-3xl text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'logo');
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    {uploadingLogo ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="ri-upload-line mr-2" />
                        Upload Logo
                      </>
                    )}
                  </Button>
                  {storeLogo && (
                    <button
                      type="button"
                      onClick={() => setStoreLogo('')}
                      className="ml-3 text-sm text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Favicon Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Favicon</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                  {storeFavicon ? (
                    <Image src={storeFavicon} alt="Favicon" width={64} height={64} className="object-contain" />
                  ) : (
                    <i className="ri-global-line text-2xl text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'favicon');
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={uploadingFavicon}
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    {uploadingFavicon ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="ri-upload-line mr-2" />
                        Upload Favicon
                      </>
                    )}
                  </Button>
                  {storeFavicon && (
                    <button
                      type="button"
                      onClick={() => setStoreFavicon('')}
                      className="ml-3 text-sm text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Recommended size: 32x32 or 64x64 pixels (ICO, PNG)</p>
            </div>
          </div>
        )}

        {/* Policy Settings */}
        {activeTab === 'policies' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <i className="ri-file-text-line text-green-600" />
              Policies & Content
            </h2>
            
            {[
              { label: 'About Us', value: aboutUs, setter: setAboutUs, rows: 5 },
              { label: 'Privacy Policy', value: privacyPolicy, setter: setPrivacyPolicy, rows: 5 },
              { label: 'Terms & Conditions', value: termsCondition, setter: setTermsCondition, rows: 5 },
              { label: 'Refund Policy', value: refundPolicy, setter: setRefundPolicy, rows: 4 },
            ].map(({ label, value, setter, rows }) => (
              <div key={label}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <textarea
                  value={value}
                  onChange={e => setter(e.target.value)}
                  placeholder={`Your ${label.toLowerCase()}...`}
                  rows={rows}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            ))}
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-green-600 text-white py-3 hover:bg-green-700"
          >
            {saving ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="ri-save-line mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <AdminLayout title="Settings" subtitle="Manage store settings">
      {content}
    </AdminLayout>
  );
}
