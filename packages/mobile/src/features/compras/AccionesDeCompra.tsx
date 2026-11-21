import { AccessibilityInfo, StyleSheet, View } from "react-native"

import { Boton, type Tono } from "../../components/Boton"
import { useEnvio } from "../../hooks/useEnvio"
import {
  cancelarCompra,
  confirmarPago,
  reembolsarCompra,
  utilizarCompra,
} from "../../services/api"
import { theme } from "../../theme"
import type { Accion, Compra } from "../../types"
import { confirmar } from "../../utils/confirmar"
import { formatearPesos } from "../../utils/fechas"

type AccionConBoton = Exclude<Accion, "resenar">

const ACCIONES: Record<
  AccionConBoton,
  {
    etiqueta: string
    exito: string
    error: string
    tono: Tono
    confirmacion: (compra: Compra) => string
    ejecutar: (id: string) => Promise<Compra>
  }
> = {
  confirmarPago: {
    etiqueta: "Confirmar pago",
    exito: "Pago confirmado",
    error: "No se pudo confirmar el pago",
    tono: "primario",
    confirmacion: (compra) =>
      `Pagar ${formatearPesos(compra.total)}. El pago es simulado, no se cobra nada.`,
    ejecutar: confirmarPago,
  },
  utilizar: {
    etiqueta: "Marcar como utilizada",
    exito: "Entrada marcada como utilizada",
    error: "No se pudo marcar como utilizada",
    tono: "primario",
    confirmacion: () => "Marcar la entrada como utilizada.",
    ejecutar: utilizarCompra,
  },
  cancelar: {
    etiqueta: "Cancelar compra",
    exito: "Compra cancelada",
    error: "No se pudo cancelar la compra",
    tono: "peligro",
    confirmacion: () => "La compra queda cancelada y se libera el cupo.",
    ejecutar: cancelarCompra,
  },
  reembolsar: {
    etiqueta: "Registrar reembolso",
    exito: "Reembolso registrado",
    error: "No se pudo registrar el reembolso",
    tono: "secundario",
    confirmacion: (compra) =>
      `Registrar el reembolso de ${formatearPesos(compra.total)}.`,
    ejecutar: reembolsarCompra,
  },
}

function tieneBoton(accion: Accion): accion is AccionConBoton {
  return accion !== "resenar"
}

type Props = {
  compra: Compra
  onCompraActualizada: (compra: Compra) => void
}

export function AccionesDeCompra({ compra, onCompraActualizada }: Props) {
  const { enviando, enviar } = useEnvio()
  const acciones = compra.acciones.filter(tieneBoton)

  if (acciones.length === 0) return null

  function hacer(accion: AccionConBoton) {
    const { etiqueta, exito, error, tono, confirmacion, ejecutar } =
      ACCIONES[accion]
    enviar(error, async () => {
      const confirmada = await confirmar(
        etiqueta,
        confirmacion(compra),
        tono === "peligro",
      )
      if (confirmada) {
        onCompraActualizada(await ejecutar(compra.id))
        AccessibilityInfo.announceForAccessibility(exito)
      }
    })
  }

  return (
    <View style={styles.botones}>
      {acciones.map((accion) => (
        <Boton
          key={accion}
          texto={ACCIONES[accion].etiqueta}
          tono={ACCIONES[accion].tono}
          deshabilitado={enviando}
          onPress={() => hacer(accion)}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  botones: {
    gap: theme.espacios.s,
  },
})
