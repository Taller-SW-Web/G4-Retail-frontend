import type { CarritoEspera, PedidoPickup, Producto, Rol, Usuario, Variante } from '../../types'

// Datos de demostración para trabajar sin backend. Se reemplazan por los
// microservicios reales con VITE_USE_MOCKS=false.

export const PASSWORD_DEMO = 'Retail2026!'

export interface UsuarioMock extends Omit<Usuario, 'rol'> {
  /** null: autenticado en Seguridad pero sin registro en RET_PERSONAL_TIENDA. */
  rol: Rol | null
}

export const USUARIOS: UsuarioMock[] = [
  { id: 'usr-001', email: 'vendedor1@inkaathletics.pe', nombres: 'Carlos', apellidos: 'Mendoza', codigoVendedor: 'VEND-1042', rol: 'VENDEDOR', tiendaId: 'TIENDA-MIRAFLORES', activo: true },
  { id: 'usr-002', email: 'cajero1@inkaathletics.pe', nombres: 'Lucía', apellidos: 'Ramos', codigoVendedor: 'CAJ-2001', rol: 'CAJERO', tiendaId: 'TIENDA-MIRAFLORES', activo: true },
  { id: 'usr-003', email: 'supervisor1@inkaathletics.pe', nombres: 'Jorge', apellidos: 'Salas', codigoVendedor: 'SUP-3001', rol: 'SUPERVISOR', tiendaId: 'TIENDA-MIRAFLORES', activo: true },
  { id: 'usr-900', email: 'cliente@correo.com', nombres: 'Ana', apellidos: 'Cliente', codigoVendedor: '', rol: null, tiendaId: '', activo: true },
  { id: 'usr-901', email: 'inactivo@inkaathletics.pe', nombres: 'Pedro', apellidos: 'Baja', codigoVendedor: 'VEND-0001', rol: 'VENDEDOR', tiendaId: 'TIENDA-MIRAFLORES', activo: false },
]

let correlativoBarras = 7751234567890

/** Genera la matriz talla × color. `stock[color][talla]` = [tienda, almacén central]. */
function variantes(prefijo: string, tallas: string[], colores: Record<string, [number, number][]>, precios: Record<string, number> = {}): Variante[] {
  return Object.entries(colores).flatMap(([color, stock]) =>
    tallas.map((talla, i) => ({
      sku: `${prefijo}-${talla}-${color.toUpperCase().slice(0, 5)}`,
      codigoBarras: String(correlativoBarras++),
      talla,
      color,
      stockTienda: stock[i][0],
      stockAlmacenCentral: stock[i][1],
      ...(precios[talla] && { precio: precios[talla] }),
    })),
  )
}

const ROPA = ['S', 'M', 'L', 'XL']
const CALZADO = ['40', '41', '42', '43']

