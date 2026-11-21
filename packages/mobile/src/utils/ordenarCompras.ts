import type { Compra, OrdenCompras } from "../types"

export function ordenarCompras(compras: Compra[], orden: OrdenCompras) {
  const signo = orden === "recientes" ? -1 : 1
  return [...compras].sort(
    (a, b) => signo * (Date.parse(a.creada) - Date.parse(b.creada)),
  )
}
