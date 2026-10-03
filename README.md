# G4 Retail — Frontend (POS de mostrador)

Terminal de venta asistida del **Módulo Retail** del Marketplace Deportivo (Inka Athletics).
React + Vite + TypeScript + Tailwind CSS, construido a partir de las specs de
[G4-Retail-specs](https://github.com/Taller-SW-Web/G4-Retail-specs) y del sistema de diseño en
[`docs/design-system.md`](./docs/design-system.md).

## Cómo correrlo

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # pruebas unitarias (totales, vuelto, validaciones)
npm run build
```

Por defecto la app usa una **API simulada en el navegador** (`src/api/mock`), así que no necesita backend.
Usuarios de demostración (contraseña `Retail2026!`):

| Correo | Rol |
|---|---|
| `vendedor1@inkaathletics.pe` | Vendedor |
| `cajero1@inkaathletics.pe` | Cajero (puede cerrar caja) |
| `supervisor1@inkaathletics.pe` | Supervisor (puede cerrar caja) |

Los datos simulados (stock, clientes, pickups, caja) se guardan en `localStorage`; para reiniciarlos borra la clave
`g4-retail-mock-db`.

Para conectar el backend real copia `.env.example` a `.env` y define `VITE_USE_MOCKS=false` y `VITE_API_URL`.

## Alcance

Funcionalidades **Must Have** de [FUNCIONALIDADES-RF.md](https://github.com/Taller-SW-Web/G4-Retail-specs/blob/main/FUNCIONALIDADES-RF.md):

| Funcionalidad | RF implementados |
|---|---|
| F1 Inicio de sesión | RF-01, RF-02, RF-03 |
| F2 Catálogo y disponibilidad | RF-04, RF-05, RF-06 |
| F3 Clientes | RF-07, RF-08, RF-09 |
| F4 Venta asistida | RF-10, RF-12 |
| F5 Pago y comprobante | RF-13, RF-14, RF-15 |
| F7 Pickup | RF-18, RF-19 |
| F8 Turno y caja | RF-20, RF-22 |

Pendientes (Should/Could): RF-11 cupones y promociones, RF-21 movimientos menores de caja, y F6, F9, F10, F11, F12.

## Estructura (Atomic Design)

```
src/
├── components/
│   ├── atoms/        Button, ActionIcon, Input, Select, Checkbox, Badge, Chip, Spinner, Logo, ProductImage
│   ├── molecules/    FormField, SearchBar, QuantityStepper, StockBadge, Alert, Modal, ConfirmDialog,
│   │                 SegmentedControl, SummaryRow, EmptyState, Toaster
│   ├── organisms/    LoginForm, AppHeader, CatalogFilters, ProductCard, ProductDetailModal, CartPanel,
│   │                 CartLine, TotalsPanel, CustomerSection, QuickCustomerModal, HeldCarts, PaymentModal,
│   │                 Receipt, PickupCard, DeliveryModal, ShiftOpenModal, DenominationCounter, ZReport
│   └── templates/    AuthLayout, PosLayout
├── pages/            LoginPage, PosPage, ReceiptPage, PickupPage, CashClosePage
├── router/           AppRouter, RequireAuth (guardián de rutas por rol)
├── services/         Llamadas a los endpoints de specs/api-contracts.md
├── api/              Cliente HTTP (Bearer + manejo de 401) y API simulada
├── store/            Estado global con Zustand (sesión, carrito, caja, pickup, toasts)
├── lib/              Formato, totales/IGV, validaciones, permisos
└── types/            Modelos de los contratos
```

Los tokens del sistema de diseño (colores, tipografías, breakpoints) están declarados en `src/index.css`;
los componentes usan solo esos tokens.
