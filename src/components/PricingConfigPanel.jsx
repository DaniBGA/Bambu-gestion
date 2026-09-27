import { useState } from 'react'

function SliderInput({ label, value, onChange, min = 0, max = 200, step = 1, suffix = '%' }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="label-field mb-0">{label}</label>
        <span className="text-xs font-medium text-stone-600 dark:text-stone-300">{value}{suffix}</span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 accent-bambu-700 dark:accent-bambu-500"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="input-field w-20 text-right"
        />
      </div>
    </div>
  )
}

export default function PricingConfigPanel({ config, onChange }) {
  const [open, setOpen] = useState(false)

  function set(field, value) {
    onChange({ ...config, [field]: value })
  }

  return (
    <div className="border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 dark:bg-stone-800/50 text-sm font-medium text-stone-700 dark:text-stone-200"
      >
        <span>⚙️ Configuración de precios (margen, recargos y descuentos)</span>
        <span className="text-stone-400 dark:text-stone-500">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="p-4 space-y-4">
          <SliderInput
            label="Margen de ganancia"
            value={config.margenPorcentaje}
            onChange={(v) => set('margenPorcentaje', v)}
            min={0}
            max={300}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Costo fijo por producto ($)</label>
              <input type="number" min={0} step="0.01" className="input-field"
                value={config.costoFijo}
                onChange={(e) => set('costoFijo', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="label-field">Otros conceptos / recargos ($)</label>
              <input type="number" min={0} step="0.01" className="input-field"
                value={config.otrosConceptos}
                onChange={(e) => set('otrosConceptos', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <SliderInput
            label="Descuento en Efectivo / Transferencia"
            value={config.descuentoEfectivoPorcentaje}
            onChange={(v) => set('descuentoEfectivoPorcentaje', v)}
            min={0}
            max={50}
          />
          <SliderInput
            label="Recargo en Tarjeta de Débito / Crédito"
            value={config.recargoTarjetaPorcentaje}
            onChange={(v) => set('recargoTarjetaPorcentaje', v)}
            min={0}
            max={100}
          />
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Esta configuración se guarda en este navegador y se aplica automáticamente a cada nueva venta.
          </p>
        </div>
      )}
    </div>
  )
}
