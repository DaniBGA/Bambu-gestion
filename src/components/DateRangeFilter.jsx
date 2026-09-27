import { RANGO_OPCIONES } from '../utils/dateRange.js'

export default function DateRangeFilter({ tipo, onTipoChange, personalizado, onPersonalizadoChange }) {
  return (
    <div className="card p-4 flex flex-wrap gap-3 items-end">
      <div className="flex flex-wrap gap-2">
        {RANGO_OPCIONES.map((opcion) => (
          <button
            key={opcion.id}
            type="button"
            onClick={() => onTipoChange(opcion.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              tipo === opcion.id
                ? 'bg-bambu-700 dark:bg-bambu-600 text-white'
                : 'bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            {opcion.label}
          </button>
        ))}
      </div>

      {tipo === 'personalizado' && (
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label-field">Desde</label>
            <input type="date" className="input-field" value={personalizado.desde || ''}
              onChange={(e) => onPersonalizadoChange({ ...personalizado, desde: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Hasta</label>
            <input type="date" className="input-field" value={personalizado.hasta || ''}
              onChange={(e) => onPersonalizadoChange({ ...personalizado, hasta: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  )
}
