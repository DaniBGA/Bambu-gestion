import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import ClienteModal from './ClienteModal.jsx'
import PricingConfigPanel from './PricingConfigPanel.jsx'
import { formatFechaDDMMAAAA, hoyISO } from '../utils/dateFormat.js'
import { loadPricingConfig, savePricingConfig, calcularPrecioSugerido } from '../utils/pricingConfig.js'

const MEDIOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta de Débito', 'Tarjeta de Crédito']

export default function Ventas() {
  const [ventas, setVentas] = useState([])
  const [productosDisponibles, setProductosDisponibles] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showClienteModal, setShowClienteModal] = useState(false)

  const [fecha, setFecha] = useState(hoyISO())
  const [productoId, setProductoId] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [precioEditadoManualmente, setPrecioEditadoManualmente] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [medioPago, setMedioPago] = useState(MEDIOS_PAGO[0])
  const [pagada, setPagada] = useState(true)
  const [observaciones, setObservaciones] = useState('')

  const [pricingConfig, setPricingConfig] = useState(loadPricingConfig)

  async function fetchAll() {
    setLoading(true)
    setError('')
    const [{ data: v, error: eV }, { data: p, error: eP }, { data: c, error: eC }] = await Promise.all([
      supabase
        .from('ventas')
        .select('*, inventario(codigo, talle, color, precio_compra, marcas(nombre)), clientes(nombre, telefono)')
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('inventario').select('*, marcas(nombre, codigo_prefijo)').eq('en_stock', true).order('codigo'),
      supabase.from('clientes').select('*').order('nombre'),
    ])
    if (eV) setError(eV.message)
    else setVentas(v)
    if (eP) setError(eP.message)
    else setProductosDisponibles(p)
    if (eC) setError(eC.message)
    else setClientes(c)
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    savePricingConfig(pricingConfig)
  }, [pricingConfig])

  const productoSeleccionado = useMemo(
    () => productosDisponibles.find((p) => String(p.id) === String(productoId)),
    [productoId, productosDisponibles]
  )

  const calculo = useMemo(() => {
    if (!productoSeleccionado) return null
    return calcularPrecioSugerido({
      costoCompra: productoSeleccionado.precio_compra,
      medioPago,
      config: pricingConfig,
    })
  }, [productoSeleccionado, medioPago, pricingConfig])

  // Recalcula el precio sugerido automáticamente cuando cambia el
  // producto, el medio de pago o la configuración — a menos que el
  // usuario ya haya sobrescrito el precio a mano.
  useEffect(() => {
    if (!calculo) return
    if (precioEditadoManualmente) return
    setPrecioVenta(calculo.precioFinal.toFixed(2))
  }, [calculo, precioEditadoManualmente])

  // Al elegir un producto distinto, arrancamos de nuevo en modo automático.
  useEffect(() => {
    setPrecioEditadoManualmente(false)
  }, [productoId])

  function resetForm() {
    setFecha(hoyISO())
    setProductoId('')
    setPrecioVenta('')
    setPrecioEditadoManualmente(false)
    setClienteId('')
    setMedioPago(MEDIOS_PAGO[0])
    setPagada(true)
    setObservaciones('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!productoId || !clienteId) {
      setError('Seleccioná un producto y un cliente.')
      return
    }
    setSaving(true)
    setError('')

    // 1. Registrar la venta
    const { error: ventaError } = await supabase.from('ventas').insert({
      fecha,
      producto_id: productoId,
      precio_venta: parseFloat(precioVenta) || 0,
      cliente_id: clienteId,
      medio_pago: medioPago,
      pagada,
      observaciones: observaciones.trim(),
    })

    if (ventaError) {
      setSaving(false)
      setError(ventaError.message)
      return
    }

    // 2. Actualizar stock del producto vendido a "Sin Stock"
    const { error: stockError } = await supabase
      .from('inventario')
      .update({ en_stock: false })
      .eq('id', productoId)

    setSaving(false)

    if (stockError) {
      setError(`La venta se registró, pero no se pudo actualizar el stock: ${stockError.message}`)
    }

    resetForm()
    fetchAll()
  }

  function handleClienteCreated(nuevoCliente) {
    setClientes((prev) => [...prev, nuevoCliente].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setClienteId(nuevoCliente.id)
    setShowClienteModal(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-stone-900 dark:text-stone-100">Ventas</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">Registrá una nueva venta: el precio se calcula solo, y siempre lo podés ajustar a mano.</p>
      </div>

      <PricingConfigPanel config={pricingConfig} onChange={setPricingConfig} />

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label-field">Fecha de venta</label>
            <input type="date" required className="input-field" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Se muestra como {formatFechaDDMMAAAA(fecha)}</p>
          </div>

          <div>
            <label className="label-field">Producto vendido</label>
            <select required className="input-field" value={productoId} onChange={(e) => setProductoId(e.target.value)}>
              <option value="">Seleccionar producto…</option>
              {productosDisponibles.map((p) => (
                <option key={p.id} value={p.id}>{p.codigo} — {p.marcas?.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-field flex items-center justify-between">
              <span>Precio de venta</span>
              {precioEditadoManualmente && (
                <button type="button" onClick={() => setPrecioEditadoManualmente(false)}
                  className="normal-case text-bambu-700 dark:text-bambu-400 font-medium">
                  Recalcular automático
                </button>
              )}
            </label>
            <input type="number" step="0.01" min="0" required className="input-field"
              value={precioVenta}
              onChange={(e) => { setPrecioVenta(e.target.value); setPrecioEditadoManualmente(true) }} placeholder="0.00" />
          </div>
        </div>

        {productoSeleccionado && (
          <div className="rounded-lg bg-bambu-50 dark:bg-bambu-900/20 border border-bambu-100 dark:border-bambu-900 px-4 py-3 text-sm text-bambu-900 dark:text-bambu-200 space-y-2">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span><strong>Talle:</strong> {productoSeleccionado.talle || '—'}</span>
              <span><strong>Color:</strong> {productoSeleccionado.color || '—'}</span>
              <span><strong>Marca:</strong> {productoSeleccionado.marcas?.nombre || '—'}</span>
              <span><strong>Costo:</strong> ${Number(productoSeleccionado.precio_compra).toLocaleString('es-AR')}</span>
            </div>
            {calculo && (
              <div className="pt-2 border-t border-bambu-100 dark:border-bambu-900 text-xs space-y-0.5 text-bambu-800 dark:text-bambu-300">
                <p>Costo + fijo + otros conceptos = <strong>${calculo.subtotal.toFixed(2)}</strong></p>
                <p>Con margen del {calculo.margen}% = <strong>${calculo.precioConMargen.toFixed(2)}</strong></p>
                {calculo.tipoAjuste === 'recargo' && (
                  <p>Recargo por {medioPago} ({calculo.ajustePorcentaje}%) → <strong>${calculo.precioFinal.toFixed(2)}</strong></p>
                )}
                {calculo.tipoAjuste === 'descuento' && (
                  <p>Descuento por {medioPago} ({calculo.ajustePorcentaje}%) → <strong>${calculo.precioFinal.toFixed(2)}</strong></p>
                )}
                {precioEditadoManualmente && (
                  <p className="text-amber-700 dark:text-amber-400">Precio sobrescrito manualmente — no se está recalculando.</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="label-field">Cliente</label>
            <div className="flex gap-2">
              <select required className="input-field" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Seleccionar cliente…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} — {c.telefono}</option>
                ))}
              </select>
              <button type="button" onClick={() => setShowClienteModal(true)} className="btn-secondary shrink-0">
                + Nuevo
              </button>
            </div>
          </div>

          <div>
            <label className="label-field">Medio de pago</label>
            <select className="input-field" value={medioPago} onChange={(e) => setMedioPago(e.target.value)}>
              {MEDIOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="label-field">Estado de pago</label>
            <label className="input-field flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={pagada} onChange={(e) => setPagada(e.target.checked)} />
              {pagada ? 'Pagada' : 'Pendiente / No pagó'}
            </label>
          </div>
        </div>

        <div>
          <label className="label-field">Observaciones</label>
          <textarea className="input-field" rows={2} value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)} placeholder="Comentarios adicionales…" />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Registrando venta…' : 'Confirmar venta'}
        </button>
      </form>

      <div className="card overflow-x-auto">
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
            {!loading && ventas.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-stone-400">Todavía no hay ventas registradas.</td></tr>
            )}
            {!loading && ventas.map((v) => (
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

      {showClienteModal && (
        <ClienteModal onClose={() => setShowClienteModal(false)} onCreated={handleClienteCreated} />
      )}
    </div>
  )
}
