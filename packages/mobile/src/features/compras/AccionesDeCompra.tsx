import { Alert, StyleSheet, View } from "react-native"

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
import { formatearPesos } from "../../utils/fechas"

type AccionConBoton = Exclude<Accion, "resenar">

const ACCIONES: Record<
  AccionConBoton,
  {
    etiqueta: string
    tono: Tono
    confirmacion: (compra: Compra) => string
    ejecutar: (id: string) => Promise<Compra>
  }
> = {
  confirmarPago: {
    etiqueta: "Confirmar pago",
    tono: "primario",
    confirmacion: (compra) =>
      `Pagar ${formatearPesos(compra.total)}. El pago es simulado, no se cobra nada.`,
    ejecutar: confirmarPago,
  },
  utilizar: {
    etiqueta: "Marcar como utilizada",
    tono: "primario",
    confirmacion: () => "Marcar la entrada como utilizada.",
    ejecutar: utilizarCompra,
  },
  cancelar: {
    etiqueta: "Cancelar compra",
    tono: "peligro",
    confirmacion: () => "La compra queda cancelada y se libera el cupo.",
    ejecutar: cancelarCompra,
  },
  reembolsar: {
    etiqueta: "Registrar reembolso",
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

  function ejecutar(accion: AccionConBoton) {
    enviar(async () => {
      onCompraActualizada(await ACCIONES[accion].ejecutar(compra.id))
    })
  }

  function pedirConfirmacion(accion: AccionConBoton) {
    const { etiqueta, tono, confirmacion } = ACCIONES[accion]
    Alert.alert(etiqueta, confirmacion(compra), [
      { text: "Cancelar", style: "cancel" },
      {
        text: etiqueta,
        style: tono === "peligro" ? "destructive" : "default",
        onPress: () => ejecutar(accion),
      },
    ])
  }

  return (
    <View style={styles.botones}>
      {acciones.map((accion) => (
        <Boton
          key={accion}
          texto={ACCIONES[accion].etiqueta}
          tono={ACCIONES[accion].tono}
          deshabilitado={enviando}
          onPress={() => pedirConfirmacion(accion)}
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
