'use client';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useCart } from '@/contexts/cart-context';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  categoryId: string;
  category?: { name: string };
  images: { url: string }[];
  varieties: { price: number }[];
}

function InputField({ id, label, icon, className, uppercase, ...props }: { 
  id: string; 
  label: string; 
  icon: React.ReactNode; 
  className?: string;
  uppercase?: boolean;
  [key: string]: unknown 
}) {
  return (
    <div className={cn("input-group relative mb-5", className)}>
      <span className="input-icon absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-[2] transition-colors duration-300">
        {icon}
      </span>
      <input 
        id={id}
        className={cn(
          "clean-input peer w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-base text-gray-800 bg-transparent outline-none transition-colors placeholder:text-transparent",
          uppercase && "uppercase font-mono tracking-wider"
        )}
        placeholder={label}
        {...props} 
      />
      <label 
        htmlFor={id} 
        className="input-label absolute left-11 top-1/2 -translate-y-1/2 bg-transparent text-gray-500 text-base pointer-events-none transition-all duration-300 ease-out"
      >
        {label}
      </label>
    </div>
  );
}

export default function CheckoutPage() {
  const { 
    cartItems, 
    getCartTotal, 
    placeOrder, 
    appliedCoupons, 
    applyCoupon, 
    removeCoupon, 
    getTotalDiscount, 
    getFinalTotal 
  } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  
  // Product data for coupon validation
  const [productData, setProductData] = useState<Product[]>([]);
  
  // Settings state
  const [deliveryCharge, setDeliveryCharge] = useState(60);
  
  // Tracking states
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const hasTrackedExit = useRef(false);
  
  // Debounce refs for instant saving
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedData = useRef({ name: '', phone: '', address: '' });

  // Fetch settings for delivery charge
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setDeliveryCharge(data.deliveryCharge || 60);
      })
      .catch(() => {});
  }, []);

  // Fetch product details for coupon validation
  useEffect(() => {
    const fetchProducts = async () => {
      const productIds = cartItems.map(item => item.productId);
      if (productIds.length === 0) return;
      
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const products = await res.json();
          setProductData(products);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchProducts();
  }, [cartItems]);

  // ===== TRACKING SYSTEM =====
  
  // Initialize visitor and create session INSTANTLY when checkout page loads
  useEffect(() => {
    // Don't start tracking if no cart items
    if (cartItems.length === 0) return;
    
    // Don't create session if already created
    if (sessionId) return;
    
    const initTracking = async () => {
      try {
        // Get visitor token from localStorage
        const storedVisitorId = localStorage.getItem('lumina-visitor-id');
        
        // Get or create visitor
        const visitorRes = await fetch('/api/tracking/visitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorToken: storedVisitorId }),
        });
        
        const visitorData = await visitorRes.json();
        const newVisitorId = visitorData.visitor.visitorId;
        
        // Store visitor ID
        setVisitorId(newVisitorId);
        localStorage.setItem('lumina-visitor-id', newVisitorId);
        
        // Create session INSTANTLY - no delay
        const subtotal = getCartTotal();
        const discount = getTotalDiscount();
        
        const sessionRes = await fetch('/api/tracking/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitorId: newVisitorId,
            cartItems: cartItems.map(item => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
            subtotal,
            appliedCoupons: appliedCoupons.map(c => ({
              code: c.code,
              discount: c.discount,
            })),
            discountAmount: discount,
          }),
        });
        
        const sessionData = await sessionRes.json();
        setSessionId(sessionData.session.id);
        
      } catch (e) {
        console.error('Tracking init error:', e);
      }
    };
    
    // Start tracking immediately - no delay
    initTracking();
  }, [cartItems, sessionId]); // Run when cart items are loaded

  // Instant save form data (debounced slightly to avoid too many API calls)
  const saveFormData = useCallback(async (name: string, phone: string, addr: string) => {
    if (!sessionId) return;
    
    // Clear pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce for 300ms to avoid too many calls, but still instant-feeling
    saveTimeoutRef.current = setTimeout(async () => {
      // Only save if data changed
      if (
        lastSavedData.current.name !== name ||
        lastSavedData.current.phone !== phone ||
        lastSavedData.current.address !== addr
      ) {
        try {
          await fetch('/api/tracking/session', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              customerName: name,
              customerPhone: phone,
              customerAddress: addr,
            }),
          });
          
          lastSavedData.current = { name, phone, address: addr };
        } catch (e) {
          console.error('Save form data error:', e);
        }
      }
    }, 300);
  }, [sessionId]);

  // Track form changes and save instantly
  useEffect(() => {
    if (sessionId) {
      saveFormData(fullName, phone, address);
    }
  }, [fullName, phone, address, sessionId, saveFormData]);

  // End session when leaving page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionId && !hasTrackedExit.current) {
        hasTrackedExit.current = true;
        
        // Use sendBeacon for reliable exit tracking
        const data = JSON.stringify({
          action: 'end',
          customerName: fullName,
          customerPhone: phone,
          customerAddress: address,
        });
        
        navigator.sendBeacon(`/api/tracking/session/${sessionId}`, data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionId, fullName, phone, address]);

  // Calculate discount for each coupon
  const calculateCouponDiscount = (coupon: typeof appliedCoupons[0]) => {
    if (!coupon.isApplicable) return 0;
    
    let applicableTotal = 0;
    
    if (coupon.applyTo === 'all') {
      applicableTotal = getCartTotal();
    } else {
      for (const item of cartItems) {
        if (coupon.applicableProductIds.includes(item.productId)) {
          applicableTotal += item.price * item.quantity;
        }
      }
    }
    
    if (coupon.type === 'percentage') {
      return applicableTotal * (coupon.value / 100);
    } else {
      return Math.min(coupon.value, applicableTotal);
    }
  };

  // Cost calculation
  const subtotal = getCartTotal();
  const deliveryCost = useMemo(() => {
    if (address.trim().length === 0) return 0;
    return deliveryCharge;
  }, [address, deliveryCharge]);
  const discount = getTotalDiscount();
  const total = getFinalTotal() + deliveryCost;

  // Handle coupon apply
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({ title: "Error", description: "Please enter a coupon code", variant: "destructive" });
      return;
    }

    if (appliedCoupons.find(c => c.code === couponCode.toUpperCase())) {
      toast({ title: "Error", description: "This coupon is already applied", variant: "destructive" });
      return;
    }

    setApplyingCoupon(true);
    try {
      const productIds = cartItems.map(item => item.productId);
      const categoryIds = cartItems.map(item => {
        const product = productData.find(p => p.id === item.productId);
        return product?.categoryId || '';
      });

      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: couponCode.toUpperCase(), 
          productIds, 
          categoryIds 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }

      if (!data.coupon.isApplicable) {
        toast({ 
          title: "Coupon not applicable", 
          description: `This coupon applies to ${data.coupon.appliesToText} which is not in your cart.`,
          variant: "destructive" 
        });
        return;
      }

      const couponDiscount = calculateCouponDiscount(data.coupon);

      applyCoupon({
        ...data.coupon,
        discount: couponDiscount,
      });

      setCouponCode('');
      
      // Update session with new coupon
      if (sessionId) {
        await fetch('/api/tracking/session', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            appliedCoupons: [...appliedCoupons, { ...data.coupon, discount: couponDiscount }].map(c => ({
              code: c.code,
              discount: c.discount,
            })),
            discountAmount: discount + couponDiscount,
          }),
        });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to apply coupon", variant: "destructive" });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmOrder = async () => {
    if (!fullName || !phone || !address) {
      toast({ title: "Error", description: "Please fill all shipping details.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    // Mark as tracked to prevent exit tracking
    hasTrackedExit.current = true;

    // Complete session
    if (sessionId) {
      try {
        await fetch(`/api/tracking/session/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'complete',
            customerName: fullName,
            customerPhone: phone,
            customerAddress: address,
          }),
        });
      } catch (e) {
        console.error('Complete session error:', e);
      }
    }

    // Create order in database
    try {
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: fullName,
          customerPhone: phone,
          customerAddress: address,
          items: cartItems.map(item => ({
            productId: item.productId,
            name: item.name,
            subtitle: item.subtitle,
            price: item.price,
            quantity: item.quantity,
          })),
          subtotal,
          discount,
          deliveryCharge: deliveryCost,
          total,
          appliedCoupons: appliedCoupons.map(c => ({
            code: c.code,
            discount: c.discount,
          })),
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await orderResponse.json();
      
      // Save to localStorage for order confirmation page
      placeOrder({
        items: cartItems,
        total: total,
        status: 'Pending',
      });
      
      toast({ 
        title: "Order Placed!", 
        description: `Your order ${orderData.invoice} has been placed successfully.` 
      });
      
      router.push('/orders');
    } catch (error) {
      console.error('Order creation error:', error);
      toast({ 
        title: "Error", 
        description: "Failed to place order. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-capitalize coupon input
  const handleCouponChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCouponCode(e.target.value.toUpperCase());
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center max-w-md">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
          <i className="ri-shopping-bag-3-line text-4xl" />
        </div>
        <p className="text-gray-500 mb-6">Your cart is currently empty.</p>
        <button onClick={() => router.push('/')} className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg">
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="w-full max-w-[480px] mx-auto px-6 py-5 pb-12">
        
        {/* Shipping Details */}
        <div className="uppercase text-xs font-bold text-gray-800 mb-5 tracking-wider flex items-center gap-2">
          <i className="ri-map-pin-line w-4 h-4 text-green-600" /> Shipping Details
        </div>
        <InputField id="fullname" label="Full Name" icon={<i className="ri-user-line w-5 h-5"/>} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <InputField id="phone" label="Phone" type="tel" icon={<i className="ri-smartphone-line w-5 h-5"/>} value={phone} onChange={(e) => setPhone(e.target.value)} />
        <InputField id="address" label="Full Address" icon={<i className="ri-map-pin-line w-5 h-5"/>} value={address} onChange={(e) => setAddress(e.target.value)} />

        <hr className="h-px bg-gray-100 my-8 border-0" />
        
        {/* Order Summary */}
        <div className="uppercase text-xs font-bold text-gray-800 mb-5 tracking-wider flex items-center gap-2">
          <i className="ri-shopping-bag-3-line w-4 h-4 text-green-600" /> Order Summary
        </div>
        {cartItems.map(item => {
          const product = productData.find(p => p.id === item.productId);
          const imageUrl = product?.images?.[0]?.url || item.image;
          return (
            <div key={item.id} className="flex items-center mb-4">
              <div className="w-[60px] h-[60px] rounded-lg bg-gray-50 mr-4 overflow-hidden relative">
                {imageUrl ? (
                  <Image src={imageUrl} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="ri-image-line text-2xl text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold mb-0.5">{item.name}</h4>
                <span className="text-sm text-gray-500">{item.subtitle} • Qty: {item.quantity}</span>
              </div>
              <div className="font-bold text-base">৳{(item.price * item.quantity).toFixed(0)}</div>
            </div>
          );
        })}

        <hr className="h-px bg-gray-100 my-6 border-0" />

        {/* Applied Coupons */}
        {appliedCoupons.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-2">
              <i className="ri-coupon-3-line w-4 h-4 text-primary" /> Applied Coupons
            </div>
            {appliedCoupons.map((coupon) => (
              <div key={coupon.id} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-green-700">{coupon.code}</span>
                    <span className="text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded">
                      {coupon.type === 'percentage' ? `${coupon.value}% off` : `৳${coupon.value} off`}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    <i className="ri-check-line mr-1" />
                    Applies to: {coupon.appliesToText}
                  </p>
                  <p className="text-xs text-green-700 font-semibold mt-1">
                    You save: ৳{calculateCouponDiscount(coupon).toFixed(0)}
                  </p>
                </div>
                <button
                  onClick={() => removeCoupon(coupon.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <i className="ri-close-line text-xl" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Coupon Input */}
        <div className="flex gap-2.5">
          <div className="flex-1">
            <InputField 
              id="coupon" 
              label="Coupon Code" 
              icon={<i className="ri-coupon-3-line w-5 h-5"/>} 
              className="mb-0" 
              value={couponCode}
              onChange={handleCouponChange}
              uppercase
            />
          </div>
          <button 
            onClick={handleApplyCoupon}
            disabled={applyingCoupon}
            className="bg-primary/10 border-2 border-primary text-primary rounded-lg px-6 font-semibold text-sm transition-all hover:bg-primary hover:text-white self-stretch disabled:opacity-50"
          >
            {applyingCoupon ? '...' : 'APPLY'}
          </button>
        </div>

        <hr className="h-px bg-gray-100 my-6 border-0" />

        <div className="space-y-2.5">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>৳{subtotal.toFixed(0)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-৳{discount.toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery Charge</span>
            <span>{deliveryCost > 0 ? `৳${deliveryCost}` : '-'}</span>
          </div>
          <div className="flex justify-between mt-4 pt-4 border-t border-dashed border-gray-200 text-lg font-bold text-gray-800">
            <span>Total Payable</span>
            <span className="text-green-600">৳{total.toFixed(0)}</span>
          </div>
        </div>

        <hr className="h-px bg-gray-100 my-8 border-0" />

        {/* Payment Method */}
        <div className="uppercase text-xs font-bold text-gray-800 mb-5 tracking-wider flex items-center gap-2">
          <i className="ri-shield-check-line w-4 h-4 text-green-600" /> Payment Method
        </div>
        
        <div className="text-base text-gray-600 leading-relaxed">
          This is a <b className="text-gray-800">Cash on Delivery</b> order.
          <br />
          Please pay <b className="text-green-600">৳{total.toFixed(0)}</b> to the rider upon delivery.
        </div>

        <hr className="h-px bg-gray-100 my-8 border-0" />

        {/* Final Confirm */}
        <div className="space-y-4">
          <div className="flex items-center">
            <input type="checkbox" id="save" className="accent-green-600 w-5 h-5 mr-3 cursor-pointer" />
            <label htmlFor="save" className="text-base text-gray-600 cursor-pointer">Save info for next time</label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="terms" className="accent-green-600 w-5 h-5 mr-3 cursor-pointer" />
            <label htmlFor="terms" className="text-base text-gray-600 cursor-pointer">I agree to the <a href="/terms" className="text-green-600 no-underline font-medium">Terms & Conditions</a></label>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button onClick={() => router.back()} className="flex-1 py-3.5 rounded-lg font-semibold text-base uppercase tracking-wider bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">Cancel</button>
          <button 
            onClick={handleConfirmOrder} 
            disabled={isSubmitting}
            className="flex-1 py-3.5 rounded-lg font-semibold text-base uppercase tracking-wider bg-green-600 text-white shadow-lg shadow-green-200 disabled:opacity-70 hover:bg-green-700 transition-colors"
          >
            {isSubmitting ? 'Placing Order...' : 'Confirm Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
