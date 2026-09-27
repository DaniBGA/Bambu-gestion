import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import {
  generarReportePDF,
  generarReporteStock,
  generarReporteClientes,
  generarReporteVentasPorFecha,
} from '../utils/pdfReport'
import { formatFechaDDMMAAAA } from '../utils/dateFormat.js'
import { calcularRango, fechaEnRango } from '../utils/dateRange.js'
import DateRangeFilter from './DateRangeFilter.jsx'

export default function Dashboard() {
  const [ventas, setVentas] = useState([])
  const [inventario, setInventario] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [rangoTipo, setRangoTipo] = useState('mes')
  const [rangoPersonalizado, setRangoPersonalizado] = useState({ desde: '', hasta: '' })

  useEffect(() => {
    async function fetchDatos() {
      setLoading(true)
      setError('')
      const [{ data: v, error: eV }, { data: inv, error: eInv }, { data: c, error: eC }] = await Promise.all([
        supabase
          .from('ventas')
          .select('*, inventario(codigo, precio_compra, marcas(nombre)), clientes(nombre)')
          .order('fecha', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase.from('inventario').select('*, marcas(nombre, codigo_prefijo)').order('codigo'),
        supabase.from('clientes').select('*').order('nombre'),
      ])
      if (eV) setError(eV.message)
      else setVentas(v)
      if (eInv) setError(eInv.message)
      else setInventario(inv)
      if (eC) setError(eC.message)
      else setClientes(c)
      setLoading(false)
    }
    fetchDatos()
  }, [])

  const rango = useMemo(
    () => calcularRango(rangoTipo, rangoPersonalizado),
    [rangoTipo, rangoPersonalizado]
  )

  const ventasFiltradas = useMemo(
    () => ventas.filter((v) => fechaEnRango(v.fecha, rango.desde, rango.hasta)),
    [ventas, rango]
  )

  const metrics = useMemo(() => {
    if (ventasFiltradas.length === 0) {
      return { topMarca: null, medioMasUsado: null, totalIngresos: 0, margenReal: 0 }
    }
    const marcaCount = {}
    const medioCount = {}
    let totalIngresos = 0
    let margenReal = 0

    for (const v of ventasFiltradas) {
      const marca = v.inventario?.marcas?.nombre || 'Sin marca'
      marcaCount[marca] = (marcaCount[marca] || 0) + 1
      medioCount[v.medio_pago] = (medioCount[v.medio_pago] || 0) + 1
      const precioVenta = Number(v.precio_venta) || 0
      const costo = Number(v.inventario?.precio_compra) || 0
      totalIngresos += precioVenta
      margenReal += precioVenta - costo
    }

    const topMarca = Object.entries(marcaCount).sort((a, b) => b[1] - a[1])[0]?.[0]
    const medioMasUsado = Object.entries(medioCount).sort((a, b) => b[1] - a[1])[0]?.[0]

    return { topMarca, medioMasUsado, totalIngresos, margenReal }
  }, [ventasFiltradas])

  const ultimasVentas = ventasFiltradas.slice(0, 10)

  function handleDescargarGeneral() {
    generarReportePDF({ ...metrics, ultimasVentas })
  }

  function handleDescargarStock() {
    generarReporteStock(inventario)
  }

  function handleDescargarClientes() {
    generarReporteClientes(clientes, ventas)
  }

  function handleDescargarVentasPorFecha() {
    generarReporteVentasPorFecha({
      ventas: ventasFiltradas,
      desde: rango.desde,
      hasta: rango.hasta,
      totalIngresos: metrics.totalIngresos,
      margenReal: metrics.margenReal,
      cantidadVentas: ventasFiltradas.length,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-stone-900 dark:text-stone-100">Datos y Estadísticas</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">Métricas del negocio, filtrables por período.</p>
      </div>

      <DateRangeFilter
        tipo={rangoTipo}
        onTipoChange={setRangoTipo}
        personalizado={rangoPersonalizado}
        onPersonalizadoChange={setRangoPersonalizado}
      />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Ventas en el período" value={loading ? '…' : String(ventasFiltradas.length)} />
        <MetricCard label="Marca más vendida" value={loading ? '…' : (metrics.topMarca || 'Sin datos')} />
        <MetricCard label="Medio de pago más usado" value={loading ? '…' : (metrics.medioMasUsado || 'Sin datos')} />
        <MetricCard
          label="Total de ingresos"
          value={loading ? '…' : `$${Number(metrics.totalIngresos).toLocaleString('es-AR')}`}
        />
      </div>

      <div className="card p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-2">
          Margen de ganancia real del período ({formatFechaDDMMAAAA(rango.desde)} — {formatFechaDDMMAAAA(rango.hasta)})
        </p>
        <p className="font-display text-3xl font-semibold text-bambu-700 dark:text-bambu-400">
          {loading ? '…' : `$${Number(metrics.margenReal).toLocaleString('es-AR')}`}
        </p>
        <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Suma de (precio de venta − precio de compra) de cada venta del período.</p>
      </div>

      {/* Exportaciones */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">Descargar reportes en PDF</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleDescargarGeneral} disabled={loading} className="btn-secondary">
            Reporte general (período)
          </button>
          <button onClick={handleDescargarStock} disabled={loading || inventario.length === 0} className="btn-secondary">
            Stock actual
          </button>
          <button onClick={handleDescargarClientes} disabled={loading || clientes.length === 0} className="btn-secondary">
            Clientes con historial
          </button>
          <button onClick={handleDescargarVentasPorFecha} disabled={loading || ventasFiltradas.length === 0} className="btn-primary">
            Ventas por fecha (período)
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Ventas del período ({ultimasVentas.length} de {ventasFiltradas.length})
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 dark:border-stone-800 text-left text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Medio de pago</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-4 py-6 text-center text-stone-400">Cargando…</td></tr>}
            {!loading && ultimasVentas.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-stone-400">No hay ventas en el período seleccionado.</td></tr>
            )}
            {!loading && ultimasVentas.map((v) => (
              <tr key={v.id} className="border-b border-stone-100 dark:border-stone-800 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-800/50">
                <td className="px-4 py-3 text-stone-700 dark:text-stone-300">{formatFechaDDMMAAAA(v.fecha)}</td>
                <td className="px-4 py-3 text-stone-700 dark:text-stone-300">{v.inventario?.codigo} <span className="text-stone-400 dark:text-stone-500">({v.inventario?.marcas?.nombre})</span></td>
                <td className="px-4 py-3 text-stone-700 dark:text-stone-300">{v.clientes?.nombre}</td>
                <td className="px-4 py-3 text-stone-700 dark:text-stone-300">${Number(v.precio_venta).toLocaleString('es-AR')}</td>
                <td className="px-4 py-3 text-stone-700 dark:text-stone-300">{v.medio_pago}</td>
                <td className="px-4 py-3">
                  {v.pagada ? <span className="badge-green">Pagada</span> : <span className="badge-red">Pendiente</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-2">{label}</p>
      <p className="font-display text-2xl font-semibold text-stone-900 dark:text-stone-100 truncate">{value}</p>
    </div>
  )
}
