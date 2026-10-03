import type {
  AltaClienteRequest,
  CarritoEspera,
  ConfirmarEntregaRequest,
  FinalizarVentaRequest,
  Producto,
} from '../../types'
import { IGV } from '../../lib/totals'
import { PASSWORD_DEMO, PRODUCTOS, USUARIOS, guardarDb, leerDb, type UsuarioMock } from './db'

// API simulada: implementa los endpoints de specs/api-contracts.md que consume
// el frontend, con persistencia en localStorage.

interface Respuesta {
  status: number
  body?: unknown
}

const ok = (body?: unknown, status = 200): Respuesta => ({ status, body })
const problema = (status: number, detail: string, extra: object = {}): Respuesta => ({
  status,
  body: { title: 'Error', status, detail, ...extra },
})

const LATENCIA_MS = 250
const TURNO_MS = 8 * 3_600_000

const emitirToken = (u: UsuarioMock) => `mock.${btoa(JSON.stringify({ sub: u.id, exp: Date.now() + TURNO_MS }))}`

function usuarioDeToken(token: string | null) {
  try {
    const { sub, exp } = JSON.parse(atob(token!.split('.')[1]))
    return exp > Date.now() ? USUARIOS.find((u) => u.id === sub) : undefined
  } catch {
    return undefined
  }
}

const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

const conStock = (p: Producto, consumido: Record<string, number>): Producto => ({
  ...p,
  variantes: p.variantes.map((v) => ({ ...v, stockTienda: Math.max(v.stockTienda - (consumido[v.sku] ?? 0), 0) })),
})

const redondear = (n: number) => Math.round(n * 100) / 100

type Handler = (ctx: { cuerpo: any; usuario: UsuarioMock; params: URLSearchParams; id: string }) => Respuesta

