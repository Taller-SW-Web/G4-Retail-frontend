// RF-04/14/15: navegador real, API simulada; no acredita integración G4/G5.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { chromium } = createRequire(path.join(process.env.PLAYWRIGHT_ROOT, 'package.json'))('playwright');
const output = path.resolve('reports/e2e');
const origin = 'http://127.0.0.1:4173';
fs.mkdirSync(output, { recursive: true });

async function main() {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const scenario of ['exito', 'rechazo']) {
      const context = await browser.newContext();
      await context.tracing.start({ screenshots: true, snapshots: true });
      const page = await context.newPage();
      const sales = [];
      const unexpected = [];
      const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
      const token = `${encode({alg:'none'})}.${encode({sub:'vendedor-prueba',exp:Math.floor(Date.now()/1000)+600})}.fixture`;
      await context.addInitScript(value => localStorage.setItem('retail.token', value), token);
      await page.route('**/*', async route => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.origin === origin && !url.pathname.startsWith('/api/')) return route.continue();
        const respond = (body, status = 200) => route.fulfill({ status, contentType:'application/json', body:JSON.stringify(body) });
        if (url.pathname === '/api/v1/retail/health') return respond({status:'UP'});
        if (url.pathname === '/api/v1/retail/perfil') return respond({usuarioId:'vendedor-prueba',codigoVendedor:'VEN-TEST',perfilTienda:'VENDEDOR',tiendaId:'tienda-prueba',activo:true});
        if (url.pathname === '/api/v1/retail/caja/turnos/actual') return respond({estado:'ABIERTA',turnoId:'turno-prueba',terminalPos:'POS-TEST'});
        if (url.pathname === '/api/v1/retail/catalogo') return respond({items:[{productoId:'PROD-TEST',nombre:'Polo prueba',categoria:'CAT-ROPA',precio:59.9,variantes:[{sku:'SKU-TEST',talla:'M',color:'Blanco',disponibilidad:'DISPONIBLE',stockTienda:10,enCuarentena:false}]}],page:0,size:20,total:1});
        // F11 torre de control (contrato §5.11): el POS la consulta al cargar.
        if (url.pathname === '/api/v1/retail/control/resumen') return respond({pickupPendientes:0,stockCritico:0,campanasVigentes:0,fuentesNoDisponibles:[],actualizadoEn:'2026-11-26T12:00:00Z'});
        if (url.pathname === '/api/v1/retail/control/campanas-vigentes') return respond([]);
        if (url.pathname === '/api/v1/retail/control/stock-critico') return respond([]);
        if (url.pathname === '/api/v1/retail/control/pickup-pendientes') return respond([]);
        // F12 cuarentena (§5.12) y F4 cálculo del carrito (§5.4, RF-11): el POS los consulta al cargar y al cambiar el carrito.
        if (url.pathname === '/api/v1/retail/inventario/cuarentena') return respond([]);
        if (url.pathname === '/api/v1/retail/carritos/calcular' && request.method() === 'POST') {
          return respond({lineas:[{sku:'SKU-TEST',cantidad:1,precioUnitario:59.9,descuento:0,precioFinal:59.9,promocionAplicada:null}],subtotalBruto:59.9,descuentoTotal:0,totalPagar:59.9,baseImponible:50.76,montoIgv:9.14,moneda:'PEN',evaluacionId:'EVAL-TEST',advertencias:[]});
        }
        if (url.pathname === '/api/v1/retail/ventas' && request.method() === 'POST') {
          sales.push(request.postDataJSON());
          if (scenario === 'rechazo') return respond({status:409,code:'STOCK_INSUFICIENTE',detail:'Stock insuficiente de prueba'},409);
          return respond({pedidoId:'PED-TEST',pago:{medioPago:'EFECTIVO',montoRecibido:59.9,vuelto:0},comprobante:{tipo:'BOLETA',serie:'BTEST',correlativo:'00000001',subtotal:50.76,igv:9.14,total:59.9,fechaEmision:'2026-11-26T12:00:00Z',qr:'fixture'},items:[{sku:'SKU-TEST',cantidad:1,precioFinal:59.9}]});
        }
        // Ninguna API externa ni recurso remoto (fuentes/hojas de estilo/imágenes) sale a la red.
        if (!['image', 'stylesheet', 'font'].includes(request.resourceType())) {
          unexpected.push(`${request.method()} ${url.pathname}`);
        }
        return route.abort();
      });
      try {
        await page.goto(`${origin}/pos`);
        await page.getByRole('button', {name:/Escanear código de prueba SKU-TEST:/}).click();
        await page.getByRole('button', {name:'Proceder al Cobro'}).click();
        await page.getByRole('button', {name:'Exacto',exact:true}).click();
        await page.getByRole('button', {name:'Confirmar Pago y Finalizar'}).click();
        if (scenario === 'exito') {
          await page.waitForURL('**/pos/comprobante');
          const receipt = await page.evaluate(() => JSON.parse(sessionStorage.getItem('f5_ultima_venta')));
          assert.equal(receipt.pedidoId,'PED-TEST');
          assert.equal(receipt.total,59.9);
        } else {
          await page.getByText('Stock insuficiente de prueba',{exact:true}).waitFor();
          assert.equal(await page.evaluate(() => sessionStorage.getItem('f5_ultima_venta')),null);
          assert.ok(!page.url().endsWith('/comprobante'));
        }
        assert.equal(sales.length,1,'Una venta por confirmación');
        assert.deepEqual(sales[0].items,[{sku:'SKU-TEST',cantidad:1}]);
        assert.equal(sales[0].evaluacionId,'EVAL-TEST','La venta lleva la evaluación de /carritos/calcular (§5.5)');
        assert.deepEqual(unexpected,[],'No debe haber APIs no cubiertas');
        results.push({id:`CP-F5-${scenario}`,status:'PASS'});
      } catch (error) {
        console.error(`[${scenario}] FAIL:`, error.message);
        results.push({id:`CP-F5-${scenario}`,status:'FAIL',error:error.message});
        await page.screenshot({path:path.join(output,`${scenario}.png`)});
      } finally {
        await context.tracing.stop({path:path.join(output,`${scenario}-trace.zip`)});
        await context.close();
      }
    }
  } finally { await browser.close(); }
  const report = {sha:process.env.GITHUB_SHA,run_id:process.env.GITHUB_RUN_ID,mode:'navegador real / API simulada',results};
  fs.writeFileSync(path.join(output,'resultados.json'),JSON.stringify(report,null,2));
  if (results.length !== 2 || results.some(r=>r.status!=='PASS')) process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1;});
