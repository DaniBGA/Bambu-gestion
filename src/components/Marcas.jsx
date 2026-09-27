import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import MarcaModal from './MarcaModal.jsx'
import ConfirmModal from './ConfirmModal.jsx'

export default function Marcas() {
  const [marcas, setMarcas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [eliminando, setEliminando] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [conteoProductos, setConteoProductos] = useState({})

  async function fetchMarcas() {
    setLoading(true)
    setError('')
    const [{ data: m, error: eM }, { data: inv, error: eInv }] = await Promise.all([
      supabase.from('marcas').select('*').order('nombre'),
      supabase.from('inventario').select('marca_id'),
    ])
    if (eM) setError(eM.message)
    else setMarcas(m)
    if (!eInv && inv) {
      const conteo = {}
      for (const row of inv) {
        if (!row.marca_id) continue
        conteo[row.marca_id] = (conteo[row.marca_id] || 0) + 1
      }
      setConteoProductos(conteo)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMarcas()
  }, [])

  function handleGuardada(marca) {
    setMarcas((prev) => {
      const existe = prev.some((m) => m.id === marca.id)
      const actualizado = existe
        ? prev.map((m) => (m.id === marca.id ? marca : m))
        : [...prev, marca]
      return actualizado.sort((a, b) => a.nombre.localeCompare(b.nombre))
    })
    setShowModal(false)
    setEditando(null)
  }

  async function handleConfirmDelete() {
    if (!eliminando) return
    setDeleting(true)
    const { error } = await supabase.from('marcas').delete().eq('id', eliminando.id)
    setDeleting(false)
    if (error) {
      setError(error.message)
      setEliminando(null)
      return
    }
    setMarcas((prev) => prev.filter((m) => m.id !== eliminando.id))
    setEliminando(null)
  }

  const cantidadProductos = (marcaId) => conteoProductos[marcaId] || 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-stone-900 dark:text-stone-100">Marcas</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Administrá las marcas y sus prefijos de código. Se usan al cargar productos en Inventario.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Nueva marca
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 dark:border-stone-800 text-left text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Prefijo</th>
              <th className="px-4 py-3">Productos cargados</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-stone-400">Cargando…</td></tr>
            )}
            {!loading && marcas.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-stone-400">Todavía no cargaste ninguna marca.</td></tr>
            )}
            {!loading && marcas.map((m) => (
              <tr key={m.id} className="border-b border-stone-100 dark:border-stone-800 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-800/50">
                <td className="px-4 py-3 font-medium text-stone-900 dark:text-stone-100">{m.nombre}</td>
                <td className="px-4 py-3 text-stone-700 dark:text-stone-300">{m.codigo_prefijo}-</td>
                <td className="px-4 py-3 text-stone-700 dark:text-stone-300">{cantidadProductos(m.id)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button className="btn-edit" onClick={() => setEditando(m)}>Editar</button>
                    <button className="btn-danger" onClick={() => setEliminando(m)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <MarcaModal onClose={() => setShowModal(false)} onCreated={handleGuardada} />
      )}

      {editando && (
        <MarcaModal marca={editando} onClose={() => setEditando(null)} onCreated={handleGuardada} />
      )}

      {eliminando && (
        <ConfirmModal
          title="Eliminar marca"
          message={
            cantidadProductos(eliminando.id) > 0
              ? `"${eliminando.nombre}" tiene ${cantidadProductos(eliminando.id)} producto(s) cargado(s). Si la eliminás, esos productos quedan sin marca asignada, pero no se borran. ¿Confirmás?`
              : `¿Seguro que querés eliminar la marca "${eliminando.nombre}"? Esta acción no se puede deshacer.`
          }
          onCancel={() => setEliminando(null)}
          onConfirm={handleConfirmDelete}
          loading={deleting}
        />
      )}
    </div>
  )
}
