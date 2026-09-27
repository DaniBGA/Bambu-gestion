import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Selector con buscador para elegir una marca ya cargada.
 * `marcas`: lista de { id, nombre, codigo_prefijo }
 * `value`: id de la marca seleccionada (o '')
 * `onSelect(marca)`: se llama con el objeto marca completo al elegir una opción
 * `onRequestNew(texto)`: se llama cuando el usuario quiere dar de alta una marca nueva
 */
export default function MarcaCombobox({ marcas, value, onSelect, onRequestNew }) {
  const marcaActual = marcas.find((m) => m.id === value)
  const [query, setQuery] = useState(marcaActual?.nombre || '')
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    setQuery(marcaActual?.nombre || '')
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtradas = useMemo(() => {
    if (!query) return marcas
    return marcas.filter((m) => m.nombre.toLowerCase().includes(query.toLowerCase()))
  }, [marcas, query])

  function handlePick(marca) {
    setQuery(marca.nombre)
    setOpen(false)
    onSelect(marca)
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        className="input-field"
        placeholder="Buscar marca…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          if (value) onSelect(null) // se limpia la selección hasta que elija una opción concreta
        }}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg">
          {filtradas.length === 0 && (
            <p className="px-3 py-2 text-sm text-stone-400 dark:text-stone-500">Sin resultados.</p>
          )}
          {filtradas.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handlePick(m)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 flex items-center justify-between"
            >
              <span>{m.nombre}</span>
              <span className="text-xs text-stone-400 dark:text-stone-500">{m.codigo_prefijo}-</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onRequestNew(query)
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium text-bambu-700 dark:text-bambu-400 hover:bg-bambu-50 dark:hover:bg-bambu-900/30 border-t border-stone-100 dark:border-stone-800"
          >
            + Nueva marca{query ? `: "${query}"` : ''}
          </button>
        </div>
      )}
    </div>
  )
}
