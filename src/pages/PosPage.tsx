import { IconBolt, IconClipboardList, IconPackage, IconReceipt2 } from '@tabler/icons-react'
import Badge from '../components/atoms/Badge'
import Button from '../components/atoms/Button'
import SearchBar from '../components/molecules/SearchBar'
import CartPanel from '../components/organisms/CartPanel'
import ProductCard from '../components/organisms/ProductCard'
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
}: PosPageProps) {
  return (
    <main className="min-h-screen bg-[var(--color-surface-cloud)] px-4 py-6 lg:px-8">
      <header className="mx-auto max-w-7xl rounded-2xl bg-[var(--color-surface-ink)] px-6 py-4 text-[var(--color-text-inverse)] shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-volt)]">Inka Athletics</p>
            <h1 className="font-heading mt-1 text-3xl uppercase">Punto de venta</h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Badge tone="info">Caja abierta</Badge>
            <Badge tone="brand">Turno 08:00 - 12:00</Badge>
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
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[var(--color-accent-signal-soft)] p-2 text-[var(--color-accent-signal)]">
                    <IconPackage size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">Productos</p>
                    <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{products.length}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#EBFBEE] p-2 text-[#2F9E44]">
                    <IconClipboardList size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">Tickets</p>
                    <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">26</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#E7F5FF] p-2 text-[#1971C2]">
                    <IconReceipt2 size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">Total</p>
                    <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">S/ {subtotal}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-2xl uppercase text-[var(--color-text-primary)]">Catálogo</h2>
                <span className="text-sm text-[var(--color-text-secondary)]">{products.length} resultados</span>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} onAdd={addToCart} />
                ))}
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
