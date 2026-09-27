import { useState } from 'react'
import { supabase } from '../supabaseClient'
import MarcaCombobox from './MarcaCombobox.jsx'
import MarcaModal from './MarcaModal.jsx'

export default function ProductoEditModal({ producto, marcas, onClose, onSaved, onMarcaCreated }) {
  const [form, setForm] = useState({
    codigo: producto.codigo || '',
    precio_compra: producto.precio_compra ?? '',
    talle: producto.talle || '',
    color: producto.color || '',
    marca_id: producto.marca_id || '',
    en_stock: producto.en_stock,
  })
  const [showMarcaModal, setShowMarcaModal] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function handleMarcaSelect(marca) {
    setForm((f) => ({ ...f, marca_id: marca?.id || '' }))
  }

  function handleMarcaCreada(nuevaMarca) {
    onMarcaCreated(nuevaMarca)
    setForm((f) => ({
      ...f,
      marca_id: nuevaMarca.id,
      codigo: f.codigo || `${nuevaMarca.codigo_prefijo}-`,
    }))
    setShowMarcaModal(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error } = await supabase
      .from('inventario')
      .update({
        codigo: form.codigo.trim(),
        precio_compra: parseFloat(form.precio_compra) || 0,
        talle: form.talle.trim(),
        color: form.color.trim(),
        marca_id: form.marca_id || null,
        en_stock: form.en_stock,
      })
      .eq('id', producto.id)
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 dark:bg-black/60 px-4">
      <div className="card w-full max-w-lg p-5">
        <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">Editar producto</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Marca</label>
              <MarcaCombobox
                marcas={marcas}
                value={form.marca_id}
                onSelect={handleMarcaSelect}
                onRequestNew={() => setShowMarcaModal(true)}
              />
            </div>
            <div>
              <label className="label-field">Código (SKU)</label>
              <input required className="input-field" value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Precio compra</label>
              <input required type="number" step="0.01" min="0" className="input-field" value={form.precio_compra}
                onChange={(e) => setForm({ ...form, precio_compra: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Talle</label>
              <input className="input-field" value={form.talle}
                onChange={(e) => setForm({ ...form, talle: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Color</label>
              <input className="input-field" value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </div>
            <div className="flex flex-col justify-end">
              <label className="label-field">Estado</label>
              <label className="input-field flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.en_stock}
                  onChange={(e) => setForm({ ...form, en_stock: e.target.checked })} />
                {form.en_stock ? 'Disponible' : 'Sin Stock'}
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>

      {showMarcaModal && (
        <MarcaModal onClose={() => setShowMarcaModal(false)} onCreated={handleMarcaCreada} />
      )}
    </div>
  )
}
