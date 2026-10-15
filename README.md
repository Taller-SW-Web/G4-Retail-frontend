# G4 Retail — Frontend

Prototipo de punto de venta para el módulo Retail del Marketplace Deportivo. Está construido con React, Vite, TypeScript y Tailwind CSS; por ahora usa un catálogo local y no requiere backend.

## Cómo iniciar

```bash
npm install
npm run dev
npm test
npm run build
```

El acceso es una simulación: el formulario de inicio de sesión no valida credenciales ni representa autenticación real. El carrito se guarda en `localStorage` bajo la clave `inka-retail-cart`; para vaciar los datos guardados, elimina esa clave desde las herramientas del navegador.

## Qué incluye el prototipo

- Catálogo con búsqueda por nombre, categoría o SKU; las búsquedas no distinguen mayúsculas ni tildes.
- Filtro por categoría y estados de catálogo vacío.
- Carrito con cantidades limitadas al stock disponible, subtotales y persistencia local.
- Formato de precios en soles peruanos y etiquetas de stock.
- Componentes de interfaz reutilizables y pruebas unitarias para las reglas puras del dominio.

El pago, las ventas, los clientes, los turnos y la integración con servicios externos todavía no están implementados.

## Estructura actual

```text
src/
├── components/
│   ├── atoms/       # Button, Badge
│   ├── molecules/   # SearchBar, CategoryFilter, StockBadge, EmptyState, StatCard
│   └── organisms/   # ProductCard, CartPanel
├── data/            # Catálogo local de productos
├── lib/             # Formato, búsqueda, inventario, carrito y persistencia
├── pages/           # LoginPage, PosPage
├── App.tsx          # Estado y composición del flujo actual
├── index.css        # Tokens y estilos globales
└── types.ts         # Tipos compartidos del dominio
```

## Cómo añadir funcionalidades

1. Define los tipos y las reglas de negocio en `src/types.ts` y `src/lib/`. Mantén esas reglas como funciones puras cuando sea posible para poder probarlas sin renderizar React.
2. Añade piezas pequeñas y reutilizables en `components/atoms/`; combina átomos en `components/molecules/` y reserva `components/organisms/` para secciones completas con comportamiento propio.
3. Compón los organismos desde `pages/`. Mantén el estado compartido en `App.tsx` mientras el flujo sea pequeño; extrae un store o servicio cuando una funcionalidad lo justifique.
4. Añade pruebas junto a las reglas de dominio (`*.test.ts`) y ejecuta `npm test` y `npm run build` antes de integrar cambios.
5. Usa los tokens de `src/index.css` para mantener el sistema visual documentado en [`docs/design-system.md`](./docs/design-system.md), y conserva etiquetas accesibles y estados vacíos para las interacciones nuevas.
