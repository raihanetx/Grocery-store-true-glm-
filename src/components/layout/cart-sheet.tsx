'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/cart-context';
import type { CartItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

interface CartSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    appliedCoupons,
    getTotalDiscount,
    getFinalTotal,
  } = useCart();
  
  const subtotal = getCartTotal();
  const discount = getTotalDiscount();
  const finalTotal = getFinalTotal();

  const handleQuantityChange = (item: CartItem, amount: number) => {
    const newQuantity = item.quantity + amount;
    updateQuantity(item.id, newQuantity);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-6">
          <SheetTitle className="font-headline text-2xl">My Cart</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <ScrollArea className="h-full">
            <div className="pr-6">
            {cartItems.length > 0 ? (
              <div className="flex flex-col gap-4 py-4">
                {cartItems.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onRemove={() => removeFromCart(item.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <i className="ri-emotion-unhappy-line h-16 w-16 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">Your cart is empty.</p>
                <SheetClose asChild>
                    <Button asChild>
                        <Link href="/">Start Shopping</Link>
                    </Button>
                </SheetClose>
              </div>
            )}
            </div>
          </ScrollArea>
        </div>
        {cartItems.length > 0 && (
          <SheetFooter className="bg-background px-6 py-4 border-t mt-auto">
            <div className="w-full space-y-4">
                {/* Applied Coupons */}
                {appliedCoupons.length > 0 && (
                  <div className="space-y-2">
                    {appliedCoupons.map((coupon) => (
                      <div key={coupon.id} className="flex items-center justify-between text-sm bg-green-50 text-green-700 px-3 py-2 rounded-lg">
                        <span className="font-mono font-semibold">{coupon.code}</span>
                        <span>-৳{coupon.discount.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between text-base text-muted-foreground">
                    <span>Subtotal</span>
                    <span>৳{subtotal.toFixed(0)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-base text-green-600">
                      <span>Discount</span>
                      <span>-৳{discount.toFixed(0)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-green-600">৳{finalTotal.toFixed(0)}</span>
                </div>
                
                 <SheetClose asChild>
                    <Button asChild size="lg" className="w-full font-bold text-lg bg-green-600 hover:bg-green-700">
                       <Link href="/checkout">Proceed to Checkout</Link>
                    </Button>
                </SheetClose>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface CartItemRowProps {
  item: CartItem;
  onQuantityChange: (item: CartItem, amount: number) => void;
  onRemove: (id: string) => void;
}

function CartItemRow({ item, onQuantityChange, onRemove }: CartItemRowProps) {
  const imageUrl = item.image || `https://picsum.photos/seed/${item.id}/200/200`;
  
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
        <Image
          src={imageUrl}
          alt={item.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-1">
        <p className="font-semibold">{item.name}</p>
        <p className="text-sm text-muted-foreground">{item.subtitle}</p>
        <p className="text-sm font-medium text-green-600">৳{item.price.toFixed(0)}</p>
        <div className="mt-2 flex items-center">
            <div className="flex items-center border rounded-md">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onQuantityChange(item, -1)}><i className="ri-subtract-line h-4 w-4" /></Button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onQuantityChange(item, 1)}><i className="ri-add-line h-4 w-4" /></Button>
            </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <p className="font-semibold">৳{(item.price * item.quantity).toFixed(0)}</p>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={() => onRemove(item.id)}>
          <i className="ri-delete-bin-line h-4 w-4" />
          <span className="sr-only">Remove item</span>
        </Button>
      </div>
    </div>
  );
}
