'use client';

import * as React from 'react';
import type { CartItem, Product, Order } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

interface AppliedCoupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  applyTo: string;
  appliesToText: string;
  applicableProductIds: string[];
  isApplicable: boolean;
  discount: number;
}

interface CartContextType {
  cartItems: CartItem[];
  orders: Order[];
  appliedCoupons: AppliedCoupon[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  placeOrder: (newOrder: Omit<Order, 'id' | 'date'>) => Order;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: (couponId: string) => void;
  getTotalDiscount: () => number;
  getFinalTotal: () => number;
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [appliedCoupons, setAppliedCoupons] = React.useState<AppliedCoupon[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    const storedCart = localStorage.getItem('lumina-cart');
    const storedOrders = localStorage.getItem('lumina-orders');
    const storedCoupons = localStorage.getItem('lumina-coupons');

    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
    if (storedOrders) {
      setOrders(JSON.parse(storedOrders));
    }
    if (storedCoupons) {
      setAppliedCoupons(JSON.parse(storedCoupons));
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('lumina-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  React.useEffect(() => {
    localStorage.setItem('lumina-orders', JSON.stringify(orders));
  }, [orders]);

  React.useEffect(() => {
    localStorage.setItem('lumina-coupons', JSON.stringify(appliedCoupons));
  }, [appliedCoupons]);

  const addToCart = (product: Product, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.productId === product.id && item.subtitle === product.unit);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prevItems,
        {
          id: `cart_${Date.now()}`,
          productId: product.id,
          name: product.name,
          subtitle: `Weight: ${product.unit}`,
          price: product.price,
          quantity,
          imageId: product.imageId,
          image: product.image,
          category: product.category,
        },
      ];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== cartItemId)
    );
    toast({
      title: "Item removed",
      description: "The item has been removed from your cart.",
    });
  };

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
    } else {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === cartItemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupons([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const applyCoupon = (coupon: AppliedCoupon) => {
    setAppliedCoupons((prev) => {
      // Check if coupon already applied
      if (prev.find((c) => c.id === coupon.id)) {
        return prev;
      }
      return [...prev, coupon];
    });
    toast({
      title: "Coupon applied!",
      description: `Coupon ${coupon.code} has been applied.`,
    });
  };

  const removeCoupon = (couponId: string) => {
    setAppliedCoupons((prev) => prev.filter((c) => c.id !== couponId));
    toast({
      title: "Coupon removed",
      description: "The coupon has been removed.",
    });
  };

  const getTotalDiscount = () => {
    let totalDiscount = 0;
    
    for (const coupon of appliedCoupons) {
      if (!coupon.isApplicable) continue;
      
      let applicableTotal = 0;
      
      if (coupon.applyTo === 'all') {
        applicableTotal = getCartTotal();
      } else {
        // Calculate total for applicable products only
        for (const item of cartItems) {
          if (coupon.applicableProductIds.includes(item.productId)) {
            applicableTotal += item.price * item.quantity;
          }
        }
      }
      
      if (coupon.type === 'percentage') {
        totalDiscount += applicableTotal * (coupon.value / 100);
      } else {
        totalDiscount += Math.min(coupon.value, applicableTotal);
      }
    }
    
    return totalDiscount;
  };

  const getFinalTotal = () => {
    return Math.max(0, getCartTotal() - getTotalDiscount());
  };

  const placeOrder = (newOrderData: Omit<Order, 'id' | 'date'>): Order => {
    const newOrder: Order = {
      ...newOrderData,
      id: `ORD-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    setOrders((prevOrders) => [newOrder, ...prevOrders]);
    clearCart();
    return newOrder;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        orders,
        appliedCoupons,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemCount,
        placeOrder,
        applyCoupon,
        removeCoupon,
        getTotalDiscount,
        getFinalTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
