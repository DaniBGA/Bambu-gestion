import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import MarcaCombobox from './MarcaCombobox.jsx'
import MarcaModal from './MarcaModal.jsx'
import ProductoEditModal from './ProductoEditModal.jsx'
import ConfirmModal from './ConfirmModal.jsx'

const emptyForm = {
  codigo: '',
  precio_compra: '',
  talle: '',
  color: '',
  marca_id: '',
  en_stock: true,
}

export default function Inventario() {
  const [items, setItems] = useState([])
  const [marcas, setMarcas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [showMarcaModal, setShowMarcaModal] = useState(false)

  const [editando, setEditando] = useState(null)
  const [eliminando, setEliminando] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [search, setSearch] = useState('')
  const [filterTalle, setFilterTalle] = useState('')
  const [filterColor, setFilterColor] = useState('')
  const [filterMarcaId, setFilterMarcaId] = useState('')
  const [sortPrice, setSortPrice] = useState('') // '', 'asc', 'desc'

  async function fetchItems() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('inventario')
      .select('*, marcas(id, nombre, codigo_prefijo)')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setItems(data)
    setLoading(false)
  }

  async function fetchMarcas() {
    const { data, error } = await supabase.from('marcas').select('*').order('nombre')
    if (!error) setMarcas(data)
  }

  useEffect(() => {
    fetchItems()
    fetchMarcas()
  }, [])

  function handleMarcaSelect(marca) {
    setForm((f) => {
      const nuevoForm = { ...f, marca_id: marca?.id || '' }
      // Autocompletar el código con el prefijo sugerido, solo si el
      // usuario todavía no escribió nada.
      if (marca && !f.codigo) {
        nuevoForm.codigo = `${marca.codigo_prefijo}-`
      }
      return nuevoForm
    })
  }

  function handleMarcaCreada(nuevaMarca) {
    setMarcas((prev) => [...prev, nuevaMarca].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    handleMarcaSelect(nuevaMarca)
    setShowMarcaModal(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      codigo: form.codigo.trim(),
      precio_compra: parseFloat(form.precio_compra) || 0,
      talle: form.talle.trim(),
      color: form.color.trim(),
      marca_id: form.marca_id || null,
      en_stock: form.en_stock,
    }
    const { error } = await supabase.from('inventario').insert(payload)
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setForm(emptyForm)
    fetchItems()
  }

  async function handleConfirmDelete() {
    if (!eliminando) return
    setDeleting(true)
    const { error } = await supabase.from('inventario').delete().eq('id', eliminando.id)
    setDeleting(false)
    if (error) {
      setError(error.message)
      setEliminando(null)
      return
    }
    setEliminando(null)
    fetchItems()
  }

  const talles = useMemo(() => [...new Set(items.map((i) => i.talle).filter(Boolean))].sort(), [items])
  const colores = useMemo(() => [...new Set(items.map((i) => i.color).filter(Boolean))].sort(), [items])

  const filtered = useMemo(() => {
    let result = items.filter((i) => {
      const matchesSearch =
        !search ||
        i.codigo?.toLowerCase().includes(search.toLowerCase()) ||
        i.marcas?.nombre?.toLowerCase().includes(search.toLowerCase())
      const matchesTalle = !filterTalle || i.talle === filterTalle
      const matchesColor = !filterColor || i.color === filterColor
      const matchesMarca = !filterMarcaId || i.marca_id === filterMarcaId
      return matchesSearch && matchesTalle && matchesColor && matchesMarca
    })
    if (sortPrice === 'asc') result = [...result].sort((a, b) => a.precio_compra - b.precio_compra)
    if (sortPrice === 'desc') result = [...result].sort((a, b) => b.precio_compra - a.precio_compra)
    return result
  }, [items, search, filterTalle, filterColor, filterMarcaId, sortPrice])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-stone-900 dark:text-stone-100">Inventario</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">Gestioná el stock de productos y las marcas.</p>
      </div>

      {/* Formulario de carga */}
      <form onSubmit={handleSubmit} className="card p-5">
        <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">Cargar producto</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="col-span-2 md:col-span-1">
            <label className="label-field">Marca</label>
            <MarcaCombobox
              marcas={marcas}
              value={form.marca_id}
              onSelect={handleMarcaSelect}
              onRequestNew={() => setShowMarcaModal(true)}
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="label-field">Código (SKU)</label>
            <input required className="input-field" value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="KAU-001" />
          </div>
          <div>
            <label className="label-field">Precio compra</label>
            <input required type="number" step="0.01" min="0" className="input-field" value={form.precio_compra}
              onChange={(e) => setForm({ ...form, precio_compra: e.target.value })} placeholder="0.00" />
          </div>
          <div>
            <label className="label-field">Talle</label>
            <input className="input-field" value={form.talle}
              onChange={(e) => setForm({ ...form, talle: e.target.value })} placeholder="M" />
          </div>
          <div>
            <label className="label-field">Color</label>
            <input className="input-field" value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Negro" />
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
        {error && <p className="text-sm text-red-600 dark:text-red-400 mt-3">{error}</p>}
        <div className="mt-4">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Guardando…' : 'Agregar al inventario'}
          </button>
        </div>
      </form>

      {/* Filtros */}
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="label-field">Buscar (código o marca)</label>
          <input className="input-field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…" />
        </div>
        <div className="min-w-[140px]">
          <label className="label-field">Talle</label>
          <select className="input-field" value={filterTalle} onChange={(e) => setFilterTalle(e.target.value)}>
            <option value="">Todos</option>
            {talles.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="label-field">Color</label>
          <select className="input-field" value={filterColor} onChange={(e) => setFilterColor(e.target.value)}>
            <option value="">Todos</option>
            {colores.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="label-field">Marca</label>
          <select className="input-field" value={filterMarcaId} onChange={(e) => setFilterMarcaId(e.target.value)}>
            <option value="">Todas</option>
            {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="label-field">Ordenar por precio</label>
          <select className="input-field" value={sortPrice} onChange={(e) => setSortPrice(e.target.value)}>
            <option value="">Sin orden</option>
            <option value="asc">Menor a mayor</option>
            <option value="desc">Mayor a menor</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 dark:border-stone-800 text-left text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">Talle</th>
              <th className="px-4 py-3">Color</th>
              <th className="px-4 py-3">Precio compra</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-stone-400">Cargando…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-stone-400">No hay productos que coincidan.</td></tr>
            )}
            {!loading && filtered.map((item) => (
              <tr key={item.id} className="border-b border-stone-100 dark:border-stone-800 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-800/50">
                <td className="px-4 py-3 font-medium text-stone-900 dark:text-stone-100">{item.codigo}</td>
                <td className="px-4 py-3 text-stone-700 dark:text-stone-300">{item.marcas?.nombre || '—'}</td>
                <td className="px-4 py-3 text-stone-700 dark:text-stone-300">{item.talle}</td>
                <td className="px-4 py-3 text-stone-700 dark:text-stone-300">{item.color}</td>
                <td className="px-4 py-3 text-stone-700 dark:text-stone-300">${Number(item.precio_compra).toLocaleString('es-AR')}</td>
                <td className="px-4 py-3">
                  {item.en_stock
                    ? <span className="badge-green">Disponible</span>
                    : <span className="badge-red">Sin Stock</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button className="btn-edit" onClick={() => setEditando(item)}>Editar</button>
                    <button className="btn-danger" onClick={() => setEliminando(item)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showMarcaModal && (
        <MarcaModal onClose={() => setShowMarcaModal(false)} onCreated={handleMarcaCreada} />
      )}

      {editando && (
        <ProductoEditModal
          producto={editando}
          marcas={marcas}
          onClose={() => setEditando(null)}
          onMarcaCreated={(m) => setMarcas((prev) => [...prev, m].sort((a, b) => a.nombre.localeCompare(b.nombre)))}
          onSaved={() => { setEditando(null); fetchItems() }}
        />
      )}

      {eliminando && (
        <ConfirmModal
          title="Eliminar producto"
          message={`¿Seguro que querés eliminar "${eliminando.codigo}" del inventario? Esta acción no se puede deshacer.`}
          onCancel={() => setEliminando(null)}
          onConfirm={handleConfirmDelete}
          loading={deleting}
        />
      )}
    </div>
  )
}
