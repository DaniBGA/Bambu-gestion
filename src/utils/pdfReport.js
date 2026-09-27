import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatFechaDDMMAAAA } from './dateFormat.js'

const COLOR_BAMBU = [58, 100, 64]

function nuevoDocumento(titulo) {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text(`Bambu Gestión — ${titulo}`, 14, 20)
  doc.setFontSize(10)
  doc.setTextColor(120)
  doc.text(`Generado el ${formatFechaDDMMAAAA(new Date().toISOString())}`, 14, 27)
  doc.setTextColor(0)
  return doc
}

function descargar(doc, nombreArchivo) {
  doc.save(`${nombreArchivo}-${new Date().toISOString().slice(0, 10)}.pdf`)
}

/**
 * Reporte general: métricas principales + últimas ventas.
 * (Se mantiene igual que antes, sin cambios de comportamiento.)
 */
export function generarReportePDF({ topMarca, medioMasUsado, totalIngresos, ultimasVentas }) {
  const doc = nuevoDocumento('Reporte General')

  doc.setFontSize(12)
  doc.text('Métricas generales', 14, 40)

  autoTable(doc, {
    startY: 45,
    head: [['Métrica', 'Valor']],
    body: [
      ['Marca más vendida', topMarca || '—'],
      ['Medio de pago más utilizado', medioMasUsado || '—'],
      ['Total de ingresos', `$${Number(totalIngresos).toLocaleString('es-AR')}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: COLOR_BAMBU },
  })

  const finalY = doc.lastAutoTable.finalY + 12
  doc.setFontSize(12)
  doc.text('Últimas ventas', 14, finalY)

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Fecha', 'Producto', 'Cliente', 'Precio', 'Medio de pago', 'Estado']],
    body: ultimasVentas.map((v) => [
      formatFechaDDMMAAAA(v.fecha),
      `${v.inventario?.codigo ?? ''} (${v.inventario?.marcas?.nombre ?? ''})`,
      v.clientes?.nombre ?? '',
      `$${Number(v.precio_venta).toLocaleString('es-AR')}`,
      v.medio_pago,
      v.pagada ? 'Pagada' : 'Pendiente',
    ]),
    theme: 'striped',
    headStyles: { fillColor: COLOR_BAMBU },
    styles: { fontSize: 9 },
  })

  descargar(doc, 'reporte-general')
}

/**
 * Reporte de Stock Actual: listado completo del inventario.
 */
export function generarReporteStock(items) {
  const doc = nuevoDocumento('Stock Actual')

  const disponibles = items.filter((i) => i.en_stock).length
  doc.setFontSize(12)
  doc.text(`Total de productos: ${items.length}  ·  Disponibles: ${disponibles}  ·  Sin stock: ${items.length - disponibles}`, 14, 40)

  autoTable(doc, {
    startY: 46,
    head: [['Código', 'Marca', 'Talle', 'Color', 'Precio compra', 'Estado']],
    body: items.map((i) => [
      i.codigo,
      i.marcas?.nombre || '—',
      i.talle || '—',
      i.color || '—',
      `$${Number(i.precio_compra).toLocaleString('es-AR')}`,
      i.en_stock ? 'Disponible' : 'Sin Stock',
    ]),
    theme: 'striped',
    headStyles: { fillColor: COLOR_BAMBU },
    styles: { fontSize: 9 },
  })

  descargar(doc, 'stock-actual')
}

/**
 * Reporte de Clientes con Historial de Compra: resumen por cliente
 * y detalle de cada compra.
 */
export function generarReporteClientes(clientes, ventas) {
  const doc = nuevoDocumento('Clientes con Historial de Compra')

  const resumen = clientes.map((c) => {
    const comprasCliente = ventas.filter((v) => v.cliente_id === c.id)
    const totalGastado = comprasCliente.reduce((acc, v) => acc + (Number(v.precio_venta) || 0), 0)
    const enMora = comprasCliente.some((v) => !v.pagada)
    return {
      nombre: c.nombre,
      telefono: c.telefono || '—',
      cantidad: comprasCliente.length,
      totalGastado,
      estado: enMora ? 'En mora' : 'Al día',
    }
  })

  doc.setFontSize(12)
  doc.text('Resumen por cliente', 14, 40)

  autoTable(doc, {
    startY: 45,
    head: [['Cliente', 'Teléfono', 'Compras', 'Total gastado', 'Estado']],
    body: resumen.map((r) => [
      r.nombre,
      r.telefono,
      String(r.cantidad),
      `$${r.totalGastado.toLocaleString('es-AR')}`,
      r.estado,
    ]),
    theme: 'striped',
    headStyles: { fillColor: COLOR_BAMBU },
    styles: { fontSize: 9 },
  })

  const finalY = doc.lastAutoTable.finalY + 12
  doc.setFontSize(12)
  doc.text('Detalle de compras', 14, finalY)

  const ventasOrdenadas = [...ventas].sort((a, b) => {
    const nombreA = a.clientes?.nombre || ''
    const nombreB = b.clientes?.nombre || ''
    return nombreA.localeCompare(nombreB) || b.fecha.localeCompare(a.fecha)
  })

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Cliente', 'Fecha', 'Producto', 'Precio', 'Estado']],
    body: ventasOrdenadas.map((v) => [
      v.clientes?.nombre ?? '',
      formatFechaDDMMAAAA(v.fecha),
      `${v.inventario?.codigo ?? ''} (${v.inventario?.marcas?.nombre ?? ''})`,
      `$${Number(v.precio_venta).toLocaleString('es-AR')}`,
      v.pagada ? 'Pagada' : 'Pendiente',
    ]),
    theme: 'striped',
    headStyles: { fillColor: COLOR_BAMBU },
    styles: { fontSize: 9 },
  })

  descargar(doc, 'clientes-historial')
}

/**
 * Reporte de Ventas por Fecha: ventas de un período, con el
 * volumen y el margen de ganancia real obtenido en ese rango.
 */
export function generarReporteVentasPorFecha({ ventas, desde, hasta, totalIngresos, margenReal, cantidadVentas }) {
  const doc = nuevoDocumento('Ventas por Fecha')

  doc.setFontSize(11)
  doc.setTextColor(90)
  doc.text(`Período: ${formatFechaDDMMAAAA(desde)} — ${formatFechaDDMMAAAA(hasta)}`, 14, 34)
  doc.setTextColor(0)

  autoTable(doc, {
    startY: 40,
    head: [['Métrica', 'Valor']],
    body: [
      ['Cantidad de ventas', String(cantidadVentas)],
      ['Total de ingresos', `$${Number(totalIngresos).toLocaleString('es-AR')}`],
      ['Margen de ganancia real', `$${Number(margenReal).toLocaleString('es-AR')}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: COLOR_BAMBU },
  })

  const finalY = doc.lastAutoTable.finalY + 12
  doc.setFontSize(12)
  doc.text('Detalle de ventas del período', 14, finalY)

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Fecha', 'Producto', 'Cliente', 'Costo', 'Precio venta', 'Margen', 'Medio de pago', 'Estado']],
    body: ventas.map((v) => {
      const costo = Number(v.inventario?.precio_compra) || 0
      const precioVenta = Number(v.precio_venta) || 0
      return [
        formatFechaDDMMAAAA(v.fecha),
        `${v.inventario?.codigo ?? ''} (${v.inventario?.marcas?.nombre ?? ''})`,
        v.clientes?.nombre ?? '',
        `$${costo.toLocaleString('es-AR')}`,
        `$${precioVenta.toLocaleString('es-AR')}`,
        `$${(precioVenta - costo).toLocaleString('es-AR')}`,
        v.medio_pago,
        v.pagada ? 'Pagada' : 'Pendiente',
      ]
    }),
    theme: 'striped',
    headStyles: { fillColor: COLOR_BAMBU },
    styles: { fontSize: 8 },
  })

  descargar(doc, 'ventas-por-fecha')
}
