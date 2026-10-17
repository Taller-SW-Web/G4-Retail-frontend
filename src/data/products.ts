import type { Product } from '../types'

/**
 * Catálogo semilla de la tienda, con las variantes y etiquetas que se usan en la demostración.
 *
 * El `stock` del artículo es la suma del de sus variantes: es lo que se muestra en la tarjeta,
 * mientras que la venta siempre se decide sobre la variante concreta (RF-06). Los códigos de barras
 * son EAN-13 y no coinciden con el SKU a propósito, porque en la tienda real tampoco coinciden.
 */
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
    variants: [
      { sku: 'ZAPVEL-38-NEG', barcode: '7751001000012', size: '38', color: 'Negro', stock: 4 },
      { sku: 'ZAPVEL-39-NEG', barcode: '7751001000029', size: '39', color: 'Negro', stock: 3 },
      { sku: 'ZAPVEL-42-NEG', barcode: '7751001000050', size: '42', color: 'Negro', stock: 0 },
      { sku: 'ZAPVEL-40-AZU', barcode: '7751001000036', size: '40', color: 'Azul', stock: 2 },
      { sku: 'ZAPVEL-41-AZU', barcode: '7751001000043', size: '41', color: 'Azul', stock: 3 },
    ],
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
    variants: [
      { sku: 'TOPPRO-S-NEG', barcode: '7751002000019', size: 'S', color: 'Negro', stock: 3 },
      { sku: 'TOPPRO-M-NEG', barcode: '7751002000026', size: 'M', color: 'Negro', stock: 2 },
      { sku: 'TOPPRO-M-BLA', barcode: '7751002000033', size: 'M', color: 'Blanco', stock: 0 },
      { sku: 'TOPPRO-L-BLA', barcode: '7751002000040', size: 'L', color: 'Blanco', stock: 3 },
    ],
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
    variants: [
      { sku: 'BALELI-T4-BLA', barcode: '7751004000016', size: 'N° 4', color: 'Blanco', stock: 7 },
      { sku: 'BALELI-T5-BLA', barcode: '7751004000023', size: 'N° 5', color: 'Blanco', stock: 9 },
    ],
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
    variants: [
      { sku: 'MOCTRA-U-NEG', barcode: '7751006000013', size: 'Única', color: 'Negro', stock: 5 },
      { sku: 'MOCTRA-U-VER', barcode: '7751006000020', size: 'Única', color: 'Verde', stock: 4 },
    ],
  },
]
