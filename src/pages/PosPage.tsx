import { IconBolt, IconClipboardList, IconPackage, IconReceipt2, IconSearch } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import Badge from '../components/atoms/Badge'
import Button from '../components/atoms/Button'
import CategoryFilter from '../components/molecules/CategoryFilter'
import EmptyState from '../components/molecules/EmptyState'
import SearchBar from '../components/molecules/SearchBar'
import StatCard from '../components/molecules/StatCard'
import CartPanel from '../components/organisms/carrito/CartPanel'
import ProductCard from '../components/organisms/catalogo/ProductCard'
import { getCartItemCount } from '../lib/cart'
import { formatCurrency } from '../lib/format'
import type { CartItem, Product } from '../types'

type PosPageProps = {
  products: Product[]
  cart: CartItem[]
  addToCart: (product: Product) => void
  increaseQuantity: (productId: string) => void
  decreaseQuantity: (productId: string) => void
  removeFromCart: (productId: string) => void
  subtotal: number
  search: string
  onSearchChange: (value: string) => void
  category: string
  categories: string[]
  onCategoryChange: (category: string) => void
}

export default function PosPage({
  products,
  cart,
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  subtotal,
  search,
  onSearchChange,
  category,
  categories,
  onCategoryChange,
}: PosPageProps) {
  return (
    <main className="min-h-screen bg-[var(--color-surface-cloud)] px-4 py-6 lg:px-8">
      <header className="mx-auto max-w-7xl rounded-2xl bg-[var(--color-surface-ink)] px-6 py-4 text-[var(--color-text-inverse)] shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-volt)]">Inka Athletics</p>
            <h1 className="font-heading mt-1 text-3xl uppercase">Punto de venta</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="info">Caja abierta</Badge>
            <Badge tone="brand">Turno 08:00 - 12:00</Badge>
            <div className="flex items-center gap-2 border-l border-[var(--color-border-inverse)] pl-3 text-xs font-semibold">
              <Link to="/pickup" className="rounded-lg bg-[var(--color-surface-ink-soft)] px-2.5 py-1 text-[var(--color-text-inverse)]/80 hover:text-white transition-colors">
                📦 Pickup (F7)
              </Link>
              <Link to="/caja/cierre" className="rounded-lg bg-[var(--color-surface-ink-soft)] px-2.5 py-1 text-[var(--color-text-inverse)]/80 hover:text-white transition-colors">
                💵 Cierre Caja (F8)
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto mt-6 max-w-7xl">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_380px]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                  <IconBolt className="text-[var(--color-accent-signal)]" size={18} />
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                    Venta asistida
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary">Pickup</Button>
                  <Button variant="outline">Clientes</Button>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-4 lg:flex-row">
                <div className="flex-1">
                  <SearchBar value={search} onChange={onSearchChange} />
                </div>
                <Button variant="primary">+ Nuevo ticket</Button>
              </div>
              <div className="mt-4">
                <CategoryFilter
                  categories={categories}
                  value={category}
                  onChange={onCategoryChange}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard icon={<IconPackage size={18} />} label="Resultados" value={products.length} tone="signal" />
              <StatCard icon={<IconClipboardList size={18} />} label="Unidades en carrito" value={getCartItemCount(cart)} tone="volt" />
              <StatCard icon={<IconReceipt2 size={18} />} label="Total" value={formatCurrency(subtotal)} tone="action" />
            </div>

            <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-2xl uppercase text-[var(--color-text-primary)]">Catálogo</h2>
                <span className="text-sm text-[var(--color-text-secondary)]">{products.length} resultados</span>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
                {products.length > 0 ? (
                  products.map((product) => (
                    <ProductCard key={product.id} product={product} onAdd={addToCart} />
                  ))
                ) : (
                  <div className="md:col-span-2">
                    <EmptyState
                      icon={<IconSearch size={24} />}
                      title="No encontramos productos"
                      description="Prueba con otro nombre, SKU o categoría."
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <CartPanel
            items={cart}
            subtotal={subtotal}
            onIncrease={increaseQuantity}
            onDecrease={decreaseQuantity}
            onRemove={removeFromCart}
          />
        </div>
      </section>
    </main>
  )
}