export const PRODUCTOS: Producto[] = [
  { productoId: 'PROD-CAM-01', nombre: 'Camiseta Deportiva Running Pro', marca: 'AeroSport', categoria: 'Textil', disciplina: 'Running', precioBase: 129.9,
    variantes: variantes('CAM-RUN', ROPA, { Azul: [[5, 30], [8, 45], [2, 12], [0, 20]], Negro: [[3, 10], [0, 0], [1, 8], [6, 25]] }) },
  { productoId: 'PROD-ZAP-01', nombre: 'Zapatilla Running Pegasus 40', marca: 'Nike', categoria: 'Calzado', disciplina: 'Running', precioBase: 499.9,
    variantes: variantes('ZAP-RUN', CALZADO, { Negro: [[4, 15], [0, 28], [3, 9], [2, 0]], Blanco: [[6, 12], [5, 14], [0, 0], [1, 6]] }) },
  { productoId: 'PROD-SHO-01', nombre: 'Short Running Ligero 5"', marca: 'AeroSport', categoria: 'Textil', disciplina: 'Running', precioBase: 89.9,
    variantes: variantes('SHO-RUN', ROPA, { Negro: [[7, 20], [9, 30], [4, 18], [2, 6]], Gris: [[3, 5], [5, 12], [0, 10], [0, 0]] }) },
  { productoId: 'PROD-CAM-02', nombre: 'Camiseta Selección 2026', marca: 'Adidas', categoria: 'Textil', disciplina: 'Fútbol', precioBase: 299.9,
    variantes: variantes('CAM-PERU', ROPA, { Blanco: [[4, 40], [1, 50], [6, 35], [3, 20]], Rojo: [[2, 15], [5, 22], [0, 18], [4, 9]] }) },
  { productoId: 'PROD-CHI-01', nombre: 'Chimpunes Predator League', marca: 'Adidas', categoria: 'Calzado', disciplina: 'Fútbol', precioBase: 389.9,
    variantes: variantes('CHI-FUT', CALZADO, { Negro: [[3, 10], [4, 12], [2, 7], [0, 5]], Volt: [[1, 4], [0, 0], [3, 6], [2, 3]] }) },
  { productoId: 'PROD-BAL-01', nombre: 'Balón de Fútbol Match N.° 5', marca: 'Puma', categoria: 'Accesorios', disciplina: 'Fútbol', precioBase: 119.9,
    variantes: variantes('BAL-FUT', ['5'], { Blanco: [[12, 60]], Naranja: [[3, 25]] }) },
  { productoId: 'PROD-POL-01', nombre: 'Polo Training Dry-Fit', marca: 'Under Armour', categoria: 'Textil', disciplina: 'Training', precioBase: 99.9,
    variantes: variantes('POL-TRA', ROPA, { Gris: [[6, 20], [7, 22], [5, 15], [3, 8]], Azul: [[0, 14], [4, 10], [2, 6], [0, 0]] }, { XL: 109.9 }) },
  { productoId: 'PROD-LEG-01', nombre: 'Leggings Training Compresión', marca: 'Puma', categoria: 'Textil', disciplina: 'Training', precioBase: 149.9,
    variantes: variantes('LEG-TRA', ROPA, { Negro: [[5, 18], [6, 20], [3, 9], [1, 4]], Morado: [[2, 6], [0, 8], [0, 0], [2, 5]] }) },
  { productoId: 'PROD-MAN-01', nombre: 'Par de Mancuernas 5 kg', marca: 'Inka Athletics', categoria: 'Accesorios', disciplina: 'Training', precioBase: 159.9,
    variantes: variantes('MAN-TRA', ['5KG'], { Negro: [[4, 30]] }) },
  { productoId: 'PROD-CAS-01', nombre: 'Casaca Cortaviento Trail', marca: 'The North Face', categoria: 'Textil', disciplina: 'Outdoor', precioBase: 749.9,
    variantes: variantes('CAS-OUT', ROPA, { Verde: [[2, 8], [3, 10], [1, 5], [0, 4]], Negro: [[4, 9], [2, 7], [0, 0], [1, 2]] }) },
  { productoId: 'PROD-MOC-01', nombre: 'Mochila Trekking 30 L', marca: 'The North Face', categoria: 'Accesorios', disciplina: 'Outdoor', precioBase: 329.9,
    variantes: variantes('MOC-OUT', ['30L'], { Gris: [[5, 12]], Naranja: [[0, 6]] }) },
  { productoId: 'PROD-BAS-01', nombre: 'Zapatilla Básquet Court Vision', marca: 'Nike', categoria: 'Calzado', disciplina: 'Básquet', precioBase: 429.9,
    variantes: variantes('ZAP-BAS', CALZADO, { Blanco: [[3, 8], [2, 10], [4, 6], [1, 3]], Rojo: [[0, 5], [2, 4], [0, 0], [3, 2]] }) },
  { productoId: 'PROD-BAS-02', nombre: 'Balón de Básquet Street N.° 7', marca: 'Spalding', categoria: 'Accesorios', disciplina: 'Básquet', precioBase: 139.9,
    variantes: variantes('BAL-BAS', ['7'], { Naranja: [[8, 20]] }) },
]

export interface ClienteMock {
  id: string
  tipoDocumento: string
  numeroDocumento: string
  nombres: string
  apellidos: string
  email: string
  telefono: string
}

interface CajaMock {
  sesionId: string
  terminalPos: string
  cajero: string
  saldoInicial: number
  fechaHoraApertura: string
  ventasEfectivo: number
  ventasTarjeta: number
}

interface MockDb {
  version: number
  /** Stock de tienda ya consumido por SKU. */
  consumido: Record<string, number>
  clientes: ClienteMock[]
  pickups: PedidoPickup[]
  carritosEspera: CarritoEspera[]
  caja: CajaMock | null
  secuencia: number
}

