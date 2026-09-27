import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ClienteModal({ onClose, onCreated }) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [talle, setTalle] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { data, error } = await supabase
      .from('clientes')
      .insert({ nombre: nombre.trim(), telefono: telefono.trim(), talle: talle.trim() })
      .select()
      .single()
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    onCreated(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 dark:bg-black/60 px-4">
      <div className="card w-full max-w-sm p-5">
        <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">Nuevo cliente</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label-field">Nombre completo</label>
            <input required className="input-field" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="label-field">Teléfono</label>
            <input required className="input-field" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>
          <div>
            <label className="label-field">Talle que utiliza</label>
            <input className="input-field" value={talle} onChange={(e) => setTalle(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
