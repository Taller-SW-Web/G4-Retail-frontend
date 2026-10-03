/** Une clases condicionales descartando valores falsy. */
export const cx = (...clases: (string | false | null | undefined)[]) => clases.filter(Boolean).join(' ')
