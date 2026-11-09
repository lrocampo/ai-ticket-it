const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]
const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
]

const dosDigitos = (n: number) => String(n).padStart(2, "0")
const hora = (d: Date) =>
  `${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`

// Sin Intl: Hermes devuelve partes vacías para algunos formatos en español y
// cada motor pone puntos y comas distintos. Así el texto es el mismo en todos.
export function formatearFecha(iso: string): string {
  const d = new Date(iso)
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}, ${hora(d)}`
}

export function formatearFechaCorta(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export function formatearFechaHora(iso: string): string {
  const d = new Date(iso)
  const dia = `${dosDigitos(d.getDate())}/${dosDigitos(d.getMonth() + 1)}/${d.getFullYear()}`
  return `${dia} ${hora(d)}`
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
