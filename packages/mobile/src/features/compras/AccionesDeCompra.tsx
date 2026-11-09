import type { Compra } from "../../types"

type Props = {
  compra: Compra
  onCompraActualizada: (compra: Compra) => void
}

// Acá van los botones de confirmar pago, cancelar, usar, reembolsar y reseñar.
// Cada acción del backend devuelve la compra actualizada, que se pasa a
// onCompraActualizada para reemplazar la que está en pantalla.
export function AccionesDeCompra(_props: Props) {
  return null
}
