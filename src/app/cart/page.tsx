'use client';
import { useCart } from '@/contexts/cart-context';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { CartItem } from '@/lib/types';

export default function CartPage() {
    const { cartItems, getCartTotal, updateQuantity, removeFromCart } = useCart();
    const router = useRouter();

    const subtotal = getCartTotal();
    const tax = subtotal * 0.05;
    const shipping = subtotal > 0 ? 5.00 : 0;
    const total = subtotal + tax + shipping;

    const handleQuantityChange = (item: CartItem, amount: number) => {
        const newQuantity = item.quantity + amount;
        updateQuantity(item.id, newQuantity);
    };

    const handleCheckout = () => {
        router.push('/checkout');
    };

    if (cartItems.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8 text-center max-w-md">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <i className="ri-shopping-bag-3-line text-4xl" />
                </div>
                <p className="text-gray-500 mb-6 font-outfit">Your cart is currently empty.</p>
                <button onClick={() => router.push('/')} className="px-8 py-3 bg-green-600 text-white rounded-xl font-outfit hover:bg-green-700 transition-colors shadow-lg">
                    Start Shopping
                </button>
            </div>
        );
    }
    
    return (
        <div className="bg-gray-50 min-h-[calc(100vh-90px)] flex justify-center items-start md:items-center py-6 px-4">
            <div className="w-full max-w-md">
                <div className="flex flex-col gap-4">
                    {cartItems.map(item => {
                         const placeholder = PlaceHolderImages.find(p => p.id === item.imageId);
                         return (
                            <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 w-full shadow-sm">
                                <Image src={placeholder?.imageUrl || ''} alt={item.name} width={64} height={64} className="w-16 h-16 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
                                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                    <div className="text-base text-gray-800 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                                        <span className="font-semibold">{item.name}</span>
                                        <span className="font-normal text-gray-500 ml-1 text-sm">{item.subtitle ? `(${item.subtitle.replace('Weight: ', '')})` : ''}</span>
                                    </div>
                                    <div className="flex items-center justify-start gap-3">
                                        <div className="font-bold text-gray-800 text-sm">৳{item.price.toFixed(2)}</div>
                                        <div className="flex items-center gap-0.5">
                                            <button onClick={() => handleQuantityChange(item, -1)} className="bg-gray-200 hover:bg-gray-300 rounded-lg cursor-pointer text-sm text-gray-700 flex items-center transition p-1">
                                                <i className="ri-subtract-line h-4 w-4"></i>
                                            </button>
                                            <span className="font-semibold text-sm min-w-[1.25rem] text-center">{item.quantity}</span>
                                            <button onClick={() => handleQuantityChange(item, 1)} className="bg-gray-200 hover:bg-gray-300 rounded-lg cursor-pointer text-sm text-gray-700 flex items-center transition p-1">
                                                <i className="ri-add-line h-4 w-4"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="ml-auto bg-red-100 hover:bg-red-200 rounded-lg text-red-600 text-lg cursor-pointer p-2 flex items-center transition-colors">
                                    <i className="ri-delete-bin-line h-5 w-5"></i>
                                </button>
                            </div>
                         );
                    })}
                </div>

                <div className="mt-6 p-5 bg-white rounded-2xl border border-gray-200 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>৳{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Tax (5%)</span>
                        <span>৳{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Shipping</span>
                        <span>৳{shipping.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 pt-3 border-t border-dashed border-gray-300 text-gray-800 text-lg font-bold flex justify-between items-center">
                        <span>Total</span>
                        <span>৳{total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="mt-5 flex gap-3 w-full">
                    <button onClick={() => router.push('/')} className="flex-1 py-4 rounded-xl font-semibold text-sm cursor-pointer text-center border-2 transition bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400">Continue Shopping</button>
                    <button onClick={handleCheckout} className="flex-1 py-4 rounded-xl font-semibold text-sm cursor-pointer text-center transition bg-green-600 text-white shadow-lg shadow-green-200 hover:bg-green-700">Proceed to Checkout</button>
                </div>

                 <div className="mt-6 bg-gradient-to-tr from-green-50 to-emerald-100 border border-green-200 rounded-xl p-4 flex items-center gap-3 relative overflow-hidden">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-600 text-lg flex-shrink-0 z-10">
                        <i className="ri-gift-line"></i>
                    </div>
                    <div className="text-sm text-green-900/80 leading-snug z-10">
                        <span className="font-bold underline cursor-pointer text-green-800">Log in</span> to your account now and get <strong>30% OFF</strong> your first order!
                    </div>
                </div>
            </div>
        </div>
    );
}
