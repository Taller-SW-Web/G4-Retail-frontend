import { IconBallFootball, IconShirt, IconShoe } from '@tabler/icons-react'
import { cx } from '../../lib/cx'

const iconos = { Textil: IconShirt, Calzado: IconShoe, Accesorios: IconBallFootball } as const

interface ProductImageProps {
  categoria: string
  /** Lado en px del icono referencial. */
  size?: number
  className?: string
}

/** Foto referencial: el catálogo aún no expone imágenes, se usa un icono por categoría. */
export function ProductImage({ categoria, size = 64, className }: ProductImageProps) {
  const Icono = iconos[categoria as keyof typeof iconos] ?? IconShirt
  return (
    <div className={cx('flex items-center justify-center rounded-lg bg-surface-cloud-subtle text-text-secondary', className)} aria-hidden>
      <Icono size={size} stroke={1.5} />
    </div>
  )
}
