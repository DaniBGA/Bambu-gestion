// Configuración y lógica del cálculo automático de precio de venta.
// Todo esto vive en el frontend (localStorage del navegador): no
// requiere ninguna tabla ni columna nueva en Supabase.

const STORAGE_KEY = 'bambu-gestion-pricing-config'

export const DEFAULT_PRICING_CONFIG = {
  margenPorcentaje: 50,       // % de ganancia sobre el costo
  costoFijo: 0,                // monto fijo sumado al costo (ej: bolsa, etiqueta)
  otrosConceptos: 0,           // otros recargos fijos
  descuentoEfectivoPorcentaje: 0,  // descuento para Efectivo / Transferencia
  recargoTarjetaPorcentaje: 15,    // recargo para Tarjeta de Débito / Crédito
}

export function loadPricingConfig() {
  if (typeof window === 'undefined') return DEFAULT_PRICING_CONFIG
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_PRICING_CONFIG
    return { ...DEFAULT_PRICING_CONFIG, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_PRICING_CONFIG
  }
}

export function savePricingConfig(config) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

const MEDIOS_CON_RECARGO = ['Tarjeta de Débito', 'Tarjeta de Crédito']
const MEDIOS_CON_DESCUENTO = ['Efectivo', 'Transferencia']

/**
 * Calcula el precio de venta sugerido a partir del costo de compra,
 * la configuración de márgenes/recargos, y el medio de pago elegido.
 * Devuelve además el detalle del cálculo para mostrarlo en pantalla.
 */
export function calcularPrecioSugerido({ costoCompra, medioPago, config }) {
  const costo = Number(costoCompra) || 0
  const costoFijo = Number(config.costoFijo) || 0
  const otrosConceptos = Number(config.otrosConceptos) || 0
  const margen = Number(config.margenPorcentaje) || 0

  const subtotal = costo + costoFijo + otrosConceptos
  const precioConMargen = subtotal * (1 + margen / 100)

  let ajustePorcentaje = 0
  let tipoAjuste = 'ninguno'

  if (MEDIOS_CON_RECARGO.includes(medioPago)) {
    ajustePorcentaje = Number(config.recargoTarjetaPorcentaje) || 0
    tipoAjuste = 'recargo'
  } else if (MEDIOS_CON_DESCUENTO.includes(medioPago)) {
    ajustePorcentaje = Number(config.descuentoEfectivoPorcentaje) || 0
    tipoAjuste = 'descuento'
  }

  const precioFinal =
    tipoAjuste === 'recargo'
      ? precioConMargen * (1 + ajustePorcentaje / 100)
      : tipoAjuste === 'descuento'
      ? precioConMargen * (1 - ajustePorcentaje / 100)
      : precioConMargen

  return {
    costo,
    costoFijo,
    otrosConceptos,
    subtotal,
    margen,
    precioConMargen,
    tipoAjuste,
    ajustePorcentaje,
    precioFinal: Math.max(0, precioFinal),
  }
}