const rutas: [metodo: string, patron: RegExp, handler: Handler][] = [
  ['GET', /^\/api\/v1\/retail\/catalogo\/buscar$/, ({ params }) => {
    const db = leerDb()
    const query = normalizar(params.get('query') ?? '')
    const filtros = (['disciplina', 'marca', 'categoria'] as const).map((campo) => [campo, params.get(campo)] as const)
    const items = PRODUCTOS.filter(
      (p) =>
        filtros.every(([campo, valor]) => !valor || p[campo] === valor) &&
        (!query ||
          [p.nombre, p.marca, p.disciplina, p.categoria].some((campo) => normalizar(campo).includes(query)) ||
          p.variantes.some((v) => normalizar(v.sku) === query || v.codigoBarras === query)),
    ).map((p) => conStock(p, db.consumido))
    return ok({ total: items.length, items })
  }],

  ['POST', /^\/api\/v1\/retail\/clientes\/buscar$/, ({ cuerpo }) => {
    const documento = String(cuerpo?.documento ?? '')
    if (!/^\d{8}$/.test(documento)) return problema(400, 'El documento debe contener 8 dígitos exactos')
    const cliente = leerDb().clientes.find((c) => c.numeroDocumento === documento)
    if (!cliente) return problema(404, 'Cliente no registrado')
    return ok({
      id: cliente.id,
      nombre: `${cliente.nombres} ${cliente.apellidos}`.trim(),
      documentoEnmascarado: `${documento.slice(0, 2)}****${documento.slice(-2)}`,
    })
  }],

  ['POST', /^\/api\/v1\/retail\/clientes\/registro-rapido$/, ({ cuerpo }) => {
    const alta = cuerpo as AltaClienteRequest
    const longitud = alta.tipoDocumento === 'DNI' ? 8 : 11
    if (!new RegExp(`^\\d{${longitud}}$`).test(alta.numeroDocumento ?? '')) {
      return problema(400, 'Longitud o formato de documento inválido')
    }
    const db = leerDb()
    const existente = db.clientes.find((c) => c.numeroDocumento === alta.numeroDocumento)
    if (existente) return problema(409, 'Ya existe un cliente registrado con ese número de documento')
    const { canalOrigen: _canal, ...datos } = alta
    const cliente = { id: `cli-${100 + db.clientes.length + 2}`, ...datos }
    db.clientes.push(cliente)
    guardarDb(db)
    return ok({ ...cliente, estado: 'PENDIENTE_ACTIVACION' }, 201)
  }],

  ['POST', /^\/api\/v1\/retail\/ventas\/finalizar$/, ({ cuerpo }) => {
    const venta = cuerpo as FinalizarVentaRequest
    const db = leerDb()
    if (!db.caja) return problema(422, 'No hay un turno de caja abierto en esta terminal')
    if (!venta.items?.length) return problema(400, 'La venta no contiene artículos')

    const total = redondear(venta.items.reduce((suma, i) => suma + i.precioFinal * i.cantidad, 0))
    if (Math.abs(total - venta.pago.monto) > 0.001) return problema(400, 'Discrepancia en importes')
    if (venta.comprobante.tipo === 'BOLETA' && total >= 700 && !/^\d{8}$/.test(venta.comprobante.numeroDocumento)) {
      return problema(400, 'Cliente sin DNI para boleta mayor o igual a S/ 700.00')
    }

    const variantes = PRODUCTOS.flatMap((p) => conStock(p, db.consumido).variantes.map((v) => ({ ...v, nombre: p.nombre })))
    for (const item of venta.items) {
      const variante = variantes.find((v) => v.sku === item.sku)
      if (!variante || variante.stockTienda < item.cantidad) {
        return problema(409, 'Stock insuficiente en tienda física', { sku: item.sku, nombre: variante?.nombre })
      }
    }
    for (const item of venta.items) db.consumido[item.sku] = (db.consumido[item.sku] ?? 0) + item.cantidad

    if (venta.pago.medioPago === 'EFECTIVO') db.caja.ventasEfectivo = redondear(db.caja.ventasEfectivo + total)
    else db.caja.ventasTarjeta = redondear(db.caja.ventasTarjeta + total)

    const n = db.secuencia++
    guardarDb(db)
    const subtotal = redondear(total / (1 + IGV))
    const ahora = new Date()
    return ok(
      {
        pedidoId: `ORD-RET-${ahora.getFullYear()}-${String(n).padStart(4, '0')}`,
        estado: 'PAGADO',
        comprobante: {
          serie: venta.comprobante.tipo === 'FACTURA' ? 'F001' : 'B001',
          correlativo: String(45140 + n).padStart(8, '0'),
          subtotal,
          igv: redondear(total - subtotal),
          total,
          fechaEmision: ahora.toISOString(),
        },
        ...(venta.emitirTicketRegalo && {
          ticketRegalo: {
            codigoCanje: `GIFT-${ahora.getFullYear()}-${String(9033 + n).padStart(5, '0')}`,
            fechaLimiteCambio: new Date(ahora.getTime() + 30 * 86_400_000).toISOString(),
            mensaje: 'Válido para cambio presencial por 30 días',
          },
        }),
      },
      201,
    )
  }],

  ['GET', /^\/api\/v1\/retail\/pickup\/pendientes$/, () => ok(leerDb().pickups)],

  ['POST', /^\/api\/v1\/retail\/pickup\/confirmar$/, ({ cuerpo }) => {
    const entrega = cuerpo as ConfirmarEntregaRequest
    const db = leerDb()
    const pedido = db.pickups.find((p) => p.pedidoId === entrega.pedidoId)
    if (pedido?.estado !== 'LISTO_PARA_RECOJO') return problema(400, 'El paquete no figura en estado listo para recojo')
    db.pickups = db.pickups.filter((p) => p !== pedido)
    guardarDb(db)
    return ok({ status: 'ENTREGADO_EN_TIENDA', fechaHora: new Date().toISOString() })
  }],

  ['GET', /^\/api\/v1\/retail\/caja\/estado-actual$/, () => {
    const { caja } = leerDb()
    if (!caja) return ok({ estado: 'CERRADA' })
    const { sesionId, terminalPos, cajero, fechaHoraApertura } = caja
    return ok({ estado: 'ABIERTA', sesionId, terminalPos, cajero, fechaHoraApertura })
  }],

  ['POST', /^\/api\/v1\/retail\/caja\/apertura$/, ({ cuerpo, usuario }) => {
    const db = leerDb()
    if (db.caja) return problema(409, 'La terminal ya cuenta con un turno abierto. Debe cerrarlo antes de iniciar uno nuevo')
    const saldo = Number(cuerpo?.saldoInicialEfectivo)
    if (!Number.isFinite(saldo) || saldo < 0) return problema(400, 'El monto no puede ser negativo')
    db.caja = {
      sesionId: `ses-${9900 + db.secuencia++}`,
      terminalPos: cuerpo.terminalPos,
      cajero: `${usuario.nombres} ${usuario.apellidos}`,
      saldoInicial: saldo,
      fechaHoraApertura: new Date().toISOString(),
      ventasEfectivo: 0,
      ventasTarjeta: 0,
    }
    guardarDb(db)
    return ok({ sesionId: db.caja.sesionId, estado: 'ABIERTA', fechaHoraApertura: db.caja.fechaHoraApertura }, 201)
  }],

  ['POST', /^\/api\/v1\/retail\/caja\/cierre$/, ({ cuerpo }) => {
    const db = leerDb()
    const { caja } = db
    if (!caja) return problema(409, 'La terminal no tiene un turno abierto')
    const saldoSistema = redondear(caja.saldoInicial + caja.ventasEfectivo)
    const saldoDeclarado = redondear(Number(cuerpo?.montoDeclarado) || 0)
    const diferencia = redondear(saldoDeclarado - saldoSistema)
    db.caja = null
    guardarDb(db)
    return ok({
      sesionId: caja.sesionId,
      saldoInicial: caja.saldoInicial,
      ventasEfectivoTotal: caja.ventasEfectivo,
      ventasTarjetaTotal: caja.ventasTarjeta,
      ingresosMenores: 0,
      egresosMenores: 0,
      saldoSistema,
      saldoDeclarado,
      diferencia,
      estado: diferencia === 0 ? 'CERRADA' : 'OBSERVADA',
      reporteZUrl: `/reportes/corte-z-${caja.sesionId}.pdf`,
    })
  }],

  ['GET', /^\/api\/v1\/retail\/carritos-espera$/, () => ok(leerDb().carritosEspera)],

  ['POST', /^\/api\/v1\/retail\/carritos-espera$/, ({ cuerpo }) => {
    const db = leerDb()
    const ahora = Date.now()
    const carrito: CarritoEspera = {
      ...cuerpo,
      carritoEsperaId: `park-${String(db.secuencia++).padStart(3, '0')}`,
      fechaHoraInicio: new Date(ahora).toISOString(),
      expiracion: new Date(ahora + TURNO_MS).toISOString(),
    }
    db.carritosEspera.push(carrito)
    guardarDb(db)
    return ok(carrito, 201)
  }],

  ['DELETE', /^\/api\/v1\/retail\/carritos-espera\/([\w-]+)$/, ({ id }) => {
    const db = leerDb()
    db.carritosEspera = db.carritosEspera.filter((c) => c.carritoEsperaId !== id)
    guardarDb(db)
    return ok(undefined, 204)
  }],
]

