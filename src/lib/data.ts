import type { Product, Category, Order } from './types';

export const categories: Category[] = [
  { id: 'fruits', name: 'Fruits & Veg' },
  { id: 'milk', name: 'Milk & Eggs' },
  { id: 'bakery', name: 'Bakery' },
  { id: 'beverages', name: 'Beverages' },
  { id: 'meat', name: 'Fish & Meat' },
  { id: 'snacks', name: 'Snacks' },
];

export const products: Product[] = [
      { id: 'prod_001', name: 'Organic Banana', category: 'fruits', price: 40, oldPrice: 50, imageId: 'img_banana', badge: '-20%', unit: 'dz' },
      { id: 'prod_002', name: 'Fresh Cow Milk', category: 'milk', price: 90, oldPrice: null, imageId: 'img_milk', badge: null, unit: '1L' },
      { id: 'prod_003', name: 'Sourdough Bread', category: 'bakery', price: 150, oldPrice: 180, imageId: 'img_sourdough', badge: '-17%', unit: 'loaf' },
      { id: 'prod_004', name: 'Green Tea', category: 'beverages', price: 120, oldPrice: null, imageId: 'img_greentea', badge: null, unit: 'box' },
      { id: 'prod_005', name: 'Fresh Salmon', category: 'meat', price: 450, oldPrice: 500, imageId: 'img_salmon', badge: '-10%', unit: 'lb' },
      { id: 'prod_006', name: 'Potato Chips', category: 'snacks', price: 60, oldPrice: null, imageId: 'img_chips', badge: null, unit: 'bag' },
      { id: 'prod_007', name: 'Fresh Apple', category: 'fruits', price: 120, oldPrice: 150, imageId: 'img_apple', badge: '-20%', unit: 'lb' },
      { id: 'prod_008', name: 'Brown Eggs', category: 'milk', price: 180, oldPrice: null, imageId: 'img_eggs', badge: null, unit: 'dz' },
];

export const initialOrders: Order[] = [];
