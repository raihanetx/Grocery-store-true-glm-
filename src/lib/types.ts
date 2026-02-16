export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  oldPrice?: number | null;
  category: string;
  imageId: string;
  unit: string;
  badge?: string | null;
}

export interface Category {
  id: string;
  name: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  subtitle: string;
  price: number;
  quantity: number;
  imageId: string;
  image?: string;
  category?: string;
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: CartItem[];
}