function login(cuerpo: any): Respuesta {
  const email = String(cuerpo?.email ?? '').trim().toLowerCase()
  const password = String(cuerpo?.password ?? '')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !password) return problema(400, 'Formato de email inválido o campos vacíos')
  const usuario = USUARIOS.find((u) => u.email === email)
  if (!usuario || !usuario.activo || password !== PASSWORD_DEMO) return problema(401, 'Credenciales erróneas o usuario inactivo')
  if (!usuario.rol) return problema(403, 'El usuario no posee perfil operativo autorizado')
  return ok({ token: emitirToken(usuario), usuario })
}

export async function mockRequest(metodo: string, ruta: string, cuerpo: unknown, token: string | null): Promise<Respuesta> {
  await new Promise((resolver) => setTimeout(resolver, LATENCIA_MS))
  const [path, queryString] = ruta.split('?')
  if (metodo === 'POST' && path === '/api/v1/auth/login') return login(cuerpo)

  const usuario = usuarioDeToken(token)
  if (!usuario) return problema(401, 'Token ausente, vencido o inválido')

  for (const [m, patron, handler] of rutas) {
    const coincidencia = m === metodo && patron.exec(path)
    if (coincidencia) return handler({ cuerpo, usuario, params: new URLSearchParams(queryString), id: coincidencia[1] })
  }
  return problema(404, `Ruta no simulada: ${metodo} ${path}`)
}
