import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { formatFechaDDMMAAAA } from '../utils/dateFormat.js'
import ClienteEditModal from './ClienteEditModal.jsx'
import ConfirmModal from './ConfirmModal.jsx'

const emptyForm = { nombre: '', telefono: '', talle: '' }

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const [selectedId, setSelectedId] = useState(null)
  const [historial, setHistorial] = useState([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)

  const [editando, setEditando] = useState(null)
  const [eliminando, setEliminando] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchClientes() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.from('clientes').select('*').order('nombre')
    if (error) setError(error.message)
    else setClientes(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchClientes()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error } = await supabase.from('clientes').insert({
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim(),
      talle: form.talle.trim(),
    })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setForm(emptyForm)
    fetchClientes()
  }

  async function handleSelect(cliente) {
    setSelectedId(cliente.id)
    setLoadingHistorial(true)
    const { data, error } = await supabase
      .from('ventas')
      .select('*, inventario(codigo, marcas(nombre))')
      .eq('cliente_id', cliente.id)
      .order('fecha', { ascending: false })
    if (!error) setHistorial(data)
    setLoadingHistorial(false)
  }

  function handleClienteEditado(clienteActualizado) {
    setClientes((prev) =>
      prev.map((c) => (c.id === clienteActualizado.id ? clienteActualizado : c))
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
    )
    setEditando(null)
  }

  async function handleConfirmDelete() {
    if (!eliminando) return
    setDeleting(true)
    const { error } = await supabase.from('clientes').delete().eq('id', eliminando.id)
    setDeleting(false)
    if (error) {
      setError(error.message)
      setEliminando(null)
      return
    }
    setClientes((prev) => prev.filter((c) => c.id !== eliminando.id))
    if (selectedId === eliminando.id) {
      setSelectedId(null)
      setHistorial([])
    }
    setEliminando(null)
  }

  const clienteSeleccionado = clientes.find((c) => c.id === selectedId)
  const enMora = historial.some((v) => !v.pagada)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-stone-900 dark:text-stone-100">Clientes</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">Administrá tu cartera de clientes.</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-5">
        <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">Cargar cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label-field">Nombre completo</label>
            <input required className="input-field" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Teléfono</label>
            <input required className="input-field" value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Talle que utiliza</label>
            <input className="input-field" value={form.talle}
              onChange={(e) => setForm({ ...form, talle: e.target.value })} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400 mt-3">{error}</p>}
        <div className="mt-4">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Guardando…' : 'Agregar cliente'}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Lista de clientes */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
            <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">Listado</h2>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-[480px] overflow-y-auto">
            {loading && <p className="px-4 py-6 text-center text-stone-400 text-sm">Cargando…</p>}
            {!loading && clientes.length === 0 && (
              <p className="px-4 py-6 text-center text-stone-400 text-sm">No hay clientes cargados.</p>
            )}
            {!loading && clientes.map((c) => (
              <div
                key={c.id}
                className={`w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition ${selectedId === c.id ? 'bg-bambu-50 dark:bg-bambu-900/20' : ''}`}
              >
                <button onClick={() => handleSelect(c)} className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">{c.nombre}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{c.telefono} {c.talle && `· Talle ${c.talle}`}</p>
                </button>
                <div className="flex gap-1.5 shrink-0">
                  <button className="btn-edit" onClick={() => setEditando(c)}>Editar</button>
                  <button className="btn-danger" onClick={() => setEliminando(c)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de detalle */}
        <div className="lg:col-span-3 card p-5">
          {!clienteSeleccionado && (
            <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-12">Seleccioná un cliente para ver su detalle.</p>
          )}
          {clienteSeleccionado && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">{clienteSeleccionado.nombre}</h2>
                  <p className="text-sm text-stone-500 dark:text-stone-400">{clienteSeleccionado.telefono}</p>
                </div>
                {loadingHistorial ? (
                  <span className="text-xs text-stone-400 dark:text-stone-500">Calculando…</span>
                ) : (
                  enMora
                    ? <span className="badge-red">En mora</span>
                    : <span className="badge-green">Al día</span>
                )}
              </div>

              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-2">Historial de compras</h3>
                {loadingHistorial && <p className="text-sm text-stone-400 dark:text-stone-500">Cargando historial…</p>}
                {!loadingHistorial && historial.length === 0 && (
                  <p className="text-sm text-stone-400 dark:text-stone-500">Este cliente todavía no registra compras.</p>
                )}
                {!loadingHistorial && historial.length > 0 && (
                  <div className="border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-stone-50 dark:bg-stone-800/50 text-left text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
                          <th className="px-3 py-2">Fecha</th>
                          <th className="px-3 py-2">Producto</th>
                          <th className="px-3 py-2">Precio</th>
                          <th className="px-3 py-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historial.map((v) => (
                          <tr key={v.id} className="border-t border-stone-100 dark:border-stone-800">
                            <td className="px-3 py-2 text-stone-700 dark:text-stone-300">{formatFechaDDMMAAAA(v.fecha)}</td>
                            <td className="px-3 py-2 text-stone-700 dark:text-stone-300">{v.inventario?.codigo} ({v.inventario?.marcas?.nombre})</td>
                            <td className="px-3 py-2 text-stone-700 dark:text-stone-300">${Number(v.precio_venta).toLocaleString('es-AR')}</td>
                            <td className="px-3 py-2">
                              {v.pagada ? <span className="badge-green">Pagada</span> : <span className="badge-red">Pendiente</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {editando && (
        <ClienteEditModal cliente={editando} onClose={() => setEditando(null)} onSaved={handleClienteEditado} />
      )}

      {eliminando && (
        <ConfirmModal
          title="Eliminar cliente"
          message={`¿Seguro que querés eliminar a "${eliminando.nombre}"? Si tiene ventas registradas, la eliminación puede fallar para no perder ese historial.`}
          onCancel={() => setEliminando(null)}
          onConfirm={handleConfirmDelete}
          loading={deleting}
        />
      )}
    </div>
  )
}
