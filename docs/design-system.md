# Sistema de Diseño — Inka Athletics
**Marketplace Multicanal - Design System v1.0**

> Fuente: Figma **Sistema de Diseño** → página *Base e Identidad de Marca*
> (https://www.figma.com/design/rKPdRQHLLUkYk5VdiEErqZ/Sistema-De-Dise%C3%B1o).
> Documento provisional hasta que UX/UI publique el `design-system.md` común.
> Las secciones marcadas con *(propuesta)* no están en Figma: se derivan de sus tokens y reglas y deben validarse con UX/UI.

---

## Postura estética

**Energía deportiva con confianza.** Inka Athletics impulsa a más personas a vivir el deporte con confianza, encontrando equipamiento, ropa y accesorios adecuados para cada meta. La interfaz es directa y activa: titulares de alto impacto en Oswald, superficies claras y cálidas para comprar sin fricción, y secciones oscuras de alto contraste para inspirar. El naranja empuja a la acción, el Volt destaca promociones y el Signal confirma. Todo valor sale de un token; nada se decide a ojo.

**Personalidad:** Determinada · Cercana · Contemporánea · Confiable · Activa · Orgullosamente peruana, sin clichés.

### Tono de voz

Directo, motivador y humano. Habla con energía, pero no grita ni exagera. Acompaña al usuario en lugar de presionarlo.

| Debe sonar | Ejemplo |
|---|---|
| Claro | “Encuentra tu talla y entrena cómodo.” |
| Motivador | “Tu próxima meta empieza hoy.” |
| Cercano | “Todo listo para seguir avanzando.” |
| Seguro | “Compra productos verificados y recibe seguimiento de tu pedido.” |
| Deportivo | “Equípate para dar tu mejor paso.” |

**Evitar:** exceso de palabras en inglés; frases agresivas como “sé el mejor” o “no pares nunca”; expresiones demasiado juveniles, forzadas o informales; referencias folklóricas superficiales.

### Logotipo

“INKA” en itálica bold con una figura de corredor integrada y “ATHLETICS” espaciado debajo.

| Variante | Color | Uso |
|---|---|---|
| Principal | Ink `#1B1812` | Por defecto, sobre fondos claros (Cloud / blanco) |
| Volt | Volt `#C3E504` | Sobre superficies oscuras (Ink) y piezas promocionales |
| Signal | Signal `#4361EE` | Sobre fondos claros en contextos institucionales o de confirmación |

No deformar, rotar ni recolorear fuera de estas tres variantes. No usar la versión Volt sobre fondos claros.

---

## Tipografía

| Familia | Uso | Pesos |
|---|---|---|
| **Oswald** | H1, H2 y H3 · alto impacto, siempre en MAYÚSCULAS | 700 |
| **Inter** | H4, cuerpo, labels, formularios y contenido | 400, 600, 700 |

### Escala tipográfica

| Nivel (token Figma) | Clase Tailwind | Font | Tamaño / interlineado | Uso |
|---|---|---|---|---|
| H1 `Typography/Heading/H1` | `font-heading text-[32px] leading-10 font-bold uppercase` | Oswald 700 | 32 / 40 px | Título principal de página |
| H2 `Typography/Heading/H2` | `font-heading text-[28px] leading-9 font-bold uppercase` | Oswald 700 | 28 / 36 px | Título de sección |
| H3 `Typography/Heading/H3` | `font-heading text-2xl font-bold uppercase` | Oswald 700 | 24 / 32 px | Subsección (“Ofertas de la semana”) |
| H4 `Typography/Heading/H4` | `text-xl font-bold` | Inter 700 | 20 / 28 px | Título de tarjeta |
| Subtitle `Typography/Subtitle` | `text-lg leading-[26px] font-semibold` | Inter 600 | 18 / 26 px | Subtítulo que orienta la siguiente acción |
| Body `Typography/Body` | `text-base` | Inter 400 | 16 / 24 px | Texto principal de la interfaz |
| Body Small `Typography/Body/Small` | `text-sm` | Inter 400 | 14 / 20 px | Info secundaria, tarjetas y listas |
| Label `Typography/Label` | `text-sm font-semibold` | Inter 600 | 14 / 20 px | Etiquetas de campo (“Correo electrónico”) |
| Auxiliary `Typography/Auxiliary` | `text-xs` | Inter 400 | 12 / 16 px | Ayudas y notas (“Enviaremos la confirmación a este correo.”) |

Letter-spacing 0 en todos los niveles.

---

## Paleta de colores

25 variables semánticas en modo Light. En código siempre se usa el token, nunca el hexadecimal suelto.

### Tokens base

```css
/* Action — acciones prioritarias (texto encima: Ink) */
--color-action-primary:        #F76707   /* Naranja — CTA principal */
--color-action-primary-hover:  #C2410C   /* Hover / pressed (texto encima: inverse) */
--color-action-primary-soft:   #FCE3D0   /* Fondos suaves de acción y avisos */

/* Accent — marca */
--color-accent-volt:           #C3E504   /* Promociones y destacados (texto: Ink) */
--color-accent-volt-soft:      #EEF7B0
--color-accent-signal:         #4361EE   /* Foco, confirmación, elementos nuevos (texto: inverse) */
--color-accent-signal-soft:    #E1E6FB

/* Surfaces */
--color-surface-ink:           #1B1812   /* Secciones oscuras de alto contraste */
--color-surface-ink-soft:      #26221A   /* Capas sobre Ink */
--color-surface-cloud:         #F7F5F0   /* Fondo de página */
--color-surface-cloud-subtle:  #EDEAE2   /* Fondo secundario, contenedores */

/* Text */
--color-text-primary:          #1B1812   /* = Ink */
--color-text-inverse:          #F7F5F0   /* = Cloud */
--color-text-secondary:        #495057   /* Descripciones, metadatos */
--color-text-disabled:         #868E96

/* Border */
--color-border-default:        #DEE2E6
--color-border-inverse:        #3A362C   /* Bordes sobre superficies oscuras */
```

### Colores semánticos de estado

Estados del sistema, independientes de los colores de marca.

| Estado | Color | Background | Uso |
|---|---|---|---|
| Success | `#2F9E44` | `#EBFBEE` | Pedido confirmado, pago aprobado, acción completada |
| Warning | `#F08C00` | `#FFF9DB` | Stock bajo, datos por revisar |
| Error | `#E03131` | `#FFF5F5` | Validación fallida, pago rechazado |
| Info | `#1971C2` | `#E7F5FF` | Mensajes informativos, estado del envío |

**Regla:** los colores semánticos solo comunican estados (badges, alertas, validaciones). No sustituyen a los colores de marca ni se usan como decoración.

### Combinaciones aprobadas

| Caso | Fondo | Texto | Ejemplo |
|---|---|---|---|
| Acción principal | `action-primary` | `text-primary` (Ink) | “Comprar ahora” |
| Hover principal | `action-primary-hover` | `text-inverse` | “Comprar ahora” |
| Sección oscura | `surface-ink` | `text-inverse` | “Explorar productos” |
| Promoción | `accent-volt` | `text-primary` (Ink) | “Oferta -20 %” |
| Confirmación | `accent-signal` | `text-inverse` | “Continuar al pago” |

---

## Componentes *(propuesta)*

### Botones

| Variante | Uso | Clases |
|---|---|---|
| Primary | Acción principal (Comprar ahora, Agregar al carrito) | `bg-action-primary text-text-primary hover:bg-action-primary-hover hover:text-text-inverse` |
| Confirm | Avanzar en el checkout (Continuar al pago) | `bg-accent-signal text-text-inverse` |
| Secondary | Acciones secundarias (Ver detalle) | `bg-surface-cloud-subtle text-text-primary hover:bg-border-default` |
| Outline | Acciones terciarias (Explorar productos) | `border border-text-primary text-text-primary hover:bg-surface-cloud-subtle` |
| Danger | Acciones destructivas (Eliminar del carrito) | `border border-error text-error hover:bg-error-bg` |
| ActionIcon | Botón de solo icono (Favoritos) | `p-2 rounded-lg` + `aria-label` obligatorio |

Padding base: `px-4 py-2` (`spacing/md`, `spacing/sm`). Radius: `rounded-lg` (`radius/sm`, 8px). Texto: Label (`text-sm font-semibold`). Icono 20px a 8px del texto (`gap-2`). Deshabilitado: `text-text-disabled`, sin depender solo de la opacidad.

### Badges y tags

```tsx
<span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-semibold"
      style={{ color: statusColor, backgroundColor: statusBg }}>
  <IconCircleCheck size={16} aria-hidden />
  ENTREGADO
</span>
```

- Radius: `rounded-full` (`radius/full`).
- Promoción: fondo `accent-volt`, texto Ink (“-20 %”).
- Nuevo: fondo `accent-signal-soft`, texto `accent-signal`.
- Estado: colores semánticos + icono o texto (nunca solo color).

### Tarjeta de producto

Estructura: `imagen → body (nombre H4 + precio + badges) → footer (acciones)`.
- Fondo: `bg-white` sobre `surface-cloud`
- Borde: `border border-border-default`
- Radius: `rounded-xl` (`radius/md`, 12px)
- Padding interno: `p-4` (`spacing/md`)
- Distribución: 1 por fila en móvil, 2 en tablet, 4 en desktop (ver Layout)

### Inputs

- Label: Typography/Label; ayuda: Typography/Auxiliary en `text-secondary`
- Padding: `px-4` (`spacing/md`); radius `rounded-lg` (`radius/sm`)
- Borde normal: `border border-border-default`
- Borde error: `border border-error` + mensaje de error con icono
- Borde advertencia: `border border-warning`
- Focus: `focus:ring-2 focus:ring-accent-signal focus:border-transparent` (Signal = foco)
- Iconos dentro del input: 20px

### Modales

- Radius: `rounded-2xl` (`radius/lg`, 16px)
- Padding: `p-6` (`spacing/lg`); separación entre grupos `gap-6`

---

## Layout

### Grilla responsive

12 columnas en todos los tamaños; cambian el margen, el gutter y el ancho máximo.

| Breakpoint | Referencia | Margen | Gutter | Ancho máximo |
|---|---|---|---|---|
| Base | < 576 px | 16 px | 16 px | Fluido |
| xs | ≥ 576 px | 20 px | 16 px | 540 px |
| sm | ≥ 768 px | 24 px | 20 px | 720 px |
| md | ≥ 992 px | 32 px | 24 px | 960 px |
| lg | ≥ 1200 px | 32 px | 24 px | 1140 px |
| xl | ≥ 1408 px | 40 px | 24 px | 1320 px |

Estos breakpoints **no** son los de Tailwind por defecto: hay que declararlos en `theme.screens` (`xs: 576px, sm: 768px, md: 992px, lg: 1200px, xl: 1408px`).

### Grilla de productos

| Dispositivo | Columnas por tarjeta | Tarjetas por fila |
|---|---|---|
| Móvil | 12 | 1 |
| Tablet | 6 | 2 |
| Desktop | 3 | 4 |

---

## Espaciado

Escala base 4px. El valor por defecto dentro de un componente es **16px**.

| Token | Valor | Tailwind | Uso |
|---|---|---|---|
| `spacing/xs` | 4px | `p-1` / `gap-1` | Separación mínima |
| `spacing/sm` | 8px | `p-2` / `gap-2` | Icono y texto |
| `spacing/md` | 16px | `p-4` / `gap-4` | Padding estándar |
| `spacing/lg` | 24px | `p-6` / `gap-6` | Entre grupos |
| `spacing/xl` | 32px | `p-8` / `gap-8` | Entre secciones |

Usar solo estos valores. Evitar valores arbitrarios: 7, 13, 19 o 27px.

---

## Radios

Se aplican mediante tokens compartidos. El valor por defecto es **8px**.

| Token | Valor | Tailwind | Uso |
|---|---|---|---|
| `radius/xs` | 4px | `rounded` | Elementos compactos |
| `radius/sm` | 8px | `rounded-lg` | Botones e inputs |
| `radius/md` | 12px | `rounded-xl` | Tarjetas |
| `radius/lg` | 16px | `rounded-2xl` | Modales |
| `radius/full` | 999px | `rounded-full` | Badges y tags |

---

## Iconografía

**Tabler Icons** es el set único. Lienzo oficial de 24×24px, trazo de 2px y 8px hasta el texto.

| Tamaño | Uso |
|---|---|
| 16×16px | Controles y navegación |
| 20×20px | Botones e inputs |
| 24×24px | Controles y navegación (lienzo oficial) |

- **Color:** usar `currentColor`; el icono hereda el color del control.
- **Separación:** 8px entre icono y texto (`gap-2`).
- **Accesibilidad:** un icono interactivo requiere un control y un nombre accesible.

---

## Reglas de escritura de datos *(propuesta)*

| Tipo | Formato |
|---|---|
| Precios | `S/ 199.90`: signo de soles, espacio, separador de miles y 2 decimales |
| Precio con descuento | Precio final + precio anterior tachado (`S/ 159.92` ~~`S/ 199.90`~~) |
| Descuentos | `-20 %`: signo menos y espacio antes de `%` (como en Figma) |
| Tallas | `S · M · L · XL` / calzado `40 · 41 · 42`, nunca mezclar sistemas en un mismo selector |
| Fechas | `DD/MM/YYYY`, sin abreviar el año |
| Microcopy | En español y en segunda persona (“Encuentra tu talla”), siguiendo el tono de voz |

---

## Accesibilidad

- Respetar las combinaciones aprobadas: texto sobre `action-primary` y `accent-volt` siempre en Ink.
- Contraste mínimo **4.5:1** para texto (WCAG AA).
- Nunca comunicar un estado solo con color: acompañarlo con texto, icono significativo y control accesible.
- Todo icono interactivo va dentro de un control (`ActionIcon`) con nombre accesible: `aria-label="Agregar a favoritos"`.
- Focus visible con `accent-signal` en todos los elementos interactivos.
- Controles deshabilitados con `text-disabled`.

---

## Do's y Don'ts

Reglas para preservar coherencia visual, accesibilidad y la equivalencia entre Figma y React.

**Do**
- Usar H1, H2 y H3 en Oswald Bold y mayúsculas (ej.: `Heading/H2` para el título de una sección).
- Usar variables de espaciado y radio en los componentes (ej.: `spacing/md` y `radius/sm` en un input).
- Usar `ActionIcon` con nombre accesible cuando solo hay un icono (ej.: `aria-label="Agregar a favoritos"`).

**Don't**
- No usar Oswald para cuerpo, labels ni textos auxiliares: esos van en Inter.
- No usar valores arbitrarios como 13px o radios de 10px: elegir un token o incorporarlo al sistema.
- No comunicar un estado solo con color ni poner click en un icono suelto.
- No usar Volt ni el naranja principal con texto claro encima: el texto va en Ink.
- No usar colores semánticos (success, error…) como colores de marca o decoración.
