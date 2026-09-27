// Utilidades para calcular y aplicar rangos de fecha en el Dashboard.
// Trabaja siempre con fechas en formato AAAA-MM-DD (las mismas que
// devuelve la columna `fecha` de Supabase), así se pueden comparar
// como strings sin problemas de zona horaria.

function toISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const RANGO_OPCIONES = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'mes', label: 'Este mes' },
  { id: 'personalizado', label: 'Rango personalizado' },
]

/**
 * Devuelve { desde, hasta } en formato AAAA-MM-DD para el tipo de
 * rango elegido. Para 'personalizado' devuelve los valores dados.
 */
export function calcularRango(tipo, personalizado = {}) {
  const hoy = new Date()

  if (tipo === 'hoy') {
    const iso = toISO(hoy)
    return { desde: iso, hasta: iso }
  }

  if (tipo === 'semana') {
    const diaSemana = hoy.getDay() // 0 = domingo
    const offsetLunes = diaSemana === 0 ? 6 : diaSemana - 1
    const lunes = new Date(hoy)
    lunes.setDate(hoy.getDate() - offsetLunes)
    return { desde: toISO(lunes), hasta: toISO(hoy) }
  }

  if (tipo === 'mes') {
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    return { desde: toISO(primerDia), hasta: toISO(hoy) }
  }

  // personalizado
  return {
    desde: personalizado.desde || toISO(hoy),
    hasta: personalizado.hasta || toISO(hoy),
  }
}

/** Verifica si una fecha AAAA-MM-DD cae dentro de [desde, hasta] (inclusive). */
export function fechaEnRango(fechaISO, desde, hasta) {
  if (!fechaISO) return false
  const soloFecha = String(fechaISO).slice(0, 10)
  return soloFecha >= desde && soloFecha <= hasta
}
