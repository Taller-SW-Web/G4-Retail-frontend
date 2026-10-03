import { IconLoader2 } from '@tabler/icons-react'

export function Spinner({ size = 20 }: { size?: number }) {
  return <IconLoader2 size={size} className="animate-spin" aria-hidden />
}
