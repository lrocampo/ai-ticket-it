import type { Compra, OrdenCompras } from "../types"

export const ORDENES_COMPRAS: { valor: OrdenCompras; etiqueta: string }[] = [
  { valor: "recientes", etiqueta: "Más recientes" },
  { valor: "antiguas", etiqueta: "Más antiguas" },
]

export function ordenarCompras(compras: Compra[], orden: OrdenCompras) {
  const signo = orden === "recientes" ? -1 : 1
  return [...compras].sort(
    (a, b) =>
      signo *
      (Date.parse(a.creada) - Date.parse(b.creada) ||
        Number(a.id) - Number(b.id)),
  )
}