const haceHoras = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()

function semilla(): MockDb {
  return {
    version: VERSION,
    consumido: {},
    clientes: [
      { id: 'cli-101', tipoDocumento: 'DNI', numeroDocumento: '72345678', nombres: 'Juan', apellidos: 'Pérez Torres', email: 'juan.perez@email.com', telefono: '987654321' },
      { id: 'cli-103', tipoDocumento: 'DNI', numeroDocumento: '45678912', nombres: 'María', apellidos: 'González', email: 'maria.gonzalez@email.com', telefono: '912345678' },
    ],
    pickups: [
      { bultoId: 'BLT-8921', pedidoId: 'ORD-WEB-2026-8910', codigoTracking: 'TRK-PICKUP-041', clienteNombre: 'María González', clienteDni: '45678912', anaquelUbicacion: 'Anaquel B-04', fechaArriboTienda: haceHoras(3), estado: 'LISTO_PARA_RECOJO',
        articulos: [{ sku: 'ZAP-RUN-41-BLANC', nombre: 'Zapatilla Running Pegasus 40', talla: '41', color: 'Blanco', categoria: 'Calzado', cantidad: 1 }] },
      { bultoId: 'BLT-8922', pedidoId: 'ORD-WEB-2026-8914', codigoTracking: 'TRK-PICKUP-042', clienteNombre: 'Juan Pérez Torres', clienteDni: '72345678', anaquelUbicacion: 'Estante A - Casillero 14', fechaArriboTienda: haceHoras(5), estado: 'LISTO_PARA_RECOJO',
        articulos: [
          { sku: 'CAM-PERU-M-BLANC', nombre: 'Camiseta Selección 2026', talla: 'M', color: 'Blanco', categoria: 'Textil', cantidad: 2 },
          { sku: 'BAL-FUT-5-BLANC', nombre: 'Balón de Fútbol Match N.° 5', talla: '5', color: 'Blanco', categoria: 'Accesorios', cantidad: 1 },
        ] },
      { bultoId: 'BLT-8917', pedidoId: 'ORD-WEB-2026-8897', codigoTracking: 'TRK-PICKUP-038', clienteNombre: 'Rosa Quispe Huamán', clienteDni: '40123987', anaquelUbicacion: 'Anaquel C-11', fechaArriboTienda: haceHoras(27), estado: 'LISTO_PARA_RECOJO',
        articulos: [{ sku: 'LEG-TRA-S-NEGRO', nombre: 'Leggings Training Compresión', talla: 'S', color: 'Negro', categoria: 'Textil', cantidad: 1 }] },
      { bultoId: 'BLT-8909', pedidoId: 'ORD-WEB-2026-8871', codigoTracking: 'TRK-PICKUP-033', clienteNombre: 'Diego Flores Ccori', clienteDni: '70881234', anaquelUbicacion: 'Estante A - Casillero 02', fechaArriboTienda: haceHoras(50), estado: 'LISTO_PARA_RECOJO',
        articulos: [{ sku: 'CAS-OUT-L-VERDE', nombre: 'Casaca Cortaviento Trail', talla: 'L', color: 'Verde', categoria: 'Textil', cantidad: 1 }] },
      { bultoId: 'BLT-8930', pedidoId: 'ORD-WEB-2026-8932', codigoTracking: 'TRK-PICKUP-047', clienteNombre: 'Lucero Vargas Paz', clienteDni: '48765432', anaquelUbicacion: '', fechaArriboTienda: haceHoras(0), estado: 'EN_CAMINO_A_TIENDA',
        articulos: [{ sku: 'MOC-OUT-30L-GRIS', nombre: 'Mochila Trekking 30 L', talla: '30L', color: 'Gris', categoria: 'Accesorios', cantidad: 1 }] },
    ],
    carritosEspera: [],
    caja: null,
    secuencia: 91,
  }
}

const CLAVE = 'g4-retail-mock-db'
const VERSION = 1

export function leerDb(): MockDb {
  try {
    const db = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as MockDb | null
    if (db?.version === VERSION) return db
  } catch {
    // dato corrupto: se regenera la semilla
  }
  return semilla()
}

export const guardarDb = (db: MockDb) => localStorage.setItem(CLAVE, JSON.stringify(db))
