import type { InputHTMLAttributes, ReactNode } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  children: ReactNode
}

export function Checkbox({ children, ...rest }: CheckboxProps) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm">
      <input type="checkbox" className="mt-1 size-4 shrink-0 accent-accent-signal" {...rest} />
      <span>{children}</span>
    </label>
  )
}
