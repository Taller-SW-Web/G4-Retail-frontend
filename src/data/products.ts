import type { Product } from '../types'

export const products: Product[] = [
  {
    id: 'sku-1001',
    name: 'Zapatillas Velocity X',
    category: 'Running',
    price: 249,
    stock: 12,
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    badge: 'Nuevo',
  },
  {
    id: 'sku-1002',
    name: 'Top de compresión Pro',
    category: 'Ropa',
    price: 89,
    stock: 8,
    image:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    badge: 'Top sale',
  },
  {
    id: 'sku-1003',
    name: 'Mancuernas 12kg',
    category: 'Gym',
    price: 139,
    stock: 5,
    image:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'sku-1004',
    name: 'Balón de Fútbol Elite',
    category: 'Fútbol',
    price: 119,
    stock: 16,
    image:
      'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?auto=format&fit=crop&w=900&q=80',
    badge: 'Best seller',
  },
  {
    id: 'sku-1005',
    name: 'Bicicleta urbana City',
    category: 'Bici',
    price: 420,
    stock: 3,
    image:
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80',
    badge: 'Premium',
  },
  {
    id: 'sku-1006',
    name: 'Mochila Trail 32L',
    category: 'Accesorios',
    price: 159,
    stock: 9,
    image:
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80',
  },
]
