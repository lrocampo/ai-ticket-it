function partes(fecha: Date, opciones: Intl.DateTimeFormatOptions) {
  const resultado: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {}
  for (const parte of new Intl.DateTimeFormat("es-AR", opciones).formatToParts(
    fecha,
  )) {
    resultado[parte.type] = parte.value.replace(".", "")
  }
  return resultado
}

// Se arma a mano con formatToParts porque cada motor de Intl pone puntos y
// comas distintos ("sáb., 20 dic.") y queremos el mismo texto en todos lados.
export function formatearFecha(iso: string): string {
  const p = partes(new Date(iso), {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  return `${p.weekday} ${p.day} ${p.month}, ${p.hour}:${p.minute}`
}

export function formatearFechaCorta(iso: string): string {
  const p = partes(new Date(iso), {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  return `${p.day} ${p.month} ${p.year}`
}

export function formatearFechaHora(iso: string): string {
  const p = partes(new Date(iso), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`
}

const pesos = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 })

export function formatearPesos(monto: number): string {
  return `$ ${pesos.format(monto)}`
}

export function textoDiasRestantes(dias: number): string {
  if (dias === 0) return "Es hoy"
  if (dias === 1) return "Falta 1 día"
  return `Faltan ${dias} días`
}
