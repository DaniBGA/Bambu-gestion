// Supabase devuelve fechas en formato ISO (AAAA-MM-DD para `date`,
// o timestamps completos para `timestamptz`). Estas funciones se
// encargan de mostrarlas siempre en formato latinoamericano DD/MM/AAAA.

/**
 * Convierte "2026-07-08" o un timestamp ISO a "08/07/2026".
 * Devuelve "—" si la fecha es inválida o vacía.
 */
export function formatFechaDDMMAAAA(fechaISO) {
  if (!fechaISO) return '—'

  // Si viene solo la parte de fecha (AAAA-MM-DD), la parseamos a mano
  // para evitar corrimientos de zona horaria al usar `new Date()`.
  const soloFecha = String(fechaISO).slice(0, 10)
  const match = soloFecha.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    const [, anio, mes, dia] = match
    return `${dia}/${mes}/${anio}`
  }

  const parsed = new Date(fechaISO)
  if (Number.isNaN(parsed.getTime())) return '—'
  const dia = String(parsed.getDate()).padStart(2, '0')
  const mes = String(parsed.getMonth() + 1).padStart(2, '0')
  const anio = parsed.getFullYear()
  return `${dia}/${mes}/${anio}`
}

/**
 * Convierte una fecha AAAA-MM-DD (como la que devuelve un <input type="date">)
 * a DD/MM/AAAA. Alias semántico de formatFechaDDMMAAAA para inputs.
 */
export const formatInputDate = formatFechaDDMMAAAA

/**
 * Fecha de hoy en formato AAAA-MM-DD, para usar como valor por
 * defecto de <input type="date">, que siempre requiere ese formato.
 */
export function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}
