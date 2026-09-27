import { useState } from 'react'
import { supabase } from '../supabaseClient'

/**
 * Modal de alta / edición de marca.
 * - Modo alta (comportamiento original, sin cambios): <MarcaModal onClose={} onCreated={} />
 * - Modo edición (nuevo, usado desde la sección Marcas): <MarcaModal marca={marcaExistente} onClose={} onCreated={} />
 *   En modo edición, `onCreated` recibe igual la marca resultante (ya actualizada).
 */
export default function MarcaModal({ marca = null, onClose, onCreated }) {
  const esEdicion = Boolean(marca)
  const [nombre, setNombre] = useState(marca?.nombre || '')
  const [codigoPrefijo, setCodigoPrefijo] = useState(marca?.codigo_prefijo || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      nombre: nombre.trim(),
      codigo_prefijo: codigoPrefijo.trim().toUpperCase(),
    }

    const query = esEdicion
      ? supabase.from('marcas').update(payload).eq('id', marca.id).select().single()
      : supabase.from('marcas').insert(payload).select().single()

    const { data, error } = await query
    setSaving(false)
    if (error) {
      setError(
        error.code === '23505'
          ? 'Ya existe una marca con ese nombre.'
          : error.message
      )
      return
    }
    onCreated(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 dark:bg-black/60 px-4">
      <div className="card w-full max-w-sm p-5">
        <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
          {esEdicion ? 'Editar marca' : 'Nueva marca'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label-field">Nombre</label>
            <input required autoFocus className="input-field" value={nombre}
              onChange={(e) => setNombre(e.target.value)} placeholder="Kaury" />
          </div>
          <div>
            <label className="label-field">Código / prefijo</label>
            <input required className="input-field" value={codigoPrefijo}
              onChange={(e) => setCodigoPrefijo(e.target.value)} placeholder="KAU" maxLength={10} />
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
              Se va a sugerir como "{(codigoPrefijo || 'KAU').toUpperCase()}-" al cargar productos de esta marca.
            </p>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
